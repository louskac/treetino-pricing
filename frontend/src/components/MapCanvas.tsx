import { useCallback, useState } from 'react';
import { APIProvider, Map3D, Marker3D, MapMode, AltitudeMode, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Sparkles, Sun, Wind, Globe, X } from 'lucide-react';
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

    if (!HAS_KEY) {
        return <FallbackMap />;
    }

    return (
        <div className="absolute inset-0 map-container">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'maps3d', 'places']} version="alpha">
                <AddressSearch />
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
                </Map3D>
            </APIProvider>
        </div>
    );
}

function PinOverlay({ pin, potential, onRemove }: { pin: PinLocation, potential?: SpotPotential, onRemove: () => void }) {
    // Determine color based on product type
    let colorClass = "fill-treetino-light shadow-[0_0_15px_rgba(88,204,168,0.5)] bg-treetino-light/30 border-treetino-light";
    let pinColor = "#58cca8"; // tree green
    let iconLabel = "MAIN TREE";
    
    if (pin.type === 'small-tree') {
        colorClass = "fill-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] bg-amber-400/30 border-amber-400";
        pinColor = "#fbbf24";
        iconLabel = "SMALL TREE";
    } else if (pin.type === 'standalone-turbine') {
        colorClass = "fill-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] bg-blue-400/30 border-blue-400";
        pinColor = "#60a5fa";
        iconLabel = "TURBINE";
    }

    return (
        <>
            <Marker3D 
                position={{ lat: pin.lat, lng: pin.lng, altitude: 0 }}
                altitudeMode={AltitudeMode.CLAMP_TO_GROUND}
                onClick={(e: any) => {
                    onRemove();
                }}
            >
                <Pin background={pinColor} borderColor={colorClass.includes('amber') ? '#d97706' : colorClass.includes('blue') ? '#2563eb' : '#059669'} glyphColor="white" />
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
