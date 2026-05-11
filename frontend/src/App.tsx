import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2,
  FileText,
  ToggleLeft,
  ToggleRight,
  Zap,
  Sun,
  Wind,
  Globe,
  Shield,
  TrendingUp,
  MapPin,
  Ruler,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import type { SelectedLocation, ProductType, CalcResult } from './types';
import { runQuickScan } from './api';
import type { CalculatorParams } from './calculator';
import MapCanvas from './components/MapCanvas';
import AnalyticsPanel from './components/AnalyticsPanel';
import OfferModal from './components/OfferModal';
// @ts-ignore
import RotatingText from './components/reactbits/RotatingText/RotatingText';
// @ts-ignore
import BlurText from './components/reactbits/BlurText';

// ─── Declare model-viewer JSX ─────────────────────────────
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string; alt?: string; 'auto-rotate'?: boolean | string;
          'camera-controls'?: boolean | string; 'shadow-intensity'?: string;
          exposure?: string; loading?: string; ar?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

const PRODUCT_DATA = [
  {
    id: 'main-tree',
    name: 'Hlavní Energetický Strom',
    description: '300 solárních listů + integrovaný vítr',
    image: '/products/strom1.png',
    investment: 5000000
  },
  {
    id: 'small-tree',
    name: 'Malý Strom Prototyp',
    description: '180 solárních listů — Předobjednávka',
    image: '/products/strom3.png',
    investment: 1500000
  },
  {
    id: 'standalone-turbine',
    name: 'Střešní Turbíny',
    description: 'Tichá transparentní větrná technologie',
    image: '/products/strom2.png',
    investment: 0 // Calculated based on roof area
  }
];

