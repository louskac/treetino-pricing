import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, FileText, Calendar, Shield, Globe, Download, Loader2, User, MapPin } from 'lucide-react';
import type { CalcResult, SelectedLocation } from '../types';
import Map, { Marker } from 'react-map-gl/mapbox';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
        { label: 'System Size', value: `${result.dcPowerKw ?? '-'} kWp / ${result.acPowerKw ?? '-'} kW AC`, icon: Zap },
        { label: 'Annual Output', value: `${Math.round(totalKwh).toLocaleString()} kWh`, icon: Zap },
        { label: 'Investment', value: `${(result.finalPrice ?? result.investment).toLocaleString()} CZK`, icon: FileText },
        { label: 'ROI Period', value: `${roi} Years`, icon: Calendar },
    ];

    const techRows: [string, string][] = [
        ['Coordinates', `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`],
        ...(location.roofArea ? [['Est. Roof Area', `${location.roofArea} m²`] as [string, string]] : []),
        ['Energy Price', `${energyCost.toFixed(2)} CZK/kWh`],
        ['Secondary Revenue', `${(result.totalFutureRevenue || 0).toLocaleString()} CZK/yr`],
        ['CO₂ Offset', `${(result.co2Savings || co2).toFixed(2)} tons/year`],
        ['Trees Equivalent', `${(result.treesEquivalent || Math.round(co2 * 50)).toLocaleString()}`],
        ['Web3 P2P Grid', web3Enabled ? 'ACTIVE' : 'INACTIVE'],
        ['ESG Certification', esgEnabled ? 'CERTIFIED' : 'NA'],
    ];

    const [clientName, setClientName] = useState('ACME Corp');
    const [clientAddress, setClientAddress] = useState('123 Energy Way, Tech City');
    const [clientLogoBase64, setClientLogoBase64] = useState<string | null>(null);
    const [consumptionValue, setConsumptionValue] = useState<number>(result.buildingConsumption);
    const [consumptionUnit, setConsumptionUnit] = useState<'kWh' | 'MWh' | 'GWh'>('MWh');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setClientLogoBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        let finalOverride = consumptionValue;
        if (consumptionUnit === 'kWh') finalOverride = consumptionValue / 1000.0;
        if (consumptionUnit === 'GWh') finalOverride = consumptionValue * 1000.0;

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    clientAddress,
                    result,
                    location,
                    energyCost,
                    web3Enabled,
                    esgEnabled,
                    clientLogoBase64,
                    consumptionOverride: finalOverride
                })
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Treetino_Offer_${quoteId()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Check console for details.');
        } finally {
            setIsGenerating(false);
        }
    };

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
                            {(() => {
                                const activePins = location.pins && location.pins.length > 0
                                    ? location.pins
                                    : [{ lat: location.lat, lng: location.lon }];
                                    
                                let bounds: [number, number, number, number] | undefined = undefined;
                                if (activePins.length > 1) {
                                    const minLng = Math.min(...activePins.map(p => p.lng));
                                    const maxLng = Math.max(...activePins.map(p => p.lng));
                                    const minLat = Math.min(...activePins.map(p => p.lat));
                                    const maxLat = Math.max(...activePins.map(p => p.lat));
                                    
                                    const lngPad = Math.max((maxLng - minLng) * 0.3, 0.0005);
                                    const latPad = Math.max((maxLat - minLat) * 0.3, 0.0005);
                                    bounds = [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
                                }
                                
                                return (
                                    <Map
                                        mapboxAccessToken={TOKEN}
                                        initialViewState={{
                                            longitude: activePins[0].lng,
                                            latitude: activePins[0].lat,
                                            zoom: 17.5,
                                            bounds: bounds
                                        }}
                                        mapStyle="mapbox://styles/mapbox/satellite-v9"
                                        interactive={true}
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        {activePins.map((p, idx) => (
                                            <Marker key={idx} longitude={p.lng} latitude={p.lat} anchor="center">
                                                <img src="/top_view.png" alt="Tree Instance" className="w-[80px] h-[80px] object-contain drop-shadow-2xl" />
                                            </Marker>
                                        ))}
                                    </Map>
                                );
                            })()}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none z-10">
                                <span className="text-[8px] font-black text-slate-500 uppercase bg-slate-900/80 px-2 py-1 rounded border border-slate-700 backdrop-blur-md">Location Preview</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Info Playground Form */}
                <div className="grid grid-cols-4 gap-4 border-2 border-slate-800 p-4 rounded-xl bg-slate-950">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-3 h-3 text-treetino-light" /> Client Name
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-treetino-light outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-treetino-light" /> Client Address
                        </label>
                        <input
                            type="text"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-treetino-light outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3 text-treetino-light" /> Est Consumption
                        </label>
                        <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded focus-within:border-treetino-light transition-colors">
                            <input
                                type="number"
                                min={0}
                                step="any"
                                value={consumptionValue}
                                onChange={(e) => setConsumptionValue(parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent px-3 py-2 text-white text-sm outline-none"
                            />
                            <button 
                                onClick={() => {
                                    if (consumptionUnit === 'MWh') {
                                        setConsumptionUnit('GWh');
                                        setConsumptionValue(Number((consumptionValue / 1000).toFixed(2)));
                                    } else if (consumptionUnit === 'GWh') {
                                        setConsumptionUnit('kWh');
                                        setConsumptionValue(Number((consumptionValue * 1000000).toFixed(2)));
                                    } else {
                                        setConsumptionUnit('MWh');
                                        setConsumptionValue(Number((consumptionValue / 1000).toFixed(2)));
                                    }
                                }}
                                className="h-full border-l border-slate-800 px-3 text-[10px] font-black text-treetino-light hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                {consumptionUnit}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-3 h-3 text-treetino-light" /> Client Logo
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1 text-white text-sm focus:border-treetino-light outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-treetino-light/10 file:text-treetino-light hover:file:bg-treetino-light/20 cursor-pointer"
                            />
                            {clientLogoBase64 && <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-slate-800 overflow-hidden"><img src={clientLogoBase64} alt="Logo" className="w-full h-full object-cover" /></div>}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t-2 border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Treetino B2B Sales Playground</p>
                        <div className="h-4 w-px bg-slate-800" />
                        <p className="text-[9px] font-black text-treetino-light uppercase tracking-widest">Confidence Score: 0.98</p>
                    </div>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={isGenerating}
                        className="neo-btn-primary !w-auto px-10 py-4 !rounded-full flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isGenerating ? 'Generating...' : 'Generate PDF Proposal'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
