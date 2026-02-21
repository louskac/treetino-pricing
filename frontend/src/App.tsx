import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2,
  FileText,
  TreePine,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
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

import type { EnergyMode, CalcResult, SelectedLocation, ProductType, PVGISResult, WindResult } from './types';
import { runQuickScan } from './api';
import type { CalculatorParams } from './calculator';
import MapCanvas from './components/MapCanvas';
import AnalyticsPanel from './components/AnalyticsPanel';
import OfferModal from './components/OfferModal';

// ─── Declare model-viewer JSX ─────────────────────────────
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

export default function App() {
  // ─── State ────────────────────────────────────────────
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  // ─── Calculator State ────────────────────────────────
  const [product, setProduct] = useState<ProductType>('main-tree');
  const [investmentUSD, setInvestmentUSD] = useState(250000);
  const [isInvestmentUnlocked, setIsInvestmentUnlocked] = useState(false);
  const [energyCost, setEnergyCost] = useState(0.20);
  const [sunnyDays, setSunnyDays] = useState(200);
  const [windyDays, setWindyDays] = useState(250);
  const [windHours, setWindHours] = useState(7);
  const [aiOptimization, setAiOptimization] = useState(true);
  const [showFutureRevenue, setShowFutureRevenue] = useState(false);
  const [carsPerDay, setCarsPerDay] = useState(1);
  const [carbonCreditPercentage, setCarbonCreditPercentage] = useState(60);
  const [heliumHotspots, setHeliumHotspots] = useState(1);

  // ─── Auto-update Investment for Standalone ────────────
  useEffect(() => {
    if (product === 'standalone-turbine' && location?.roofArea) {
      setInvestmentUSD(Math.floor(location.roofArea / 25) * 15000);
    }
  }, [product, location]);

  const [tiltAngle, setTiltAngle] = useState(35);
  const [azimuth, setAzimuth] = useState(0);
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
        if (isMounted) {
          setLocation(prev => prev ? { ...prev, potential } : null);
        }
      } catch (e) {
        console.error('Quick scan failed', e);
      }
    };

    triggerScan();
    return () => { isMounted = false; };
  }, [location]);

  // ─── Calculate ────────────────────────────────────────
  const handleCalculate = async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const calcParams: CalculatorParams = {
        productType: product,
        investmentUSD,
        energyPrice: energyCost,
        sunnyDays,
        windyDays,
        windHours,
        aiOptimization,
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

  // ─── Derived ──────────────────────────────────────────
  const annualSavings = result ? result.totalAnnualRevenue : 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
      {/* 1. MAP */}
      <MapCanvas onLocationSelect={handleLocationSelect} selectedLocation={location} />

      {/* 2. TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TreePine className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">TREETINO</h1>
            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.2em]">Energy Trees</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!result}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-md text-slate-300 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FileText className="w-3.5 h-3.5" />
          Generate PDF Offer
        </button>
      </div>

      {/* 3. COMMAND CENTER */}
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute top-20 right-5 bottom-5 w-80 z-30 glass-panel p-5 flex flex-col gap-3.5 overflow-y-auto transition-all duration-500 ${web3Enabled ? 'glow-violet' : ''}`}
      >
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">Quotation Engine</h2>
          <p className="text-[11px] text-slate-500">Configure energy parameters</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

        {/* Product Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TreePine className="w-3 h-3 text-emerald-500" /> Select Product
          </label>
          <div className="relative">
            <select
              value={product}
              onChange={(e) => {
                const nextProd = e.target.value as ProductType;
                setProduct(nextProd);
                setResult(null);

                // Automatic Investment Grounding
                if (nextProd === 'main-tree') setInvestmentUSD(250000);
                else if (nextProd === 'small-tree') setInvestmentUSD(120000);
                else if (nextProd === 'standalone-turbine' && location?.roofArea) {
                  setInvestmentUSD(Math.floor(location.roofArea / 25) * 15000);
                }
              }}
              className="input-field appearance-none pr-8 cursor-pointer text-xs"
            >
              <option value="main-tree">Main Energy Tree (300 Leaves)</option>
              <option value="small-tree">Small Tree Prototype (180 Leaves)</option>
              <option value="standalone-turbine" disabled={!location?.isBuilding}>
                Standalone Rooftop Turbines
              </option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
          {product === 'standalone-turbine' && location?.roofArea && (
            <p className="text-[9px] text-emerald-400">
              Fitting ~{Math.floor(location.roofArea / 25)} turbines on {location.roofArea}m² roof
            </p>
          )}
        </div>

        {/* Coordinates */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-500" /> Coordinates
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="input-field text-center text-xs font-mono">
              {location ? `${location.lat.toFixed(4)}°N` : '—'}
            </div>
            <div className="input-field text-center text-xs font-mono">
              {location ? `${location.lon.toFixed(4)}°E` : '—'}
            </div>
          </div>
          {location?.roofArea && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <Ruler className="w-3 h-3" />
              Est. roof area: {location.roofArea} m²
              · Height: {location.height || '?'}m
            </div>
          )}
          {!location && <p className="text-[10px] text-slate-600 italic">Click the map to select a location</p>}
        </div>

        {/* Spot Potential Card */}
        <AnimatePresence>
          {location && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Spot Potential
                  </div>
                  {!location.potential && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Sun className="w-2.5 h-2.5" /> Solar Index
                    </div>
                    <div className="text-sm font-bold text-white">
                      {location.potential ? `${location.potential.solarIndex}/100` : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Wind className="w-2.5 h-2.5" /> Wind (avg)
                    </div>
                    <div className="text-sm font-bold text-white">
                      {location.potential ? `${location.potential.avgWindSpeed} m/s` : '—'}
                    </div>
                  </div>
                </div>

                {location.potential && (
                  <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between">
                    <div className="text-[9px] text-slate-500">Est. {location.potential.yearlyYieldKwp} kWh/kWp</div>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                      High Efficiency <ArrowRight className="w-2 h-2" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Investment & Energy Section */}
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investment</label>
              <button
                onClick={() => setIsInvestmentUnlocked(!isInvestmentUnlocked)}
                className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${isInvestmentUnlocked ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-700 text-slate-500'}`}
              >
                {isInvestmentUnlocked ? 'Custom' : 'Fixed'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">${investmentUSD.toLocaleString()}</span>
            </div>
            {isInvestmentUnlocked && (
              <input type="range" min={50000} max={1000000} step={5000} value={investmentUSD}
                onChange={(e) => setInvestmentUSD(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-emerald-500" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Energy Price (€/kWh)</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">€{energyCost.toFixed(2)}</span>
            </div>
            <input type="range" min={0.10} max={1.00} step={0.01} value={energyCost}
              onChange={(e) => setEnergyCost(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
          </div>
        </div>

        {/* Operational / Weather Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weather Conditions</h3>
            <button onClick={() => setAiOptimization(!aiOptimization)} className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-medium">
              <Sparkles className="w-2.5 h-2.5" /> AI Optimization {aiOptimization ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500 uppercase"><span>Sunny Days</span><span>{sunnyDays}</span></div>
              <input type="range" min={50} max={365} value={sunnyDays} onChange={(e) => setSunnyDays(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500 uppercase"><span>Windy Days</span><span>{windyDays}</span></div>
              <input type="range" min={50} max={365} value={windyDays} onChange={(e) => setWindyDays(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Future Revenue Section */}
        <div className="space-y-2 pt-2 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs text-slate-300 font-medium">Secondary Streams</span>
            </div>
            <button onClick={() => setShowFutureRevenue(!showFutureRevenue)} className="text-slate-400 hover:text-white transition-colors">
              {showFutureRevenue ? <ToggleRight className="w-7 h-7 text-cyan-500" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>

          <AnimatePresence>
            {showFutureRevenue && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 mt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400"><span>EV Charging (cars/day)</span><span>{carsPerDay}</span></div>
                  <input type="range" min={0} max={20} value={carsPerDay} onChange={(e) => setCarsPerDay(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400"><span>Helium Hotspots</span><span>{heliumHotspots}</span></div>
                  <input type="range" min={0} max={5} value={heliumHotspots} onChange={(e) => setHeliumHotspots(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

        {/* Toggles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs text-slate-300">Web3 / P2P Trading</span>
            </div>
            <button onClick={() => setWeb3Enabled(!web3Enabled)} className="text-slate-400 hover:text-white transition-colors">
              {web3Enabled ? <ToggleRight className="w-7 h-7 text-violet-500" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>
          <AnimatePresence>
            {web3Enabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400">
                  ✦ P2P energy trading — ROI improved by 15%
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-300">ESG Certificate</span>
            </div>
            <button onClick={() => setEsgEnabled(!esgEnabled)} className="text-slate-400 hover:text-white transition-colors">
              {esgEnabled ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>
        </div>

        <div className="flex-1" />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Annual Savings Preview */}
        {result && (
          <div className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Annual Savings</p>
            <p className="text-lg font-bold text-emerald-400">€{annualSavings.toLocaleString()}</p>
          </div>
        )}

        {/* Calculate */}
        <button onClick={handleCalculate} disabled={!location || loading}
          className="btn-primary flex items-center justify-center gap-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Calculating...</>
          ) : (
            <><TrendingUp className="w-4 h-4" />Calculate ROI</>
          )}
        </button>
      </motion.aside>

      {/* 4. ANALYTICS BENTO GRID */}
      <AnimatePresence>
        {result && <AnalyticsPanel result={result} energyCost={energyCost} web3Enabled={web3Enabled} esgEnabled={esgEnabled} />}
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
