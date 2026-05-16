import { useCallback, useState, useEffect, useRef } from 'react';
import { APIProvider, Map3D, Marker3D, MapMode, AltitudeMode, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Sparkles, Sun, Wind, Globe, X, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import type { SelectedLocation, PinLocation, SpotPotential } from '../types';
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
}

export default function MapCanvas({ onLocationSelect, selectedLocation, onPinsChange, product }: Props) {
    const [pins, setPins] = useState<PinLocation[]>(selectedLocation?.pins || []);
    const [searchPin, setSearchPin] = useState<{lat: number, lng: number} | null>(null);

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
                potential: undefined // will be fetched by App
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
                        /* Move Google Maps 3D internal controls away from the right edge */
                        div[style*="right: 0"], div[style*="right: 10px"], div[style*="right: 16px"] {
                            right: 420px !important;
                        }
                        /* Also target standard classes if they exist in shadow DOM */
                        .gm-bundled-control, .gm-fullscreen-control, .gm-style-cc {
                            right: 420px !important;
                        }
                        /* Sometimes the container has explicit right/bottom classes */
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
        return <FallbackMap />;
    }

    return (
        <div className="absolute inset-0 map-container">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'maps3d', 'places']} version="alpha">
                <AddressSearch onPlaceSelect={handlePlaceSelect} />
                <Map3D
                    defaultCenter={{ ...INITIAL_VIEW, altitude: 500 }}
                    defaultRange={1000}
                    defaultHeading={45}
                    defaultTilt={65}
                    mode={MapMode.SATELLITE}
                    onCenterChanged={(e: any) => {
                        // Position in 3D maps is different, but we can still handle clicks if supported
                    }}
                    onClick={(e: any) => {
                        const position = e.detail?.position;
                        if (!position) return;
                        // Depending on the API version, it might be a class with lat() or a literal with lat
                        const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
                        const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
                        handleClick({ detail: { latLng: { lat, lng } } });
                    }}
                >
                    {pins.map((pin) => (
                        <PinOverlay 
                            key={pin.id} 
                            pin={pin} 
                            potential={selectedLocation?.potential}
                            onRemove={() => handleRemovePin(pin.id)} 
                        />
                    ))}
                    {searchPin && (
                        <Marker3D
                            position={{ lat: searchPin.lat, lng: searchPin.lng }}
                            altitudeMode={AltitudeMode.RELATIVE_TO_GROUND}
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

function PinOverlay({ pin, potential, onRemove }: { pin: PinLocation, potential?: SpotPotential, onRemove: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    // SVG Icon Paths
    let strokeColor = "#58cca8"; // tree green
    let iconPaths = (
        <>
            <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.8 1.7H17Z"/>
            <path d="M12 22v-3"/>
        </>
    );
    
    if (isHovered) {
        strokeColor = "#ef4444"; // red
        iconPaths = (
            <>
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" x2="10" y1="11" y2="17"/>
                <line x1="14" x2="14" y1="11" y2="17"/>
            </>
        );
    } else if (pin.type === 'small-tree') {
        strokeColor = "#eab308"; // amber/yellow for sun
        iconPaths = (
            <>
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/>
                <path d="m19.07 4.93-1.41 1.41"/>
            </>
        );
    } else if (pin.type === 'standalone-turbine') {
        strokeColor = "#3b82f6"; // blue
        iconPaths = (
            <>
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
                <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
                <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
            </>
        );
    }

    return (
        <>
            <Marker3D 
                position={{ lat: pin.lat, lng: pin.lng, altitude: 0 }}
                altitudeMode={AltitudeMode.CLAMP_TO_GROUND}
                onClick={(e: any) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (e && e.preventDefault) e.preventDefault();
                    if (e && e.domEvent && e.domEvent.stopPropagation) e.domEvent.stopPropagation();
                    onRemove();
                }}
                // @ts-ignore
                onMouseEnter={() => setIsHovered(true)}
                // @ts-ignore
                onMouseLeave={() => setIsHovered(false)}
                title="Kliknutím odstraníte"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80" fill="none">
                    {/* Dashed line connecting to ground */}
                    <line x1="30" y1="45" x2="30" y2="80" stroke={strokeColor} strokeWidth="3" strokeDasharray="4 4" opacity="0.8"/>
                    {/* Jet Black circular background */}
                    <circle cx="30" cy="26" r="24" fill="#0f172a" fillOpacity="0.95" stroke={strokeColor} strokeWidth="3" />
                    {/* Inner Icon */}
                    <g transform="translate(18, 14)" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                        {iconPaths}
                    </g>
                </svg>
            </Marker3D>
        </>
    );
}

function FallbackMap() {
    return (
        <div className="map-grid absolute inset-0 cursor-crosshair flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-center">
                <Globe className="w-8 h-8 opacity-50 mb-4" />
                Není poskytnut Google Maps API klíč.<br/>
                Přidejte VITE_GOOGLE_MAPS_API_KEY a VITE_GOOGLE_MAP_ID do souboru .env.
            </div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/20" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/20" />
        </div>
    );
}
