import { useCallback, useState, useEffect, useRef } from 'react';
import React from 'react';
import { APIProvider, Map3D, Marker3D, MapMode, AltitudeMode, Pin, useMap3D, Popover } from '@vis.gl/react-google-maps';
import { Globe } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { SelectedLocation, PinLocation, SpotPotential, Deal } from '../types';
import AddressSearch from './AddressSearch';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID as string || 'DEMO_MAP_ID';
const HAS_KEY = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here';

const INITIAL_VIEW = { lat: 50.0811, lng: 14.4512 }; // Prague (Supported 3D Mesh)


interface Props {
    selectedLocation: SelectedLocation | null;
    onLocationSelect: (loc: SelectedLocation) => void;
    onPinsChange?: (pins: PinLocation[]) => void;
    product?: string;
    allDeals?: Deal[];
    activeDeal?: Deal | null;
    onMapClick?: () => void;
}

export default function MapCanvas({ 
    onLocationSelect, 
    selectedLocation, 
    onPinsChange, 
    product,
    allDeals = [],
    activeDeal = null,
    onMapClick
}: Props) {
    const [pins, setPins] = useState<PinLocation[]>(selectedLocation?.pins || []);
    const [searchPin, setSearchPin] = useState<{lat: number, lng: number} | null>(null);
    const [hoveredDealId, setHoveredDealId] = useState<number | null>(null);

    // Sync local pins with selected location
    useEffect(() => {
        if (selectedLocation) {
            setPins(selectedLocation.pins || []);
        } else {
            setPins([]);
        }
    }, [selectedLocation]);

    const handlePlaceSelect = useCallback((lat: number, lng: number) => {
        setSearchPin({ lat, lng });
        setTimeout(() => {
            setSearchPin(null);
        }, 10000);
    }, []);

    const handleClick = useCallback((e: any) => {
        if (!e.detail.latLng) return;
        const { lat, lng } = e.detail.latLng;
        
        const newPin: PinLocation = {
            id: uuidv4(),
            lat,
            lng,
            type: (product || 'main-tree') as any
        };
        
        const newPins = [...pins, newPin];
        setPins(newPins);
        onPinsChange?.(newPins);

        if (!selectedLocation) {
            onLocationSelect({
                lat: Math.round(lat * 10000) / 10000,
                lon: Math.round(lng * 10000) / 10000,
                pins: newPins,
                potential: undefined
            });
        }
    }, [pins, product, selectedLocation, onPinsChange, onLocationSelect]);

    const handleRemovePin = useCallback((id: string) => {
        const newPins = pins.filter(p => p.id !== id);
        setPins(newPins);
        onPinsChange?.(newPins);
    }, [pins, onPinsChange]);

    useEffect(() => {
        if (!HAS_KEY) return;
        const interval = setInterval(() => {
            const mapEl = document.querySelector('gmp-map-3d');
            if (mapEl && mapEl.shadowRoot) {
                if (!mapEl.shadowRoot.querySelector('#treetino-controls-style')) {
                    const style = document.createElement('style');
                    style.id = 'treetino-controls-style';
                    style.textContent = `
                        div[style*="right: 0"], div[style*="right: 10px"], div[style*="right: 16px"] {
                            right: 420px !important;
                        }
                        .gm-bundled-control, .gm-fullscreen-control, .gm-style-cc {
                            right: 420px !important;
                        }
                        .bottom.right, .top.right {
                            right: 420px !important;
                        }
                    `;
                    mapEl.shadowRoot.appendChild(style);
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!HAS_KEY) {
        return <FallbackMap onClick={onMapClick} />;
    }

    // Filter deals that have saved coordinate configs, excluding the active one
    const otherDeals = allDeals.filter(d => d.config && d.id !== activeDeal?.id);
    const hoveredDeal = allDeals.find(d => d.id === hoveredDealId);

    return (
        <div className="absolute inset-0 map-container">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'maps3d', 'places']} version="alpha">
                <MapCameraController selectedLocation={selectedLocation} />
                <AddressSearch onPlaceSelect={handlePlaceSelect} />
                


                <Map3D
                    defaultCenter={{ ...INITIAL_VIEW, altitude: 500 }}
                    defaultRange={1000}
                    defaultHeading={45}
                    defaultTilt={65}
                    mode={MapMode.SATELLITE}
                    onClick={(e: any) => {
                        // Prevent placing a unit if the user clicked on a marker
                        if (e.domEvent) {
                            const target = e.domEvent.target as HTMLElement;
                            if (target && target.closest && target.closest('gmp-marker-3d, gmp-marker-3d-interactive')) {
                                return;
                            }
                            const path = e.domEvent.path || (e.domEvent.composedPath && e.domEvent.composedPath());
                            if (path) {
                                const hasMarker = path.some((el: any) => 
                                    el.tagName && (
                                        el.tagName.toLowerCase() === 'gmp-marker-3d' || 
                                        el.tagName.toLowerCase() === 'gmp-marker-3d-interactive'
                                    )
                                );
                                if (hasMarker) return;
                            }
                        }

                        setHoveredDealId(null);
                        onMapClick?.();
                        const position = e.detail?.position;
                        if (!position) return;
                        const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
                        const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
                        handleClick({ detail: { latLng: { lat, lng } } });
                    }}

                >
                    {/* Active Configuration Pins */}
                    {pins.map((pin) => (
                        <PinOverlay 
                            key={pin.id} 
                            pin={pin} 
                            potential={selectedLocation?.potential}
                            onRemove={() => handleRemovePin(pin.id)} 
                        />
                    ))}

                    {/* Permanent Red Pins representing other offers */}
                    {otherDeals.map((deal) => (
                        <DealMarker
                            key={`other-deal-${deal.id}`}
                            deal={deal}
                            hoveredDealId={hoveredDealId}
                            setHoveredDealId={setHoveredDealId}
                        />
                    ))}


                    {searchPin && (
                        <Marker3D
                            position={{ lat: searchPin.lat, lng: searchPin.lng }}
                            altitudeMode={AltitudeMode.RELATIVE_TO_GROUND}
                            drawsWhenOccluded={true}
                        >
                            <Pin
                                background="#ef4444"
                                borderColor="#b91c1c"
                                glyphColor="#ffffff"
                                scale={1.2}
                            />
                        </Marker3D>
                    )}
                </Map3D>
            </APIProvider>
        </div>
    );
}

function DealMarker({ 
    deal, 
    hoveredDealId, 
    setHoveredDealId 
}: { 
    deal: Deal; 
    hoveredDealId: number | null; 
    setHoveredDealId: (id: number | null) => void; 
}) {
    const markerRef = useRef<any>(null);
    const config = deal.config!;

    useEffect(() => {
        const el = markerRef.current;
        if (!el) return;

        const handleOver = () => setHoveredDealId(deal.id);
        const handleOut = () => setHoveredDealId(null);

        el.addEventListener('pointerover', handleOver);
        el.addEventListener('pointerout', handleOut);

        return () => {
            el.removeEventListener('pointerover', handleOver);
            el.removeEventListener('pointerout', handleOut);
        };
    }, [deal.id, setHoveredDealId]);

    return (
        <React.Fragment>
            <Marker3D
                ref={markerRef}
                position={{ lat: config.lat, lng: config.lon, altitude: 0 }}
                altitudeMode={AltitudeMode.CLAMP_TO_GROUND}
                drawsWhenOccluded={true}
                onClick={(e: any) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (e && e.preventDefault) e.preventDefault();
                    if (e && e.domEvent && e.domEvent.stopPropagation) e.domEvent.stopPropagation();
                    setHoveredDealId(hoveredDealId === deal.id ? null : deal.id);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60" fill="none" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                    <line x1="20" y1="35" x2="20" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.8"/>
                    <circle cx="20" cy="18" r="16" fill="#0f172a" fillOpacity="0.95" stroke="#f43f5e" strokeWidth="2.5"/>
                    <circle cx="20" cy="18" r="11" fill="#f43f5e" fillOpacity="0.1"/>
                    <circle cx="20" cy="18" r="5" fill="#f43f5e"/>
                </svg>
            </Marker3D>

            {hoveredDealId === deal.id && (
                <Popover
                    position={{ lat: config.lat, lng: config.lon, altitude: 15 }}
                >
                    <div 
                        className="p-5 w-72 text-left text-white"
                        style={{
                            pointerEvents: 'auto'
                        }}
                    >
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Uložená Nabídka
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">{deal.client_name}</h3>
                        <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">
                            Partner: <span className="text-slate-300 font-medium">{deal.partner_name}</span><br/>
                            Prodejce: <span className="text-slate-300 font-medium">{deal.agent_name}</span>
                        </p>
                        
                        <div className="flex flex-col gap-2 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Stav obchodu:</span>
                                <span className={`font-bold uppercase text-[9px] px-2.5 py-0.5 rounded-md border ${
                                    deal.status === 'Won' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    deal.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                    deal.status === 'Lost' ? 'bg-slate-700/10 text-slate-400 border-slate-700/20' :
                                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                }`}>
                                    {deal.status === 'Won' ? 'Vyhráno' :
                                     deal.status === 'Rejected' ? 'Zamítnuto' :
                                     deal.status === 'Lost' ? 'Prohráno' :
                                     deal.status === 'In Progress' ? 'V jednání' :
                                     deal.status === 'Stuck' ? 'Zaseknuto' : 'Příprava'}
                                </span>
                            </div>
                            {deal.config && (
                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                                    <span className="text-slate-400">Celková investice:</span>
                                    <strong className="text-treetino-light font-mono font-bold">
                                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(deal.config.total_price)}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>
                </Popover>
            )}
        </React.Fragment>
    );
}

function PinOverlay({ pin, potential, onRemove }: { pin: PinLocation, potential?: SpotPotential, onRemove: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const markerRef = useRef<any>(null);

    const strokeColor = isHovered ? "#ef4444" : (pin.type === 'small-tree' ? "#eab308" : (pin.type === 'standalone-turbine' ? "#3b82f6" : "#58cca8"));
    
    let iconPaths = null;
    if (isHovered) {
        iconPaths = (
            <React.Fragment>
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
            </React.Fragment>
        );
    } else if (pin.type === 'small-tree') {
        iconPaths = (
            <React.Fragment>
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </React.Fragment>
        );
    } else if (pin.type === 'standalone-turbine') {
        iconPaths = (
            <React.Fragment>
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
            </React.Fragment>
        );
    } else {
        iconPaths = (
            <React.Fragment>
                <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.8 1.7H17Z"/><path d="M12 22v-3"/>
            </React.Fragment>
        );
    }

    useEffect(() => {
        const el = markerRef.current;
        if (!el) return;

        const handleOver = () => setIsHovered(true);
        const handleOut = () => setIsHovered(false);

        el.addEventListener('pointerover', handleOver);
        el.addEventListener('pointerout', handleOut);

        return () => {
            el.removeEventListener('pointerover', handleOver);
            el.removeEventListener('pointerout', handleOut);
        };
    }, []);

    return (
        <Marker3D 
            ref={markerRef}
            position={{ lat: pin.lat, lng: pin.lng, altitude: 0 }}
            altitudeMode={AltitudeMode.CLAMP_TO_GROUND}
            drawsWhenOccluded={true}
            onClick={(e: any) => {
                if (e && e.stopPropagation) e.stopPropagation();
                if (e && e.preventDefault) e.preventDefault();
                if (e && e.domEvent && e.domEvent.stopPropagation) e.domEvent.stopPropagation();
                onRemove();
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80" fill="none" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <line x1="30" y1="45" x2="30" y2="80" stroke={strokeColor} strokeWidth="3" strokeDasharray="4 4" opacity="0.8"/>
                <circle cx="30" cy="26" r="24" fill="#0f172a" fillOpacity="0.95" stroke={strokeColor} strokeWidth="3" />
                <g transform="translate(18, 14)" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {iconPaths}
                </g>
            </svg>
        </Marker3D>
    );
}

function FallbackMap({ onClick }: { onClick?: () => void }) {
    return (
        <div onClick={onClick} className="map-grid absolute inset-0 cursor-crosshair flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-center">
                <Globe className="w-8 h-8 opacity-50 mb-4" />
                Není poskytnut Google Maps API klíč.<br/>
                Přidejte VITE_GOOGLE_MAPS_API_KEY and VITE_GOOGLE_MAP_ID do souboru .env.
            </div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/20" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/20" />
        </div>
    );
}

function MapCameraController({ selectedLocation }: { selectedLocation: SelectedLocation | null }) {
    const map3D = useMap3D();

    useEffect(() => {
        if (!map3D || !selectedLocation) return;
        
        const lat = selectedLocation.lat;
        const lng = selectedLocation.lon;
        
        if (typeof map3D.flyCameraTo === 'function') {
            map3D.flyCameraTo({
                endCamera: {
                    center: { lat, lng, altitude: 500 },
                    tilt: 65,
                    heading: 45,
                    range: 1000
                },
                durationMillis: 1500
            });
        } else {
            map3D.center = { lat, lng, altitude: 500 };
        }
    }, [map3D, selectedLocation]);

    return null;
}
