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
    name: 'Treetino V1',
    description: '300 solárních listů + integrovaný vítr',
    image: '/products/strom1.png',
    investment: 5000000
  },
  {
    id: 'small-tree',
    name: 'Treetino V2',
    description: '180 solárních listů — Předobjednávka',
    image: '/products/strom3.png',
    investment: 1500000
  },
  {
    id: 'standalone-turbine',
    name: 'Turbine T1',
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
          <div className="h-8 w-px bg-slate-700" />
          <div className="flex flex-col">
            <RotatingText
              texts={['Energetické Stromy', 'ROI Kalkulačka', 'Budoucnost Energie']}
              mainClassName="text-xs font-semibold text-slate-300"
              rotationInterval={3000}
            />
            <span className="text-[10px] text-treetino-light font-bold">V2.0 PRO</span>
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
              className="neo-btn-secondary pointer-events-auto py-4 px-6 flex items-center gap-3"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-semibold">Exportovat PDF Nabídku</span>
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
        <div className="space-y-1 bg-slate-900 -mx-6 -mt-6 p-6 rounded-t-xl border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">Konfigurace</h2>
          <div className="h-1 w-12 bg-treetino-light mt-2 rounded-full" />
        </div>

        {/* Product Selection Horizontal Grid */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-treetino-light" /> 01 — Výběr Jednotky
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCT_DATA.map((pd) => {
              const isSelected = product === pd.id;
              let borderClass = 'border-treetino-light/30 hover:border-treetino-light/60';
              let textClass = 'text-slate-300 group-hover:text-treetino-light';
              let bgClass = 'bg-slate-800/80';
              
              if (pd.id === 'small-tree') {
                borderClass = isSelected ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'border-yellow-500/30 hover:border-yellow-500/60';
                textClass = isSelected ? 'text-yellow-500' : 'text-slate-300 group-hover:text-yellow-400';
                bgClass = isSelected ? 'bg-yellow-500/20' : 'bg-slate-800/80';
              } else if (pd.id === 'standalone-turbine') {
                borderClass = isSelected ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-blue-500/30 hover:border-blue-500/60';
                textClass = isSelected ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400';
                bgClass = isSelected ? 'bg-blue-500/20' : 'bg-slate-800/80';
              } else {
                borderClass = isSelected ? 'border-[#58cca8] shadow-[0_0_15px_rgba(88,204,168,0.4)]' : 'border-[#58cca8]/30 hover:border-[#58cca8]/60';
                textClass = isSelected ? 'text-[#58cca8]' : 'text-slate-300 group-hover:text-[#58cca8]';
                bgClass = isSelected ? 'bg-[#58cca8]/20' : 'bg-slate-800/80';
              }

              return (
                <motion.button
                  key={pd.id}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setProduct(pd.id as ProductType);
                    setResult(null);
                  }}
                  className={`relative group overflow-hidden h-28 text-left transition-all rounded-2xl border-2 ${borderClass} ${bgClass}`}
                >
                  <div className="absolute inset-0 z-0">
                    <img src={pd.image} alt={pd.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                  </div>
                  <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                    <div className={`text-sm font-semibold transition-colors ${textClass}`}>
                      {pd.name}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Context Card */}
        {location && (
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-treetino-light" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Analýza Lokality</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Solární potenciál</span>
                <div className="text-lg font-bold text-white">{location.potential ? `${location.potential.solarIndex}%` : '--'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Rychlost větru</span>
                <div className="text-lg font-bold text-white">{location.potential ? `${location.potential.avgWindSpeed}m/s` : '--'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-2 pb-2 border-b border-slate-700/50">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-treetino-light" /> Extrahované jednotky z mapy
                </label>
                <span className="text-sm font-bold text-white leading-none">
                  {unitCount}x {product === 'main-tree' ? 'V1' : product === 'small-tree' ? 'V2' : 'T1'}
                </span>
              </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Cena za kWh</label>
              <span className="text-sm font-bold text-white leading-none">{energyCost.toFixed(2)} CZK</span>
            </div>
            <input type="range" min={1.00} max={15.00} step={0.1} value={energyCost}
              onChange={(e) => setEnergyCost(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Spotřeba</label>
              <span className="text-sm font-bold text-white leading-none">{buildingConsumption} MWh</span>
            </div>
            <input type="range" min={10} max={5000} step={10} value={buildingConsumption}
              onChange={(e) => setBuildingConsumption(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Sleva</label>
              <span className="text-sm font-bold text-white leading-none">{discount.toFixed(1)}%</span>
            </div>
            <input type="range" min={0} max={30} step={0.5} value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-treetino-light" />
          </div>
        </div>

        {/* Toggles */}


        <div className="flex-1 min-h-[1rem]" />

        {/* ROI Results Bar */}
        <AnimatePresence>

        </AnimatePresence>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!location || loading}
          className="neo-btn-primary flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Analyzuji...</>
          ) : (
            <>Spočítat návratnost</>
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
