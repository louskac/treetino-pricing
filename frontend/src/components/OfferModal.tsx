import { motion } from 'framer-motion';
import { X, TreePine, Wind as WindIcon } from 'lucide-react';
import type { CalcResult, EnergyMode, SelectedLocation } from '../types';

interface Props {
    result: CalcResult;
    location: SelectedLocation;
    energyCost: number;
    web3Enabled: boolean;
    esgEnabled: boolean;
    onClose: () => void;
}

function quoteId(): string {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg = (n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
    return `TRT-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export default function OfferModal({ result, location, energyCost, web3Enabled, esgEnabled, onClose }: Props) {
    const totalKwh = result.annualSolarKwh + result.annualWindKwh;
    const annualSavings = result.totalAnnualRevenue;
    const co2 = Math.round(totalKwh * 0.0004 * 10) / 10;
    const baseCost = result.investment;
    const roi = result.paybackPeriod;

    const rows: [string, string][] = [
        ['Location', `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`],
        ['System Size', `${result.numberOfLeaves} Leaves / ${result.numberOfTurbines} Turbines`],
        ...(location.roofArea ? [['Est. Roof Area', `${location.roofArea} m²`] as [string, string]] : []),
        ['Annual Production', `${Math.round(totalKwh).toLocaleString()} kWh`],
        ['Energy Price', `€${energyCost.toFixed(2)}/kWh`],
        ['Total Investment', `€${baseCost.toLocaleString()}`],
        ['ROI Period', `${roi} years`],
        ['Annual Revenue', `€${annualSavings.toLocaleString()}`],
        ['Secondary Revenue', `€${result.totalFutureRevenue.toLocaleString()}/yr`],
        ['CO₂ Offset', `${co2.toFixed(1)} tons/year`],
        ['Web3 P2P Trading', web3Enabled ? 'Enabled' : 'Disabled'],
        ['ESG Certificate', esgEnabled ? 'Included' : 'Not included'],
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 border border-slate-700/60"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                <TreePine className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Treetino Energy Quotation</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Official Offer Document</p>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] font-mono text-emerald-400">QUOTE {quoteId()}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800/60 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden border border-slate-700/30 mb-6">
                    <table className="w-full text-sm">
                        <tbody>
                            {rows.map(([label, value], i) => (
                                <tr key={label} className={i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'}>
                                    <td className="px-4 py-2.5 text-slate-400 font-medium">{label}</td>
                                    <td className="px-4 py-2.5 text-white text-right font-mono text-xs">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* AR Preview */}
                <div>
                    <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">3D / AR Preview</h3>
                    <div className="rounded-xl overflow-hidden border border-slate-700/30 bg-slate-800/30 h-64 relative">
                        <model-viewer
                            src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                            alt="Energy Tree 3D Preview"
                            auto-rotate="true"
                            camera-controls="true"
                            shadow-intensity="1"
                            exposure="0.8"
                            loading="eager"
                            style={{ width: '100%', height: '100%' }}
                        />
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/40">
                            <p className="text-[10px] text-slate-400">
                                <WindIcon className="w-3 h-3 inline mr-1 text-emerald-400" />
                                Interactive 3D — Drag to rotate
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/30 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600">Valid for 30 days from generation.</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <TreePine className="w-3 h-3 text-emerald-500" />
                        Treetino GmbH © {new Date().getFullYear()}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
