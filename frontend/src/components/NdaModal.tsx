import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Signature, CheckSquare, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import type { User } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  activeUser: User;
  onNdaSigned: (updatedUser: User) => void;
}

interface Point {
  x: number;
  y: number;
}

export default function NdaModal({ activeUser, onNdaSigned }: Props) {
  // Form fields for Section 1.3 (Recipient)
  const [company, setCompany] = useState(activeUser.username);
  const [icoDob, setIcoDob] = useState('');
  const [address, setAddress] = useState('');
  const [representative, setRepresentative] = useState(activeUser.username);
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

  // Initialize Canvas layout and dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set line appearance
    ctx.strokeStyle = '#58cca8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCanvasCoordinates = (e: any): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    // Support touch vs mouse events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinate inputs perfectly based on physical element layout scaling
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
        ctx.strokeStyle = '#58cca8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
  };

  // Convert tracked point arrays to standard inline SVG string
  const compileSvgSignature = (): string => {
    if (strokes.length === 0) return '';
    
    const paths = strokes.map(stroke => {
      if (stroke.length === 0) return '';
      const dAttr = stroke.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      return `<path d="${dAttr}" stroke="#58cca8" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    }).join('');

    return `<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${paths}</svg>`;
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validation
    if (!company.trim()) return setError('Vyplňte prosím název smluvní strany (Firma nebo Jméno).');
    if (!icoDob.trim()) return setError('Vyplňte prosím IČO nebo Datum narození.');
    if (!address.trim()) return setError('Vyplňte prosím Sídlo nebo Bydliště.');
    if (!representative.trim()) return setError('Vyplňte prosím jméno oprávněného zástupce.');
    if (!location.trim()) return setError('Vyplňte prosím místo podpisu (Město).');
    if (!agreed) return setError('Před podpisem musíte vyjádřit souhlas se všemi body dohody.');
    if (strokes.length === 0) return setError('Nakreslete prosím svůj podpis do podpisové schránky.');

    setLoading(true);
    const svgString = compileSvgSignature();

    try {
      const { data } = await axios.post<User>(`${BACKEND_URL}/users/${activeUser.id}/sign-nda`, {
        signature: svgString,
        company: company.trim(),
        ico_dob: icoDob.trim(),
        address: address.trim(),
        representative: representative.trim(),
        location: location.trim()
      });

      // Trigger automatic PDF document download to user's local downloads
      const downloadUrl = `${BACKEND_URL}/users/${activeUser.id}/nda/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `NDA_Treetino_${activeUser.username}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onNdaSigned(data);
    } catch (err: any) {
      console.error(err);
      setError('Nepodařilo se odeslat podepsané NDA. Zkuste to prosím znovu.');
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
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative"
      >
        
        {/* Header Block */}
        <div className="px-8 py-4.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-xl bg-treetino-light/10 border border-treetino-light/20 text-treetino-light animate-pulse">
            <ShieldCheck className="w-5 h-5 drop-shadow-[0_0_8px_rgba(88,204,168,0.4)]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">Dohoda o Mlčenlivosti a Ochraně Informací (NDA)</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Treetino Corp B2B Partner Network</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
          
          {/* Left Side Panel: Fillable Party 1.3 Form */}
          <div className="w-full md:w-80 border-r border-slate-800/80 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-900/30">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">// Identifikace Příjemce</h3>
              <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Zadejte své osobní nebo firemní údaje pro doplnění do smlouvy</span>
            </div>

            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Jméno a příjmení / Firma</label>
                <input
                  type="text"
                  placeholder="např. Jakub Lustyk nebo EcoSystems s.r.o."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-2 px-3 text-white placeholder-slate-650 focus:outline-none focus:border-treetino-light transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">IČO / Datum narození</label>
                <input
                  type="text"
                  placeholder="např. 12345678 nebo 15.05.1990"
                  value={icoDob}
                  onChange={(e) => setIcoDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-2 px-3 text-white placeholder-slate-650 focus:outline-none focus:border-treetino-light transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sídlo / Bydliště (Adresa)</label>
                <input
                  type="text"
                  placeholder="např. Vlčetín 62, Bílá 46343"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-2 px-3 text-white placeholder-slate-650 focus:outline-none focus:border-treetino-light transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Jednající osoba / Zástupce</label>
                <input
                  type="text"
                  placeholder="Zadejte své jméno"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-2 px-3 text-white placeholder-slate-650 focus:outline-none focus:border-treetino-light transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Místo podpisu (Město)</label>
                <input
                  type="text"
                  placeholder="např. Praze, Liberci, Brně"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl py-2 px-3 text-white placeholder-slate-650 focus:outline-none focus:border-treetino-light transition-colors"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-650/5 border border-blue-500/10 rounded-2xl">
              <span className="text-[8px] font-mono text-blue-400 font-bold uppercase tracking-wider block">Poskytovatel (Treetino)</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Poskytovatelem informací je společnost Treetino corp s.r.o., zastoupená Dominikem Maškem.
              </p>
            </div>
          </div>

          {/* Right Side: The full, exact, non-hallucinated Czech NDA Agreement Scroll view */}
          <div className="flex-1 overflow-y-auto p-8 text-xs text-slate-300 space-y-6 leading-relaxed bg-slate-950/20 font-sans">
            
            <div className="text-center font-mono font-bold text-white text-sm border border-slate-800/80 p-4.5 rounded-2xl bg-slate-900/35 shrink-0">
              DOHODA O MLČENLIVOSTI, OCHRANĚ INFORMACÍ A ZÁKAZU JEJICH ZNEUŽITÍ
              <div className="text-[10px] text-slate-500 font-normal mt-1.5 font-sans">
                dle ustanovení § 1746 odst. 2 zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů.
              </div>
            </div>

            {/* Smluvni strany Block */}
            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wider">// I. Smluvní strany</h4>
              <div className="space-y-3 pl-2">
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-850">
                  <div className="font-bold text-white mb-1.5 text-[11px] font-mono tracking-wide text-treetino-light">1. Poskytovatel:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                    <div>Obchodní firma: <strong className="text-white">Treetino corp s.r.o.</strong></div>
                    <div>IČO: <strong className="text-white">10800107</strong></div>
                    <div className="col-span-2">Sídlo: <strong className="text-white">Vlčetín 62, Bílá 46343</strong></div>
                    <div className="col-span-2">Zastoupena panem: <strong className="text-white">Dominikem Maškem</strong></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-[#58cca8]/30 shadow-[0_0_15px_rgba(88,204,168,0.05)]">
                  <div className="font-bold text-white mb-1.5 text-[11px] font-mono tracking-wide text-[#58cca8]">2. Příjemce:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                    <div>Jméno / Firma: <strong className={company ? "text-white" : "text-amber-500 animate-pulse font-sans italic"}>
                      {company || '[ Doplňte vlevo ]'}
                    </strong></div>
                    <div>IČO / Datum nar.: <strong className={icoDob ? "text-white" : "text-amber-500 animate-pulse font-sans italic"}>
                      {icoDob || '[ Doplňte vlevo ]'}
                    </strong></div>
                    <div className="col-span-2">Sídlo / Bydliště: <strong className={address ? "text-white" : "text-amber-500 animate-pulse font-sans italic"}>
                      {address || '[ Doplňte vlevo ]'}
                    </strong></div>
                    <div className="col-span-2">Zastoupen/a panem: <strong className={representative ? "text-white" : "text-amber-500 animate-pulse font-sans italic"}>
                      {representative || '[ Doplňte vlevo ]'}
                    </strong></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-2">
                (dále společně jen jako „Smluvní strany“, každý samostatně pak jako „Smluvní strana“)
              </p>
              <p className="pl-2">
                Smluvní strany uzavírají níže uvedeného dne, měsíce a roku tuto Dohodu o mlčenlivosti, ochraně informací a zákazu jejich zneužití (dále jen „Dohoda“).
              </p>
            </div>

            {/* Article II */}
            <div className="space-y-2">
              <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wider">// II. Účel a předmět</h4>
              <p>
                2.1 Účelem této Dohody je ochrana důvěrných informací Smluvních stran, s nimiž se Smluvní strany seznámí v rámci jednání o spolupráci a následné spolupráci, v jejímž rámci bude Příjemce poskytovat společnosti Treetino corp s.r.o. Konzultační a prodejní služby (dále též jako „vzájemná spolupráce“).
              </p>
              <p>
                2.2 Předmětem této Dohody je bližší vymezení důvěrných informaci Smluvních stran a převzetí závazku Smluvních stran zachovat o těchto důvěrných informacích mlčenlivost a nesdělit je ani neumožnit k nim přístup třetím osobám, nebo je nevyužít ve svůj prospěch nebo ve prospěch třetích osob, není-li v této Dohodě stanoveno jinak.
              </p>
              <p>
                2.3 Důvěrnými informacemi se pro účely této Dohody a po celou dobu trvání vzájemné spolupráce Smluvních stran rozumí, bez ohledu na formu a způsob jejich sdělení či zachycení a až do doby jejich zveřejnění, jakékoli a všechny skutečnosti, které se Smluvní strana v průběu vzájemné spolupráce dozví, a/nebo které jí druhá Smluvní strana v průběhu vzájemné spolupráce zpřístupní, jakož i sama existence těchto skutečností a vzájemné spolupráce Smluvních stran (dále jen „Důvěrné informace“).
              </p>
              <p>
                2.4 Obchodní tajemství a Důvěrné informace ve smyslu § 1730 občanského zákoníku touto Dohodou chráněné tvoří rovněž veškeré skutečnosti technické, ekonomické, právní a výrobní povahy v hmotné nebo nehmotné formě, které byly jednou ze Smluvních stran takto označeny a byly poskytnuty druhé Smluvní straně. Tyto skutečnosti nejsou v příslušných obchodních kruzích zpravidla běžně dostupné a obě Smluvní strany mají zájem na jejich utajení a na odpovídajícím způsobu jejich ochrany. Obchodní tajemství a Důvěrné informace jsou dále společně označeny též jako „Chráněné informace“.
              </p>
            </div>

            {/* Article III */}
            <div className="space-y-2">
              <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wider">// III. Závazky mlčenlivosti</h4>
              <p>
                3.1 Obě smluvní strany se zavazují, že veškeré skutečnosti spadající do oblasti Chráněných informací nebudou dále rozšiřovat nebo reprodukovat a nezpřístupní je třetí straně. Smluvní strany se dále zavazují, že Chráněné informace nepoužijí v rozporu s jejich účelem ani účelem jejich poskytnutí pro své potřeby nebo ve prospěch třetích osob.
              </p>
              <p>
                3.2 Obě Smluvní strany omezí počet zaměstnanců pro styk s těmito Chráněnými informacemi a přijmou účinná opatření pro zamezení úniku informací.
              </p>
              <p>
                3.3 V případě, že jedna Smluvní strana bude nezbytně potřebovat k zajištění některé činnosti třetí stranu, může jí předat informace, které jsou předmětem ochrany dle této Dohody, pouze s předchozím písemným souhlasem druhé Smluvní strany, a to za podmínky, že se třetí strana smluvně zaváže k jejich ochraně v rozsahu jako samotná Smluvní strana.
              </p>
              <p>
                3.4 Povinnost plnit ustanovení této Dohody se nevztahuje na ty Chráněné informace, které:
              </p>
              <ul className="list-alpha pl-6 space-y-1">
                <li>a. mohou být zveřejněny bez porušení této Dohody;</li>
                <li>b. byly písemným souhlasem druhé Smluvní strany uvolněny od těchto omezení;</li>
                <li>c. jsou veřejně dostupné nebo byly zveřejněny jinak, než porušením povinnosti jedné ze Smluvních stran;</li>
                <li>d. jsou příjemci prokazatelně známy dříve, než je sdělí Smluvní strana;</li>
                <li>e. byly vyžádány soudem, státním zastupitelstvím nebo věcně příslušným správním orgánem na základě zákona a jsou použity pouze k tomuto účelu.</li>
              </ul>
              <p>
                3.5 Poskytnutí informací spadajících do oblasti Chráněných informací nezakládá žádné právo na licenci, ochrannou známku, patent, právo užití nebo šíření autorského díla, ani jakékoliv jiné právo duševního nebo průmyslového vlastnictví.
              </p>
            </div>

            {/* Article IV */}
            <div className="space-y-2">
              <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wider">// IV. Smluvní pokuty</h4>
              <p>
                4.1 Způsobí-li jedna Smluvní strana druhé Smluvní straně škodu porušením této Dohody, je smluvní pokuta stanovena na 500 000 Kč.
              </p>
            </div>

            {/* Article V */}
            <div className="space-y-2">
              <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wider">// V. Závěrečná ustanovení</h4>
              <p>
                5.1 Dohoda nabývá platnosti a účinnosti dnem podpisu oprávněnými zástupci obou smluvních stran.
              </p>
              <p>
                5.2 Bude-li shledáno nebo stane-li se některé ustanovení této Dohody neplatným, nevymahatelným nebo neúčinným, nedotýká se tato neplatnost, nevymahatelnost či neúčinnosti ostatních ustanovení této Dohody.
              </p>
              <p>
                5.3 Dohoda se uzavírá na dobu neurčitou.
              </p>
              <p>
                5.4 Veškeré změny a doplňky této Dohody vyžadují písemný souhlas obou smluvních stran ve formě následně číslovaných dodatků.
              </p>
              <p>
                5.5 Právní vztahy vzniklé z této Dohody a vyplývající z této Dohody se řídí právním řádem České republiky.
              </p>
              <p>
                5.6 Tato Dohoda je vyhotovena ve dvou vyhotoveních, z nichž každá Smluvní strana obdrží po jednom z nich.
              </p>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex justify-between font-mono text-[10px] text-slate-500">
              <div>V Praze dne: {todayStr}</div>
              <div>V {location.trim() || '__________'} dne: {todayStr}</div>
            </div>

          </div>

        </div>

        {/* Action and signature boxes at bottom */}
        <form onSubmit={handleSign} className="p-6 bg-slate-955 border-t border-slate-800 shrink-0 flex flex-col gap-4">
          
          {/* Checkbox agreement */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 bg-slate-900 border-slate-700 rounded text-[#58cca8] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="agreement" className="text-[11px] text-slate-350 leading-snug cursor-pointer select-none">
              Potvrzuji, že jsem se seznámil/a s celým obsahem této Dohody o mlčenlivosti (NDA) a vyjadřuji s ní svůj bezvýhradný a plný souhlas.
            </label>
          </div>

          {/* Interactive drawing signature boxes side-by-side */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
            
            {/* Dominik Masek Signature Box */}
            <div className="flex flex-col justify-between h-48 p-1">
              <div>
                <span className="text-[8px] text-slate-500 uppercase font-mono block">Za Treetino corp s.r.o.</span>
                <span className="text-xs font-bold text-white block mt-0.5">Dominik Mašek</span>
                <span className="text-[8px] text-slate-550 font-mono block leading-none mt-0.5">Jednatel</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono my-1 bg-slate-950/20 py-0.5 px-1.5 rounded border border-slate-900 select-none">
                V Praze dne: {todayStr}
              </div>
              <div className="relative h-28 flex items-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 px-2 justify-center">
                <img 
                  src="/branding/signature_masek_2.png" 
                  alt="Dominik Mašek podpis" 
                  className="h-20 w-auto opacity-90 object-contain filter invert drop-shadow-[0_0_2px_rgba(255,255,255,0.4)] pointer-events-none" 
                />
              </div>
            </div>

            {/* Canvas signature for user */}
            <div className="flex flex-col justify-between h-48 p-1 border-l border-slate-800/80 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-mono block">Za B2B Partnera (Podpis kreslete myší/padem)</span>
                  <span className="text-xs font-bold text-white block mt-0.5">{representative || activeUser.username}</span>
                </div>
                {strokes.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[9px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Smazat
                  </button>
                )}
              </div>
              <div className="text-[9px] text-slate-400 font-mono my-1 bg-slate-950/20 py-0.5 px-1.5 rounded border border-slate-900 select-none">
                V {location.trim() || '__________'} dne: {todayStr}
              </div>

              {/* Drawing Area Canvas */}
              <div className="relative h-28 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden cursor-crosshair">
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
                  className="w-full h-full block bg-slate-950"
                />
                {strokes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-650 pointer-events-none select-none">
                    Zde se podepište...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action trigger footer */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900 pt-3">
            <div className="flex-1">
              {error && (
                <div className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-treetino-light hover:bg-[#3ec19b] disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Signature className="w-3.5 h-3.5" />
              )}
              Podepsat a Vstoupit
            </button>
          </div>

        </form>

      </motion.div>
    </div>
  );
}
