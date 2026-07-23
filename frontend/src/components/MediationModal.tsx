import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Signature, CheckSquare, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import type { User } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  activeUser: User;
  onMediationSigned: (updatedUser: User) => void;
}

interface Point {
  x: number;
  y: number;
}

export default function MediationModal({ activeUser, onMediationSigned }: Props) {
  // Form fields for Section 1.3 (Zprostředkovatel) - Pre-populated with NDA values
  const [company, setCompany] = useState(activeUser.nda_company || activeUser.username);
  const [icoDob, setIcoDob] = useState(activeUser.nda_ico_dob || '');
  const [address, setAddress] = useState(activeUser.nda_address || '');
  const [representative, setRepresentative] = useState(activeUser.nda_representative || activeUser.username);
  const [location, setLocation] = useState(activeUser.nda_location || '');

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString('cs-CZ');

  // Drawing pad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#58cca8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCanvasCoordinates = (e: any): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const coord = getCanvasCoordinates(e);
    if (!coord) return;

    setIsDrawing(true);
    setCurrentStroke([coord]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#58cca8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(coord.x, coord.y);
      }
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coord = getCanvasCoordinates(e);
    if (!coord) return;

    setCurrentStroke(prev => [...prev, coord]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(coord.x, coord.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
  };

  // Convert drawn strokes to a standard vector SVG string
  const compileSvgString = (): string => {
    if (strokes.length === 0) return '';
    let pathData = '';
    strokes.forEach(stroke => {
      if (stroke.length === 0) return;
      const dAttr = stroke.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      pathData += `<path d="${dAttr}" fill="none" stroke="#58cca8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    });
    return `<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg">${pathData}</svg>`;
  };

  const handleSign = async () => {
    setError(null);

    if (!company.trim() || !icoDob.trim() || !address.trim() || !representative.trim() || !location.trim()) {
      setError('Vyplňte prosím všechna identifikační pole na levé straně.');
      return;
    }

    if (strokes.length === 0) {
      setError('Podepište prosím smlouvu nakreslením svého podpisu do pole níže.');
      return;
    }

    if (!agreed) {
      setError('Před pokračováním musíte potvrdit souhlas se zněním smlouvy zaškrtnutím políčka.');
      return;
    }

    setLoading(true);
    const svgString = compileSvgString();

    try {
      const { data } = await axios.post<User>(`${BACKEND_URL}/users/${activeUser.id}/sign-mediation`, {
        signature: svgString,
        company: company.trim(),
        ico_dob: icoDob.trim(),
        address: address.trim(),
        representative: representative.trim(),
        location: location.trim()
      });

      // Trigger automatic PDF document download
      const downloadUrl = `${BACKEND_URL}/users/${activeUser.id}/mediation/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Smlouva_Zprostredkovani_Treetino_${activeUser.username}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onMediationSigned(data);
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response && [401, 404].includes(err.response.status)) {
        localStorage.removeItem('treetino_user');
        sessionStorage.removeItem('treetino_user');
        if (activeUser) {
          localStorage.removeItem(`treetino_draft_${activeUser.id}`);
          localStorage.removeItem(`treetino_deals_${activeUser.id}`);
        }
        window.location.reload();
      } else {
        setError('Nepodařilo se odeslat podepsanou smlouvu. Zkuste to prosím znovu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden font-sans">
      
      {/* Background neon aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#58cca8]/5 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl h-[88vh] bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side: Parameters / Details inputs */}
        <div className="w-full md:w-[32%] border-r border-slate-800/80 p-6 flex flex-col justify-between overflow-y-auto bg-slate-950/30">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="bg-treetino-light/10 text-treetino-light text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Krok 2 ze 2</span>
              <span className="text-slate-500 text-[10px]">Onboarding</span>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-treetino-light" />
                Smlouva o zprostředkování
              </h2>
              <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                Zadejte prosím své identifikační údaje pro zprostředkovatelskou smlouvu. Hodnoty byly předvyplněny z prvního kroku.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Jméno a příjmení / Firma</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-treetino-light text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">IČO / Datum narození</label>
                <input
                  type="text"
                  value={icoDob}
                  onChange={(e) => setIcoDob(e.target.value)}
                  placeholder="např. 12345678 nebo 15.05.1990"
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-treetino-light text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Sídlo / Bydliště (Adresa)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="např. Vlčetín 62, Bílá 46343"
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-treetino-light text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Jednající osoba / Zástupce</label>
                <input
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  placeholder="Jméno jednající osoby (pokud je to firma)"
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-treetino-light text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">Místo podpisu (Město)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="např. Praha"
                  className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-treetino-light text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[9px] text-slate-500 font-mono">
            Treetino Partner Platform &copy; 2026
          </div>
        </div>

        {/* Right Side: Contract Text Scroll Area & Signature block */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
          
          {/* Scrollable contract text block */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent select-text bg-slate-950/10 p-5 border border-slate-800/50 rounded-2xl">
            <div className="space-y-6 text-slate-300 text-[11px] leading-relaxed max-w-4xl mx-auto">
              
              <div className="text-center pb-4 border-b border-slate-800/85">
                <h1 className="text-sm font-bold text-white tracking-widest uppercase">SMLOUVA O ZPROSTŘEDKOVÁNÍ</h1>
                <span className="text-[9px] text-slate-400 block mt-1">uzavřená podle § 2445 a násl. zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů</span>
              </div>

              {/* Section I */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// I. Smluvní strany</h3>
                <div className="bg-slate-900/60 p-3 border border-slate-800/50 rounded-xl space-y-2 mb-3">
                  <p><strong>1. Zájemce: Treetino Corp s.r.o.</strong></p>
                  <p>se sídlem: Bílá - Vlčetín 62, 463 43 Bílá</p>
                  <p>IČO: 10800107, DIČ: CZ10800107</p>
                  <p>zastoupená: Dominikem Maškem (jednatel)</p>
                  <p className="text-[9px] text-slate-400 font-mono">(dále jen „Zájemce“)</p>
                </div>
                <div className="bg-slate-900/60 p-3 border border-slate-800/50 rounded-xl space-y-2">
                  <p><strong>2. Zprostředkovatel: {company || <span className="text-amber-500 italic">[ Doplňte vlevo ]</span>}</strong></p>
                  <p>bydliště/sídlo: {address || <span className="text-amber-500 italic">[ Doplňte vlevo ]</span>}</p>
                  <p>IČO / Datum nar.: {icoDob || <span className="text-amber-500 italic">[ Doplňte vlevo ]</span>}</p>
                  <p>zastoupený/á: {representative || <span className="text-amber-500 italic">[ Doplňte vlevo ]</span>}</p>
                  <p className="text-[9px] text-slate-400 font-mono">(dále jen „Zprostředkovatel“)</p>
                </div>
                <p className="text-[9px] text-slate-400 text-center mt-2">(Zájemce a Zprostředkovatel dále společně též jako „Smluvní strany“)</p>
              </div>

              {/* Section II */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// II. Předmět smlouvy</h3>
                <p>
                  <strong>2.1.</strong> Zprostředkovatel se touto smlouvou zavazuje, že bude vyvíjet činnost směřující k tomu, aby Zájemce měl příležitost uzavřít s třetími osobami (dále jen „Klienti“) kupní smlouvy nebo smlouvy o dílo na dodávku produktů Zájemce.
                </p>
                <p className="mt-2">
                  <strong>2.2.</strong> Předmětem zprostředkování jsou výhradně inovativní produkty Zájemce prezentované na webové stránce www.treetino.eu, a to konkrétně chytré stromy <strong>Treetino V1</strong>, <strong>Treetino V2</strong> a <strong>Větrná turbína</strong> (dále jen „Produkty“).
                </p>
                <p className="mt-2">
                  <strong>2.3.</strong> Zprostředkovatel je oprávněn Produkty aktivně nabízet a vyhledávat zájemce. Zprostředkovatel však není bez předchozí písemné plné moci oprávněn za Zájemce uzavírat jakékoliv smlouvy ani přijímat plnění.
                </p>
              </div>

              {/* Section III */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// III. Provize a platební podmínky</h3>
                <p>
                  <strong>3.1.</strong> Za obstarání příležitosti k uzavření smlouvy s Klientem náleží Zprostředkovateli provize ve výši <strong>3 % z čisté prodejní ceny bez DPH</strong> u každého takto realizovaného obchodu. Nárok na tuto provizi vzniká Zprostředkovateli ve stejné výši i v případě, že pouze zajistí kontakt na Klienta a samotné smluvní jednání (prodej) dokončí Zájemce.
                </p>
                <p className="mt-2">
                  <strong>3.2.</strong> Nárok na provizi vzniká Zprostředkovateli výlučně v okamžiku, kdy Klient v plné výši uhradí Zájemci první vystavenou fakturu (např. zálohou fakturu či fakturu za první etapu plnění) vztahující se k danému obchodu.
                </p>
                <p className="mt-2">
                  <strong>3.3.</strong> Provize je splatná na základě daňového dokladu (fakturu) řádně vystaveného Zprostředkovatelem. Lhůta splatnosti činí 14 dnů ode dne, kdy byla příslušná platba od Klienta prokazatelně připsána na bankovní účet Zájemce.
                </p>
              </div>

              {/* Section IV */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// IV. Dohoda o mlčenlivosti (NDA) a ochrana práv</h3>
                <p>
                  <strong>4.1.</strong> Zprostředkovatel výslovně bere na vědomí, že Produkty podléhají patentové ochraně a ochraně průmyslových vzorů, k nimž vykonává práva Zájemce. Zprostředkovatel nesmí Produkty jakýmkoliv způsobem napodobovat, zpětně analyzovat za účelem zjištění jejich konstrukce (reverse engineering), ani k takovému jednání poskytnout součinnost třetí straně.
                </p>
                <p className="mt-2">
                  <strong>4.2.</strong> Veškeré obchodní, technické a finanční informace, včetně informací o klientech, obchodních strategiích a cenotvorbě, se kterými se Zprostředkovatel při své činnosti seznámí, mají povahu důvěrných informací tvořících obchodní tajemství Zájemce.
                </p>
                <p className="mt-2">
                  <strong>4.3.</strong> Zprostředkovatel se zavazuje zachovávat absolutní mlčenlivost ohledně všech důvěrných informací. Tento závazek trvá po celou dobu trvání této smlouvy a dále po dobu 5 (pěti) let po jejím ukončení.
                </p>
              </div>

              {/* Section V */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// V. Smluvní pokuty a náhrada škody</h3>
                <p>
                  <strong>5.1.</strong> V případě porušení jakékoliv povinnosti stanovené v čl. IV. této smlouvy ze strany Zprostředkovatele je Zprostředkovatel povinen uhradit Zájemci smluvní pokutu ve výši <strong>500 000 Kč</strong> (slovy: pět set tisíc korun českých) za každé jednotlivé porušení.
                </p>
                <p className="mt-2">
                  <strong>5.2.</strong> Ujednáním o smluvní pokutě ani jejím zaplacením není nijak dotčen nárok Zájemce na náhradu škody v plné výši, přesahuje-li výše škody sjednanou smluvní pokutu.
                </p>
              </div>

              {/* Section VI */}
              <div>
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">// VI. Závěrečná ustanovení</h3>
                <p>
                  <strong>6.1.</strong> Tato smlouva se uzavírá na dobu neurčitou. Smlouvu lze ukončit písemnou výpovědí kteroukoliv ze Smluvních stran i bez udání důvodu. Výpovědní doba činí 1 měsíc a počíná běžet prvním dnem kalendářního měsíce následujícího po doručení výpovědi druhé Smluvní straně.
                </p>
                <p className="mt-2">
                  <strong>6.2.</strong> Právní vztahy touto smlouvou výslovně neupravené se řídí příslušnými ustanoveními zákona č. 89/2012 Sb., občanský zákoník, v platném znění.
                </p>
                <p className="mt-2">
                  <strong>6.3.</strong> Smlouva je sepsána ve dvou vyhotoveních s platností originálu, z nichž každá Smluvní strana obdrží po jednom vyhotovení.
                </p>
                <p className="mt-2">
                  <strong>6.4.</strong> Smluvní strany prohlašují, že si tuto smlouvu před jejím podpisem přečetly, že byla uzavřena po vzájemném projednání, podle jejich pravé a svobodné vůle, určitě, vážně a srozumitelně, na důkaz čehož připojují své podpisy.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Agreement check & validation message */}
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 px-1">
              <button 
                onClick={() => setAgreed(prev => !prev)}
                className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 border rounded hover:border-treetino-light transition-colors"
                style={{ borderColor: agreed ? '#58cca8' : '#334155', backgroundColor: agreed ? '#58cca8' : 'transparent' }}
              >
                {agreed && <CheckSquare className="w-3.5 h-3.5 text-slate-950 font-bold" />}
              </button>
              <p className="text-[10px] text-slate-400 select-none">
                Potvrzuji, že jsem se seznámil/a s celým obsahem této Smlouvy o zprostředkování a vyjadřuji s ní svůj bezvýhradný a plný souhlas.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-[10.5px]">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Signature Box grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Dominik Masek pre-signed signature */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[7.5px] uppercase tracking-wider text-slate-500 block font-mono">Za Zájemce (Treetino s.r.o.)</span>
                  <span className="text-[10.5px] font-bold text-white block mt-0.5">Dominik Mašek</span>
                  <span className="text-[8px] text-slate-500 block">Jednatel</span>
                  <div className="border-t border-slate-900 mt-2 pt-1.5 text-[8px] text-slate-400 font-mono">
                    V Praze dne: {todayStr}
                  </div>
                </div>
                
                <div className="h-20 bg-slate-950/60 rounded-xl border border-slate-900/80 mt-3 relative overflow-hidden flex items-center justify-center p-3 select-none">
                  <img 
                    src="/branding/signature_masek_2.png" 
                    alt="Podpis Dominik Mašek"
                    className="max-h-12 w-auto object-contain opacity-85 select-none pointer-events-none filter invert"
                  />
                  <div className="absolute inset-0 border border-dashed border-slate-800/40 rounded-xl pointer-events-none" />
                </div>
              </div>

              {/* Right Column: Interactive drawing pad for the Partner */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[7.5px] uppercase tracking-wider text-slate-500 block font-mono">Za Zprostředkovatele (Podpis)</span>
                    <span className="text-[10.5px] font-bold text-white block mt-0.5">{company || '__________'}</span>
                    <div className="border-t border-slate-900 mt-2 pt-1.5 text-[8px] text-slate-400 font-mono">
                      V {location || '__________'} dne: {todayStr}
                    </div>
                  </div>
                  
                  {strokes.length > 0 && (
                    <button 
                      onClick={clearCanvas}
                      className="text-[9px] hover:text-red-400 text-slate-500 transition-colors flex items-center gap-1 mt-0.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Vymazat
                    </button>
                  )}
                </div>

                <div className="h-20 bg-slate-950/60 rounded-xl border border-[#58cca8]/10 mt-3 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={220}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                  />
                  {strokes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                      <Signature className="w-4 h-4 text-slate-700/60 mr-1.5" />
                      <span className="text-[9px] text-slate-600 tracking-wide font-medium">Zde se podepište...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Signature Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSign}
                disabled={loading}
                className="w-full md:w-auto bg-treetino-light hover:bg-[#46bc98] text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-[11px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Odesílání...
                  </>
                ) : (
                  <>
                    <Signature className="w-3.5 h-3.5" />
                    Podepsat a Vstoupit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
