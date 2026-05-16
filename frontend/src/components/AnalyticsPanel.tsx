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
    const co2Offset = result.co2Savings;
    const treesEquiv = result.treesEquivalent;
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
            <div className="neo-panel p-6 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-16 h-16 text-treetino-light" />
                </div>
                <EnergyChart data={result.monthlyData} totalKwh={totalKwh} lastWeekKwh={result.lastWeekKwh} />
            </div>

            {/* Card 2: Economics */}
            <div className="neo-panel p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-treetino-light" />
                        <h3 className="text-base font-semibold text-white">Finance</h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Návratnost</p>
                        <p className="text-3xl font-bold text-treetino-light">
                            {paybackYears} <span className="text-xs uppercase">Roků</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-slate-400">{roiPercentage}% Výnos</span>
                            {web3Enabled && (
                                <span className="neo-badge">P2P Bonus</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Investice</p>
                            <p className="text-sm font-bold text-white">{investment.toLocaleString()} CZK</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Úspora/Rok</p>
                            <p className="text-sm font-bold text-green-400">{annualSavings.toLocaleString()} CZK</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: ESG */}
            <div className="neo-panel p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5 text-treetino-light" />
                        <h3 className="text-base font-semibold text-white">Ekologický Dopad</h3>
                    </div>
                    {esgEnabled && <Shield className="w-4 h-4 text-treetino-light" />}
                </div>

                <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Úspora CO₂</p>
                        <p className="text-3xl font-bold text-white">
                            {co2Offset.toFixed(1)} <span className="text-xs uppercase text-slate-400">Tun/Rok</span>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-treetino-light/20 flex items-center justify-center shrink-0">
                                <TreePine className="w-4 h-4 text-treetino-light" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{treesEquiv.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Ekvivalent vysazených stromů</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-treetino-light/20 flex items-center justify-center shrink-0">
                                <Car className="w-4 h-4 text-treetino-light" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{evKm} KM</p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Ekvivalent Nájezdu EV</p>
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
                    <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-treetino-light/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-treetino-light" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Výroba Energie</h3>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Minulý Týden</span>
                    <span className="text-sm font-bold text-treetino-light">{lastWeekKwh.toLocaleString()} kWh</span>
                    <span className="text-[8px] text-slate-500 font-semibold uppercase mt-1">Reálná Data</span>
                </div>
            </div>

            <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="0" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                            tickFormatter={(v: number) => `${Math.round(v)}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(30, 41, 59, 0.5)' }}
                            contentStyle={{
                                background: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '12px',
                                fontSize: '11px',
                                color: '#f8fafc',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                            }}
                            itemStyle={{ fontWeight: 600, fontSize: '10px' }}
                            formatter={(v, name) => [`${Number(v).toLocaleString()} kWh`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '15px' }} iconType="rect" iconSize={8} />
                        <Bar dataKey="solar" name="Solární" stackId="a" fill="#2762AD" />
                        <Bar dataKey="wind" name="Větrná" stackId="a" fill="#E8F1FF" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

