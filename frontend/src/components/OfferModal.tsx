import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, FileText, Calendar, Shield, Globe, Download, Loader2, User, MapPin } from 'lucide-react';
import type { CalcResult, SelectedLocation } from '../types';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID as string || 'DEMO_MAP_ID';

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
        { label: 'Velikost Systému', value: `${result.dcPowerKw ?? '-'} kWp / ${result.acPowerKw ?? '-'} kW AC`, icon: Zap },
        { label: 'Roční Výroba', value: `${Math.round(totalKwh).toLocaleString()} kWh`, icon: Zap },
        { label: 'Investice', value: `${(result.finalPrice ?? result.investment).toLocaleString()} CZK`, icon: FileText },
        { label: 'Návratnost', value: `${roi} Roků`, icon: Calendar },
    ];

    const techRows: [string, string][] = [
        ['Souřadnice', `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`],
        ['Cena Energie', `${energyCost.toFixed(2)} CZK/kWh`],
        ['Vedlejší Příjmy', `${(result.totalFutureRevenue || 0).toLocaleString()} CZK/rok`],
        ['Úspora CO₂', `${(result.co2Savings || co2).toFixed(2)} tun/rok`],
        ['Ekvivalent Stromů', `${(result.treesEquivalent || Math.round(co2 * 50)).toLocaleString()}`],
        ['Web3 P2P Síť', web3Enabled ? 'AKTIVNÍ' : 'NEAKTIVNÍ'],
        ['ESG Certifikace', esgEnabled ? 'CERTIFIKOVÁNO' : 'N/A'],
    ];

    const [clientName, setClientName] = useState('ACME s.r.o.');
    const [clientAddress, setClientAddress] = useState('Energetická 123, Technologické Město');
    const [clientLogoBase64, setClientLogoBase64] = useState<string | null>(null);
    const [consumptionValue, setConsumptionValue] = useState<number>(result.buildingConsumption);
    const [consumptionUnit, setConsumptionUnit] = useState<'kWh' | 'MWh' | 'GWh'>('MWh');
    const [isGenerating, setIsGenerating] = useState(false);
    const [ico, setIco] = useState('');
    const [isFetchingIco, setIsFetchingIco] = useState(false);

    const handleIcoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value.replace(/\D/g, '');
        setIco(newVal);
        
        // Clear old results if they start modifying a full IČO
        if (newVal.length > 0 && newVal.length < 8) {
            setClientName('');
            setClientAddress('');
        }
        
        // Exact 8-digit IČO search
        if (newVal.length === 8) {
            setIsFetchingIco(true);
            try {
                const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${newVal}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.obchodniJmeno) setClientName(data.obchodniJmeno);
                    
                    let bestAddress = data.sidlo?.textovaAdresa;
                    if (data.dalsiUdaje && Array.isArray(data.dalsiUdaje)) {
                        const resData = data.dalsiUdaje.find((d: any) => d.datovyZdroj === 'res');
                        const rzpData = data.dalsiUdaje.find((d: any) => d.datovyZdroj === 'rzp');
                        
                        if (resData?.sidlo?.[0]?.sidlo?.textovaAdresa) {
                            bestAddress = resData.sidlo[0].sidlo.textovaAdresa;
                        } else if (rzpData?.sidlo?.[0]?.sidlo?.textovaAdresa) {
                            bestAddress = rzpData.sidlo[0].sidlo.textovaAdresa;
                        }
                    }
                    if (bestAddress) setClientAddress(bestAddress);
                } else {
                    setClientName('IČO nenalezeno v ARES');
                    setClientAddress('Zkontrolujte správnost IČO');
                }
            } catch (error) {
                console.error('ARES fetch failed:', error);
                setClientName('Chyba připojení k ARES');
                setClientAddress('Zkuste to prosím znovu');
            } finally {
                setIsFetchingIco(false);
            }
        }
    };

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
            alert('Generování PDF selhalo. Zkontrolujte konzoli pro detaily.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 40, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="neo-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 flex flex-col gap-8"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        <img src="/branding/logo_horizontal.png" alt="Treetino Logo" className="h-10 w-auto filter brightness-0 invert" />
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold text-white tracking-tight">Investiční Nabídka</h2>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="text-treetino-light">Ref: {quoteId()}</span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl bg-slate-800 border border-slate-700/50 hover:border-treetino-light transition-all shadow-sm"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {summaryItems.map((item) => (
                        <div key={item.label} className="p-4 rounded-xl border border-slate-700/50 bg-slate-800 shadow-sm">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-sm font-bold text-white">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-5 gap-8">
                    {/* Left: Detailed Breakdown */}
                    <div className="col-span-3 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Technická Specifikace
                            </h3>
                            <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-800">
                                <table className="w-full text-xs">
                                    <tbody>
                                        {techRows.map(([label, value], i) => (
                                            <tr key={label} className={i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}>
                                                <td className="px-4 py-3 text-slate-400 font-medium">{label}</td>
                                                <td className="px-4 py-3 text-white text-right font-bold">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-blue-900/50 bg-blue-900/20 flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700/50 shadow-sm">
                                <Shield className="w-5 h-5 text-treetino-light" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-white">Garance Výkonu</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Tato nabídka vychází z vysoce přesných dat z environmentálního skenování. Energetické stromy standardně zahrnují 25letou záruku na konstrukci a optimalizaci výnosu řízenou AI.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Street View Map */}
                    <div className="col-span-2 space-y-3 flex flex-col">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> Místo Instalace
                        </h3>
                        <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden bg-slate-900 relative border border-slate-700/50">
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
                                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                        <Map
                                            defaultCenter={{ lat: activePins[0].lat, lng: activePins[0].lng }}
                                            defaultZoom={18}
                                            mapId={GOOGLE_MAP_ID}
                                            mapTypeId="satellite"
                                            disableDefaultUI={true}
                                            gestureHandling="none"
                                            style={{ width: '100%', height: '100%' }}
                                        >
                                            {activePins.map((p, idx) => (
                                                <AdvancedMarker key={idx} position={{ lat: p.lat, lng: p.lng }}>
                                                    <img src="/top_view.png" alt="Tree Instance" className="w-[80px] h-[80px] object-contain drop-shadow-2xl" />
                                                </AdvancedMarker>
                                            ))}
                                        </Map>
                                    </APIProvider>
                                );
                            })()}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none z-10">
                                <span className="text-[10px] font-semibold text-slate-300 uppercase bg-slate-900/90 px-2 py-1 rounded border border-slate-700 backdrop-blur-md shadow-sm">Náhled Lokality</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Info Playground Form */}
                <div className="grid grid-cols-4 gap-4 border border-slate-700/50 p-5 rounded-xl bg-slate-800">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                            <User className="w-3.5 h-3.5 text-treetino-light" /> Jméno Klienta
                        </label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-treetino-light outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                            <MapPin className="w-3.5 h-3.5 text-treetino-light" /> IČO (Auto-Doplnění)
                            {isFetchingIco && <Loader2 className="w-3 h-3 animate-spin text-treetino-light" />}
                        </label>
                        <input
                            type="text"
                            value={ico}
                            onChange={handleIcoChange}
                            placeholder="Zadejte 8 číslic..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-treetino-light outline-none"
                            maxLength={8}
                        />
                        {clientAddress && clientAddress !== 'Energetická 123, Technologické Město' && (
                            <div className={`text-[10px] leading-tight font-medium pt-1 ${clientAddress.includes('Zkontrolujte') || clientAddress.includes('Zkuste to') ? 'text-red-400' : 'text-treetino-light'}`}>
                                {clientAddress}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5 text-treetino-light" /> Odhadovaná Spotřeba
                        </label>
                        <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg focus-within:border-treetino-light transition-colors">
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
                                className="h-full border-l border-slate-700 px-3 text-[10px] font-semibold text-treetino-light hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                {consumptionUnit}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                            <User className="w-3.5 h-3.5 text-treetino-light" /> Logo Klienta
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-treetino-light outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-treetino-light/10 file:text-treetino-light hover:file:bg-treetino-light/20 cursor-pointer"
                            />
                            {clientLogoBase64 && <div className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded border border-slate-700 bg-slate-800 overflow-hidden p-1 shadow-sm"><img src={clientLogoBase64} alt="Logo" className="w-full h-full object-contain" /></div>}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Treetino B2B Obchodní Platforma</p>
                        <div className="h-4 w-px bg-slate-700" />
                        <p className="text-[10px] font-bold text-treetino-light uppercase tracking-widest">Skóre spolehlivosti: 0.98</p>
                    </div>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={isGenerating || location.pins.some(p => p.type !== 'main-tree')}
                        className={`neo-btn-primary !w-auto px-10 py-3.5 !rounded-full flex items-center gap-2 ${location.pins.some(p => p.type !== 'main-tree') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                            {location.pins.some(p => p.type !== 'main-tree') 
                                ? 'Pouze pro V1 Strom' 
                                : (isGenerating ? 'Generuji...' : 'Generovat PDF Nabídku')}
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
