import { motion } from 'framer-motion';
import { Sun, Wind, TrendingUp, Leaf, Car, TreePine, Shield, Globe, Zap, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CalcResult, ROIResult } from '../types';

interface Props {
    result: CalcResult;
    energyCost: number;
    web3Enabled: boolean;
    esgEnabled: boolean;
}

export default function AnalyticsPanel({ result, energyCost, web3Enabled, esgEnabled }: Props) {
    const totalKwh = result.annualSolarKwh + result.annualWindKwh;
    const annualSavings = result.totalAnnualRevenue;
    const co2Offset = Math.round(totalKwh * 0.0004 * 10) / 10;
    const treesEquiv = Math.round(co2Offset * 50);
    const evKm = Math.round(co2Offset * 8000).toLocaleString();

    // ROI
    const investment = result.investment;
    const paybackYears = result.paybackPeriod;
    const roiPercentage = result.roi;

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-6 w-full h-[320px]"
        >
            {/* Card 1: Production (Stacked Solar & Wind) */}
            <div className="neo-panel p-6 bg-slate-900 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-16 h-16 text-treetino-light" />
                </div>
                <EnergyChart data={result.monthlyData} totalKwh={totalKwh} lastWeekKwh={result.lastWeekKwh} />
            </div>

            {/* Card 2: Economics */}
            <div className="neo-panel p-6 bg-slate-900 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-treetino-light" />
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Financials</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-white/10 bg-slate-950/50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">ROI Period</p>
                        <p className="text-3xl font-black text-treetino-light">
                            {paybackYears} <span className="text-xs uppercase">Years</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400">{roiPercentage}% Yield</span>
                            {web3Enabled && (
                                <span className="neo-badge">P2P Bonus</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">Investment</p>
                            <p className="text-sm font-black text-white">{investment.toLocaleString()} CZK</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">Savings/YR</p>
                            <p className="text-sm font-black text-treetino-accent">{annualSavings.toLocaleString()} CZK</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: ESG */}
            <div className="neo-panel p-6 bg-slate-900 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5 text-treetino-light" />
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Eco Impact</h3>
                    </div>
                    {esgEnabled && <Shield className="w-4 h-4 text-treetino-light" />}
                </div>

                <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-white/10 bg-slate-950/50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">CO₂ Offset</p>
                        <p className="text-3xl font-black text-white">
                            {co2Offset.toFixed(1)} <span className="text-xs uppercase">Tons/YR</span>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-treetino-light/10 border-2 border-treetino-light/20 flex items-center justify-center shrink-0">
                                <TreePine className="w-4 h-4 text-treetino-light" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white leading-none">{treesEquiv.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Trees Equivalent</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-treetino-light/10 border-2 border-treetino-light/20 flex items-center justify-center shrink-0">
                                <Car className="w-4 h-4 text-treetino-light" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white leading-none">{evKm} KM</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">EV Range Offset</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Energy Chart (Stacked Solar & Wind) ───────────────────
function EnergyChart({ data, totalKwh, lastWeekKwh }: { data: ROIResult['monthlyData']; totalKwh: number; lastWeekKwh: number }) {
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-treetino-light/10 border-2 border-treetino-light/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-treetino-light" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Energy Stack</h3>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter block">LAST WEEK</span>
                    <span className="text-sm font-black text-treetino-accent">{lastWeekKwh.toLocaleString()} kWh</span>
                    <span className="text-[8px] text-slate-600 font-bold uppercase mt-1">REAL DATA BLEND</span>
                </div>
            </div>

            <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="0" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                            tickFormatter={(v: number) => `${Math.round(v)}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                            contentStyle={{
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                fontSize: '11px',
                                color: '#fff',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                            formatter={(v, name) => [`${Number(v).toLocaleString()} kWh`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '15px' }} iconType="rect" iconSize={8} />
                        <Bar dataKey="solar" name="Solar" stackId="a" fill="#2762AD" />
                        <Bar dataKey="wind" name="Wind" stackId="a" fill="#E8F1FF" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

