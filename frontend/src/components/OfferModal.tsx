import { motion } from 'framer-motion';
import { X, Zap, FileText, Calendar, Shield, Globe } from 'lucide-react';
import type { CalcResult, SelectedLocation } from '../types';

interface Props {
    result: CalcResult;
    location: SelectedLocation;
    energyCost: number;
    web3Enabled: boolean;
    esgEnabled: boolean;
    onClose: () => void;
}

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

function quoteId(): string {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg = (n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
    return `TRT-${seg(4)}-${seg(4)}`;
}

export default function OfferModal({ result, location, energyCost, web3Enabled, esgEnabled, onClose }: Props) {
    const totalKwh = result.annualSolarKwh + result.annualWindKwh;
    const annualSavings = result.totalAnnualRevenue;
    const co2 = Math.round(totalKwh * 0.0004 * 10) / 10;
    const baseCost = result.investment;
    const roi = result.paybackPeriod;

    const summaryItems = [
        { label: 'System Size', value: `${result.numberOfLeaves} Leaves / ${result.numberOfTurbines} Turbines`, icon: Zap },
        { label: 'Annual Output', value: `${Math.round(totalKwh).toLocaleString()} kWh`, icon: Zap },
        { label: 'Investment', value: `${baseCost.toLocaleString()} CZK`, icon: FileText },
        { label: 'ROI Period', value: `${roi} Years`, icon: Calendar },
    ];

    const techRows: [string, string][] = [
        ['Coordinates', `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`],
        ...(location.roofArea ? [['Est. Roof Area', `${location.roofArea} m²`] as [string, string]] : []),
        ['Energy Price', `${energyCost.toFixed(2)} CZK/kWh`],
        ['Secondary Revenue', `${result.totalFutureRevenue.toLocaleString()} CZK/yr`],
        ['CO₂ Offset', `${co2.toFixed(1)} tons/year`],
        ['Web3 P2P Grid', web3Enabled ? 'ACTIVE' : 'INACTIVE'],
        ['ESG Certification', esgEnabled ? 'CERTIFIED' : 'NA'],
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 40, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="neo-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 bg-slate-900 flex flex-col gap-8"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-10 w-auto filter brightness-0 invert" />
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Investment Quotation</h2>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="text-treetino-light">Ref: {quoteId()}</span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-treetino-light transition-all shadow-neo-hover active:translate-y-0.5 active:shadow-none"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {summaryItems.map((item) => (
                        <div key={item.label} className="p-4 rounded-xl border-2 border-slate-800 bg-slate-950 shadow-neo-hover">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-sm font-black text-white uppercase">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-5 gap-8">
                    {/* Left: Detailed Breakdown */}
                    <div className="col-span-3 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-treetino-light uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Technical Specification
                            </h3>
                            <div className="rounded-xl border-2 border-slate-800 overflow-hidden">
                                <table className="w-full text-xs">
                                    <tbody>
                                        {techRows.map(([label, value], i) => (
                                            <tr key={label} className={i % 2 === 0 ? 'bg-slate-800/20' : 'bg-transparent'}>
                                                <td className="px-4 py-3 text-slate-400 font-bold uppercase tracking-tighter">{label}</td>
                                                <td className="px-4 py-3 text-white text-right font-black uppercase tracking-tight">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border-2 border-treetino-middle bg-treetino-middle/5 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-treetino-light/10 border-2 border-treetino-light/20">
                                <Shield className="w-5 h-5 text-treetino-light" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">Performance Guarantee</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    This quotation is based on high-fidelity environmental scan data. Energy trees include a 25-year structural warranty and AI-driven yield optimization as standard.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Street View Map */}
                    <div className="col-span-2 space-y-3 flex flex-col">
                        <h3 className="text-xs font-black text-treetino-light uppercase tracking-[0.2em] flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> Deployment Site
                        </h3>
                        <div className="flex-1 min-h-[300px] neo-panel overflow-hidden bg-slate-950 relative border-2 border-slate-800">
                            <iframe
                                title="Street View Map"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps?q=${location.lat},${location.lon}&hl=en&z=18&output=embed`}
                            ></iframe>
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none">
                                <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded border border-slate-700">Location Preview</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t-2 border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Treetino RWA Energy Platform</p>
                        <div className="h-4 w-px bg-slate-800" />
                        <p className="text-[9px] font-black text-treetino-light uppercase tracking-widest">Confidence Score: 0.98</p>
                    </div>
                    <button className="neo-btn-primary !w-auto px-10 py-4 !rounded-full">
                        Proceed to Deployment
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