export default function App() {
  // ─── State ────────────────────────────────────────────
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [product, setProduct] = useState<ProductType>('main-tree');
  const [unitCount, setUnitCount] = useState(1);
  const [energyCost, setEnergyCost] = useState(5.0); // Standard CZK/kWh
  const [sunnyDays, setSunnyDays] = useState(200);
  const [windyDays, setWindyDays] = useState(250);
  const [windHours, setWindHours] = useState(7);
  const [aiOptimization, setAiOptimization] = useState(true);
  const [showFutureRevenue, setShowFutureRevenue] = useState(false);
  const [carsPerDay, setCarsPerDay] = useState(1);
  const [carbonCreditPercentage, setCarbonCreditPercentage] = useState(60);
  const [heliumHotspots, setHeliumHotspots] = useState(1);
  const [buildingConsumption, setBuildingConsumption] = useState(360);
  const [discount, setDiscount] = useState(5.0);

  // ─── Auto-update Unit Count ────────────
  useEffect(() => {
    if (location?.pins && location.pins.length > 0) {
      setUnitCount(location.pins.length);
    } else {
      setUnitCount(0);
    }
  }, [location]);

  const [web3Enabled, setWeb3Enabled] = useState(false);
  const [esgEnabled, setEsgEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Location selected from map ───────────────────────
  const handleLocationSelect = useCallback((loc: SelectedLocation) => {
    setLocation(loc);
    setResult(null);
    setError(null);
  }, []);

  // ─── Auto-fetch Spot Potential (Quick Scan) ───────────
  useEffect(() => {
    if (!location || location.potential) return;
    let isMounted = true;
    const triggerScan = async () => {
      try {
        const potential = await runQuickScan(location.lat, location.lon);
        if (isMounted) setLocation(prev => prev ? { ...prev, potential } : null);
      } catch (e) {
        console.error('Quick scan failed', e);
      }
    };
    triggerScan();
    return () => { isMounted = false; };
  }, [location]);

  const handleCalculate = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const productCounts = location.pins.reduce((acc, pin) => {
          acc[pin.type] = (acc[pin.type] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      // Add default 1 if empty pins to at least compute the selected product
      if (Object.keys(productCounts).length === 0) {
          productCounts[product] = 1;
      }

      const calcParams = {
        productCounts,
        energyPrice: energyCost,
        sunnyDays,
        windyDays,
        windHours,
        aiOptimization,
        web3Enabled,
        showFutureRevenue,
        carsPerDay,
        carbonCreditPercentage,
        heliumHotspots,
        buildingHeight: 0,
        buildingConsumption,
        discount
      };

      const { data } = await axios.post<CalcResult>(`${BACKEND_URL}/calculate-roi`, {
        lat: location.lat,
        lon: location.lon,
        params: calcParams
      });

      setResult(data);
    } catch (e) {
      console.error(e);
      setError('Výpočet selhal. Zkontrolujte prosím své připojení a polohu.');
    } finally {
      setLoading(false);
    }
  };

  const annualSavings = result ? result.totalAnnualRevenue : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* 1. MAP */}
      <MapCanvas
        onLocationSelect={handleLocationSelect}
        selectedLocation={location}
        onPinsChange={(pins) => {
          setUnitCount(pins.length);
          setLocation(prev => prev ? { ...prev, pins } : null);
        }}
        product={product}
      />

      {/* 2. TOP BAR & CONTROLS */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-8 py-6 pointer-events-none">
        {/* Unified Branding Plate */}
        {/* Action Group - Unified Branding Plate */}
        <div className="flex items-center gap-6 pointer-events-auto neo-glass-plate px-6 py-4">
          <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-8 w-auto filter brightness-0 invert" />
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <RotatingText
              texts={['Energetické Stromy', 'ROI Kalkulačka', 'Budoucnost Energie']}
              mainClassName="text-[10px] font-black uppercase tracking-[0.2em] text-treetino-light"
              rotationInterval={3000}
            />
            <span className="text-[9px] text-slate-500 font-black tracking-widest">V2.0 PRO</span>
          </div>
        </div>
      </div>

      {/* 2.5 FLOATING ACTION CONTROLS (Bottom Left) */}
      <div className="absolute bottom-8 left-8 z-40 flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {result && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setShowModal(true)}
              className="neo-btn-secondary pointer-events-auto py-4 px-6 shadow-hyper-glow flex items-center gap-3 border-treetino-light/30 bg-slate-900/80"
            >
              <FileText className="w-5 h-5 text-treetino-light" />
              <span className="text-xs font-black">EXPORTOVAT PDF NABÍDKU</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 3. COMMAND CENTER */}
      <motion.aside
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-24 right-8 bottom-8 w-96 z-40 neo-panel p-6 flex flex-col gap-6 overflow-y-auto"
      >
        <div className="space-y-1 bg-slate-950 -mx-6 -mt-6 p-6 rounded-t-xl border-b border-slate-800">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Konfigurace</h2>
          <div className="h-1 w-12 bg-treetino-light shadow-[0_0_12px_rgba(39,98,173,0.5)]" />
        </div>

        {/* Product Selection Horizontal Grid */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Zap className="w-3 h-3 text-treetino-light" /> 01 VÝBĚR JEDNOTKY
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCT_DATA.map((pd) => (
              <motion.button
                key={pd.id}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setProduct(pd.id as ProductType);
                  setResult(null);
                }}
                className={`relative group overflow-hidden h-28 text-left transition-all rounded-2xl border-2 ${product === pd.id
                  ? 'border-treetino-light shadow-hyper-glow bg-slate-800'
                  : 'border-white/5 bg-slate-900/50 hover:border-white/20'
                  }`}
              >
                <div className="absolute inset-0 z-0">
                  <img src={pd.image} alt={pd.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>
                <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                  <div className={`text-[10px] font-black text-white uppercase tracking-tighter leading-none ${product === pd.id ? 'text-treetino-accent' : ''}`}>
                    {pd.name.split(' ')[0]}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Context Card */}
        {location && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-inner-light">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-treetino-light" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Analýza Lokality</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-treetino-light/80">{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Solární potenciál</span>
                <div className="text-lg font-black text-white">{location.potential ? `${location.potential.solarIndex}%` : '--'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Rychlost větru</span>
                <div className="text-lg font-black text-white">{location.potential ? `${location.potential.avgWindSpeed}m/s` : '--'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-2 pb-2 border-b border-white/5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-2">
                <MapPin className="w-3 h-3 text-treetino-light" /> Extrahované jednotky z mapy
              </label>
              <span className="text-sm font-bold text-white leading-none">{unitCount}x Systém</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Cena za kWh</label>
              <span className="text-sm font-bold text-white leading-none">{energyCost.toFixed(2)} CZK</span>
            </div>
            <input type="range" min={1.00} max={15.00} step={0.1} value={energyCost}
              onChange={(e) => setEnergyCost(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Spotřeba</label>
              <span className="text-sm font-bold text-white leading-none">{buildingConsumption} MWh</span>
            </div>
            <input type="range" min={10} max={5000} step={10} value={buildingConsumption}
              onChange={(e) => setBuildingConsumption(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sleva</label>
              <span className="text-sm font-bold text-white leading-none">{discount.toFixed(1)}%</span>
            </div>
            <input type="range" min={0} max={30} step={0.5} value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setWeb3Enabled(!web3Enabled)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${web3Enabled ? 'bg-treetino-light/10 border-treetino-light shadow-neo-accent' : 'bg-slate-900 border-slate-800'}`}
          >
            <Globe className={`w-5 h-5 mb-2 ${web3Enabled ? 'text-treetino-light' : 'text-slate-600'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${web3Enabled ? 'text-white' : 'text-slate-500'}`}>Web3</span>
          </button>

          <button
            onClick={() => setEsgEnabled(!esgEnabled)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${esgEnabled ? 'bg-treetino-light/10 border-treetino-light shadow-neo-accent' : 'bg-slate-900 border-slate-800'}`}
          >
            <Shield className={`w-5 h-5 mb-2 ${esgEnabled ? 'text-treetino-light' : 'text-slate-600'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${esgEnabled ? 'text-white' : 'text-slate-500'}`}>ESG</span>
          </button>
        </div>

        <div className="flex-1 min-h-[1rem]" />

        {/* ROI Results Bar */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-4 py-3 rounded-xl bg-treetino-light border-2 border-treetino-middle mb-2 overflow-hidden"
            >
              <span className="text-[9px] font-black text-treetino-accent uppercase tracking-[0.2em] mb-1 block">Předpokládané roční úspory</span>
              <div className="flex items-baseline gap-2">
                <BlurText text={`${annualSavings.toLocaleString()}`} className="text-2xl font-black text-white !justify-start !text-left" animateBy="characters" />
                <span className="text-2xl font-black text-white">CZK</span>
                <span className="text-xs font-bold text-treetino-accent">ČISTÉHO</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!location || loading}
          className="neo-btn-primary flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />ANALYZUJI...</>
          ) : (
            <><TrendingUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />SPOČÍTAT NÁVRATNOST</>
          )}
        </button>
      </motion.aside>

      {/* 4. ANALYTICS BENTO GRID */}
      <AnimatePresence>
        {result && (
          <div className="absolute bottom-8 left-[24rem] right-[27rem] z-30">
            <AnalyticsPanel result={result} energyCost={energyCost} web3Enabled={web3Enabled} esgEnabled={esgEnabled} />
          </div>
        )}
      </AnimatePresence>

      {/* 5. OFFER MODAL */}
      <AnimatePresence>
        {showModal && result && location && (
          <OfferModal result={result} location={location} energyCost={energyCost}
            web3Enabled={web3Enabled} esgEnabled={esgEnabled} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
