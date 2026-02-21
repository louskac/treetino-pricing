import { motion } from 'framer-motion';
import { Sun, Wind, TrendingUp, Leaf, Car, TreePine, Shield, Globe, Compass } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CalcResult, ROIResult } from '../types';
import { Sparkles } from 'lucide-react';

interface Props {
    result: CalcResult;
    energyCost: number;
    web3Enabled: boolean;
    esgEnabled: boolean;
}

export default function AnalyticsPanel({ result, energyCost, web3Enabled, esgEnabled }: Props) {
    const totalKwh = result.annualSolarKwh + result.annualWindKwh;
    const annualSavings = result.totalAnnualRevenue;
    const co2Offset = Math.round(totalKwh * 0.0004 * 10) / 10; // 0.4 kg CO₂/kWh EU avg → tons
    const treesEquiv = Math.round(co2Offset * 50);
    const evKm = Math.round(co2Offset * 8000).toLocaleString();

    // ROI
    const investment = result.investment;
    const paybackYears = result.paybackPeriod;
    const roiPercentage = result.roi;

    return (
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-5 left-5 right-[22rem] z-30 grid grid-cols-3 gap-3"
        >
            {/* Card 1: Production (Stacked Solar & Wind) */}
            <div className="glass-panel p-4">
                <EnergyChart data={result.monthlyData} totalKwh={totalKwh} />
            </div>

            {/* Card 2: Economics */}
            <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-white">Economics</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Total Investment</p>
                        <p className="text-2xl font-bold text-white">€{investment.toLocaleString()}</p>
                    </div>
                    <div className="h-px bg-slate-700/30" />
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">ROI Period</p>
                        <p className={`text-2xl font-bold ${web3Enabled ? 'text-violet-400' : 'text-emerald-400'}`}>
                            {paybackYears} years
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            {roiPercentage}% annual yield
                        </p>
                        {web3Enabled && (
                            <p className="text-[10px] text-violet-400 mt-0.5 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> 15% P2P bonus applied
                            </p>
                        )}
                    </div>
                    <div className="h-px bg-slate-700/30" />
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Annual Savings</p>
                        <p className="text-lg font-semibold text-white">€{annualSavings.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">at €{energyCost.toFixed(2)}/kWh · {Math.round(totalKwh).toLocaleString()} kWh/yr</p>
                    </div>
                </div>
            </div>

            {/* Card 3: ESG */}
            <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-white">ESG Impact</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">CO₂ Offset / Year</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            {co2Offset.toFixed(1)} <span className="text-sm font-normal text-slate-500">tons</span>
                        </p>
                    </div>
                    <div className="h-px bg-slate-700/30" />
                    <div className="space-y-2.5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Equivalent To</p>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <TreePine className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{treesEquiv.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500">Trees Planted</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <Car className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{evKm} km</p>
                                <p className="text-[10px] text-slate-500">Driven in an EV</p>
                            </div>
                        </div>
                    </div>
                    {esgEnabled && (
                        <div className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> ESG Certificate included
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Energy Chart (Stacked Solar & Wind) ───────────────────
function EnergyChart({ data, totalKwh }: { data: ROIResult['monthlyData']; totalKwh: number }) {
    return (
        <>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="text-xs font-semibold text-white">Monthly Energy Stack</h3>
            </div>
            <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={40}
                            tickFormatter={(v: number) => `${Math.round(v)}`} />
                        <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                            formatter={(v, name) => [`${Number(v).toLocaleString()} kWh`, name === 'solar' ? 'Solar' : 'Wind']} />
                        <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} iconSize={8} />
                        <Bar dataKey="solar" name="Solar" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="wind" name="Wind" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
                Total generated: {Math.round(totalKwh).toLocaleString()} kWh/year
            </p>
        </>
    );
}

// WindChart and SolarChart can be removed as they are specialized for previous version.
