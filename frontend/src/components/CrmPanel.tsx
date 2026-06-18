import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  DollarSign, 
  MapPin, 
  RefreshCw, 
  Award,
  ChevronRight,
  TrendingUp,
  User,
  LogOut,
  Sliders,
  FileText,
  DollarSign as MoneyIcon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { Partner, Deal, CalcResult, SelectedLocation, User as UserType } from '../types';

const BACKEND_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

interface Props {
  activeUser: UserType | null;
  onLogout: () => void;
  activeDeal: Deal | null;
  onSelectDeal: (deal: Deal | null) => void;
  currentResult: CalcResult | null;
  currentLocation: SelectedLocation | null;
  energyCost: number;
  sunnyDays: number;
  windyDays: number;
  windHours: number;
  aiOptimization: boolean;
  web3Enabled: boolean;
  buildingConsumption: number;
  discount: number;
  deals: Deal[];
  onRefreshDeals: () => Promise<void> | void;
}

export default function CrmPanel({
  activeUser,
  onLogout,
  activeDeal,
  onSelectDeal,
  currentResult,
  currentLocation,
  energyCost,
  sunnyDays,
  windyDays,
  windHours,
  aiOptimization,
  web3Enabled,
  buildingConsumption,
  discount,
  deals,
  onRefreshDeals
}: Props) {
  // ─── States ────────────────────────────────────────────
  const [savingConfig, setSavingConfig] = useState(false);



  // ─── Save Layout Configuration ────────────────────────
  const handleSaveConfig = async () => {
    if (!activeDeal || !currentResult || !currentLocation) return;
    setSavingConfig(true);
    try {
      // Backend now computes the forecast, but we pass it as computed in parent calculator
      const forecastVal = currentResult.commissionForecast || 0;
      
      await axios.post(`${BACKEND_URL}/deals/${activeDeal.id}/config`, {
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        pins_json: JSON.stringify(currentLocation.pins),
        energy_price: energyCost,
        sunny_days: sunnyDays,
        windy_days: windyDays,
        wind_hours: windHours,
        ai_optimization: aiOptimization,
        web3_enabled: web3Enabled,
        building_consumption: buildingConsumption,
        discount: discount,
        total_price: currentResult.finalPrice,
        commission_forecast: forecastVal
      });
      
      await onRefreshDeals();
      
      // Keep loaded state synced
      onSelectDeal({
        ...activeDeal,
        status: 'In Progress',
        config: {
          id: 0,
          deal_id: activeDeal.id,
          lat: currentLocation.lat,
          lon: currentLocation.lon,
          pins_json: JSON.stringify(currentLocation.pins),
          energy_price: energyCost,
          sunny_days: sunnyDays,
          windy_days: windyDays,
          wind_hours: windHours,
          ai_optimization: aiOptimization ? 1 : 0,
          web3_enabled: web3Enabled ? 1 : 0,
          building_consumption: buildingConsumption,
          discount: discount,
          total_price: currentResult.finalPrice,
          commission_forecast: forecastVal,
          pdf_path: ''
        }
      });
    } catch (err) {
      console.error('Failed to save config', err);
    } finally {
      setSavingConfig(false);
    }
  };

  // ─── Update Deal Status ──────────────────────────────
  const handleStatusChange = async (dealId: number, nextStatus: string) => {
    try {
      await axios.put(`${BACKEND_URL}/deals/${dealId}/status`, { status: nextStatus });
      await onRefreshDeals();
      if (activeDeal && activeDeal.id === dealId) {
        onSelectDeal({ ...activeDeal, status: nextStatus as any });
      }
    } catch (err) {
      console.error('Failed to update deal status', err);
    }
  };

  // ─── Financial calculations (Actual, no mock data) ─────
  const paidTotal = deals
    .filter(d => d.commission && d.commission.status === 'Paid')
    .reduce((sum, d) => sum + d.commission!.amount_czk, 0);

  const pendingTotal = deals
    .filter(d => d.commission && d.commission.status === 'Pending')
    .reduce((sum, d) => sum + d.commission!.amount_czk, 0);

  const forecastedTotal = deals
    .filter(d => d.commission && d.commission.status === 'Forecasted')
    .reduce((sum, d) => sum + d.commission!.amount_czk, 0);

  // ─── Format Currency Helper ──────────────────────────
  const formatMoney = (amount: number | undefined) => {
    if (amount === undefined) return '0 Kč';
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);
  };

  // ─── Recharts Data mapping ───────────────────────────
  const chartData = [
    { name: 'Vyplaceno', hodnota: paidTotal, color: '#10b981' },
    { name: 'Čeká (Won)', hodnota: pendingTotal, color: '#f59e0b' },
    { name: 'Odhad', hodnota: forecastedTotal, color: '#06b6d4' }
  ];

  // Status mapping helper for Czech localization
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Prepared': return 'Příprava';
      case 'In Progress': return 'V jednání';
      case 'Stuck': return 'Zaseknuto';
      case 'Rejected': return 'Zamítnuto';
      case 'Won': return 'Vyhráno';
      case 'Lost': return 'Prohráno';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      
      {/* 1. SALES REPRESENTATIVE PROFILE CARD */}
      <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-treetino-light/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-treetino-light/10 border border-treetino-light/25">
              <User className="w-5 h-5 text-treetino-light" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-treetino-light font-bold uppercase tracking-widest font-mono">Přihlášený prodejce</span>
              <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{activeUser?.username}</h3>
            </div>
          </div>

          <button 
            onClick={onLogout}
            title="Odhlásit se"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Organizace: <strong className="text-white">{activeUser?.partner_name || 'Nezávislý'}</strong></span>
          <span className="bg-treetino-light/15 text-treetino-light px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase">
            {activeUser?.tier}
          </span>
        </div>
      </div>

      {/* 2. REAL-TIME COMMISSION STATISTICS */}
      <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-[#fbbf24]" /> Vaše Provize (Celkově)
          </label>
          <Award className="w-4 h-4 text-treetino-light opacity-80" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-emerald-500/15 text-center">
            <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Vyplaceno</div>
            <div className="text-xs font-bold text-white mt-1 font-mono">{formatMoney(paidTotal)}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-yellow-500/15 text-center">
            <div className="text-[8px] text-yellow-400 font-bold uppercase tracking-wider">Čeká</div>
            <div className="text-xs font-bold text-white mt-1 font-mono">{formatMoney(pendingTotal)}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-cyan-500/15 text-center">
            <div className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider">Rozpracováno</div>
            <div className="text-xs font-bold text-white mt-1 font-mono">{formatMoney(forecastedTotal)}</div>
          </div>
        </div>

        {/* Recharts chart visualizing current agent performance */}
        {deals.length > 0 && (
          <div className="h-24 w-full -mx-4 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} width={30} />
                <Tooltip 
                  contentStyle={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }} 
                  labelStyle={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#58cca8', fontSize: '9px' }}
                  formatter={(value) => [formatMoney(value as number), 'Provize']}
                />
                <Bar dataKey="hodnota" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>



      {/* 4. ACTIVE CONFIGURED SAVE BUTTON */}
      <AnimatePresence>
        {activeDeal && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-3xl bg-slate-900/95 border border-treetino-light/35 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-treetino-light" /> Vybraný Obchod: <strong className="text-treetino-light font-mono">#{activeDeal.id}</strong>
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  activeDeal.status === 'Won' ? 'bg-emerald-500/20 text-emerald-400' :
                  activeDeal.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                  activeDeal.status === 'Lost' ? 'bg-slate-500/20 text-slate-400' :
                  'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {getStatusLabel(activeDeal.status)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Nakonfigurujte systém na mapě, nastavte sleva/cena parametry a uložte.
              </p>
              
              <button
                onClick={handleSaveConfig}
                disabled={!currentResult || !currentLocation || savingConfig}
                className="w-full bg-treetino-light hover:bg-[#3ec19b] text-slate-950 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${savingConfig ? 'animate-spin' : ''}`} />
                Uložit a Přepočítat Provizi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SALES REPRESENTATIVES PIPELINE LISTING */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
          <Briefcase className="w-3.5 h-3.5 text-treetino-light" /> Obchody Organizace ({deals.length})
        </label>
        
        <div className="flex flex-col gap-2.5">
          {deals.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8 font-mono">
              Žádné obchody. Přidejte prvního klienta.
            </div>
          ) : (
            deals.map((deal) => {
              const isSelected = activeDeal?.id === deal.id;
              const hasConfig = !!deal.config;
              
              return (
                <div 
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-slate-800/80 border-treetino-light/70 shadow-[0_0_20px_rgba(88,204,168,0.15)]' 
                      : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {deal.client_logo && (
                        <div className="w-8 h-8 rounded bg-slate-950 p-1 flex items-center justify-center border border-slate-800 shrink-0">
                          <img src={deal.client_logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-treetino-light transition-colors">{deal.client_name}</h4>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          ID: {deal.id} • vytvořil/a: <strong className="text-slate-400">{deal.agent_name}</strong>
                        </div>
                      </div>
                    </div>
                    
                    <select
                      value={deal.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(deal.id, e.target.value)}
                      className={`text-[9px] font-bold py-1 px-2.5 rounded-full bg-slate-950 border border-slate-700 cursor-pointer focus:outline-none ${
                        deal.status === 'Won' ? 'text-emerald-400 border-emerald-500/20' :
                        deal.status === 'Rejected' ? 'text-rose-400 border-rose-500/20' :
                        deal.status === 'Lost' ? 'text-slate-400 border-slate-700' :
                        'text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      <option value="Prepared">Příprava</option>
                      <option value="In Progress">V jednání</option>
                      <option value="Stuck">Zaseknuto</option>
                      <option value="Rejected">Zamítnuto</option>
                      <option value="Won">Vyhráno</option>
                      <option value="Lost">Prohráno</option>
                    </select>
                  </div>

                  {/* Config details */}
                  <div className="flex items-center justify-between text-[10px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-treetino-light" />
                      {hasConfig ? 'Mapa nakonfigurována' : 'Čeká na konfiguraci'}
                    </span>
                    {hasConfig && (
                      <span className="font-bold text-white">
                        {formatMoney(deal.config?.total_price)}
                      </span>
                    )}
                  </div>

                  {/* Company Details (IČO, Spotřeba) */}
                  {(deal.ico || deal.config?.building_consumption) && (
                    <div className="flex justify-between text-[9px] text-slate-400 px-1 mt-0.5">
                      {deal.ico && (
                        <span>IČO: <strong className="text-slate-300 font-mono">{deal.ico}</strong></span>
                      )}
                      {deal.config?.building_consumption && (
                        <span>Spotřeba: <strong className="text-slate-300 font-mono">{deal.config.building_consumption} MWh</strong></span>
                      )}
                    </div>
                  )}

                  {/* Estimated commission */}
                  {hasConfig && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 mt-0.5">
                      <span>Provize:</span>
                      <strong className="text-treetino-light flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        {formatMoney(deal.config?.commission_forecast)}
                      </strong>
                    </div>
                  )}

                  {deal.pdf_path && (
                    <div className="flex justify-end mt-1 px-1">
                      <a 
                        href={`${BACKEND_URL}${deal.pdf_path}`} 
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] text-treetino-light hover:underline font-bold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Stáhnout PDF Nabídku
                      </a>
                    </div>
                  )}

                  {/* Load/Edit Action */}
                  {hasConfig && isSelected && (
                    <div className="flex justify-end gap-2 mt-1.5 pt-1.5 border-t border-slate-800/80">
                      <span className="text-[9px] text-treetino-light font-bold flex items-center gap-0.5">
                        Konfigurace načtena <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
