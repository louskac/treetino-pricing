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

const BACKEND_URL = 'http://localhost:8000';

const PRODUCT_DATA = [
  {
    id: 'main-tree',
    name: 'Main Energy Tree',
    description: '300 Solar Leaves + Integrated Wind',
    image: '/branding/products/main-tree.png',
    investment: 5000000
  },
  {
    id: 'small-tree',
    name: 'Small Tree Prototype',
    description: '180 Solar Leaves — Pre-order',
    image: '/branding/products/small-tree.png',
    investment: 1500000
  },
  {
    id: 'standalone-turbine',
    name: 'Rooftop Turbines',
    description: 'Silent Transparent Wind Tech',
    image: '/branding/products/standalone-turbine.png',
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

  // ─── Auto-update Unit Count for Standalone ────────────
  useEffect(() => {
    if (product === 'standalone-turbine' && location?.roofArea) {
      setUnitCount(Math.max(1, Math.floor(location.roofArea / 25)));
    } else {
      setUnitCount(1);
    }
  }, [product, location]);

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
      const calcParams = {
        productType: product,
        unitCount,
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
        roofArea: location.roofArea || 0,
        buildingHeight: location.height || 0
      };

      const { data } = await axios.post<CalcResult>(`${BACKEND_URL}/calculate-roi`, {
        lat: location.lat,
        lon: location.lon,
        params: calcParams
      });

      setResult(data);
    } catch (e) {
      console.error(e);
      setError('Calculation failed. Please check your connection and location.');
    } finally {
      setLoading(false);
    }
  };

  const annualSavings = result ? result.totalAnnualRevenue : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* 1. MAP */}
      <MapCanvas onLocationSelect={handleLocationSelect} selectedLocation={location} />

      {/* 2. TOP BAR & CONTROLS */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-8 py-6 pointer-events-none">
        {/* Unified Branding Plate */}
        {/* Action Group - Unified Branding Plate */}
        <div className="flex items-center gap-6 pointer-events-auto neo-glass-plate px-6 py-4">
          <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-8 w-auto filter brightness-0 invert" />
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <RotatingText
              texts={['Energy Trees', 'ROI Calculator', 'Future Power']}
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
              <span className="text-xs font-black">EXPORT PDF PROPOSAL</span>
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
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Configuration</h2>
          <div className="h-1 w-12 bg-treetino-light shadow-[0_0_12px_rgba(39,98,173,0.5)]" />
        </div>

        {/* Product Selection Horizontal Grid */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Zap className="w-3 h-3 text-treetino-light" /> 01 UNIT SELECTION
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCT_DATA.map((pd) => (
              <motion.button
                key={pd.id}
                whileHover={pd.id === 'standalone-turbine' && !location?.isBuilding ? {} : { y: -4 }}
                disabled={pd.id === 'standalone-turbine' && !location?.isBuilding}
                onClick={() => {
                  setProduct(pd.id as ProductType);
                  setResult(null);
                }}
                className={`relative group overflow-hidden h-28 text-left transition-all rounded-2xl border-2 ${product === pd.id
                  ? 'border-treetino-light shadow-hyper-glow bg-slate-800'
                  : 'border-white/5 bg-slate-900/50 hover:border-white/20'
                  } ${pd.id === 'standalone-turbine' && !location?.isBuilding ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
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
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Site Analysis</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-treetino-light/80">{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Solar Yield</span>
                <div className="text-lg font-black text-white">{location.potential ? `${location.potential.solarIndex}%` : '--'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Wind Spd</span>
                <div className="text-lg font-black text-white">{location.potential ? `${location.potential.avgWindSpeed}m/s` : '--'}</div>
              </div>
            </div>
            {location.isBuilding && (
              <div className="pt-2 border-t border-treetino-middle/20 flex items-center gap-2">
                <Ruler className="w-3 h-3 text-treetino-light" />
                <span className="text-[10px] font-bold text-slate-300">ROOF AREA: {location.roofArea}m²</span>
              </div>
            )}
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Units</label>
              <span className="text-sm font-bold text-white leading-none">{unitCount} Units</span>
            </div>
            <input type="range" min={1} max={50} step={1} value={unitCount}
              onChange={(e) => setUnitCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Net Cost / kWh</label>
              <span className="text-sm font-bold text-white leading-none">{energyCost.toFixed(2)} CZK</span>
            </div>
            <input type="range" min={1.00} max={15.00} step={0.1} value={energyCost}
              onChange={(e) => setEnergyCost(parseFloat(e.target.value))}
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
              <span className="text-[9px] font-black text-treetino-accent uppercase tracking-[0.2em] mb-1 block">Projected Annual Savings</span>
              <div className="flex items-baseline gap-2">
                <BlurText text={`${annualSavings.toLocaleString()}`} className="text-2xl font-black text-white !justify-start !text-left" animateBy="characters" />
                <span className="text-2xl font-black text-white">CZK</span>
                <span className="text-xs font-bold text-treetino-accent">NET</span>
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
            <><Loader2 className="w-4 h-4 animate-spin" />ANALYZING...</>
          ) : (
            <><TrendingUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />CALCULATE ROI</>
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
