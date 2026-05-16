import { useEffect, useRef, useState } from 'react';
import { useMap3D, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';

interface AddressSearchProps {
    onPlaceSelect?: (lat: number, lng: number) => void;
}

export default function AddressSearch({ onPlaceSelect }: AddressSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const placesLib = useMapsLibrary('places');
    const map3D = useMap3D();

    useEffect(() => {
        if (!placesLib || !inputRef.current) return;

        const options = {
            fields: ['geometry', 'name', 'formatted_address'],
        };

        const newAutocomplete = new placesLib.Autocomplete(inputRef.current, options);
        setAutocomplete(newAutocomplete);
    }, [placesLib]);

    useEffect(() => {
        if (!autocomplete || !map3D) return;

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            onPlaceSelect?.(lat, lng);

            // Fly the camera to the new location
            if (typeof map3D.flyCameraTo === 'function') {
                map3D.flyCameraTo({
                    endCamera: {
                        center: { lat, lng, altitude: 500 },
                        tilt: 65,
                        heading: 45,
                        range: 1000
                    },
                    durationMillis: 2000
                });
            } else {
                // Fallback if flyCameraTo is not available directly on the element
                map3D.center = { lat, lng, altitude: 500 };
            }
        });

        return () => {
            if (listener) {
                google.maps.event.removeListener(listener);
            }
        };
    }, [autocomplete, map3D]);

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-treetino-light transition-colors">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Vyhledat adresu..."
                    className="w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-white text-sm rounded-xl focus:ring-1 focus:ring-treetino-light focus:border-treetino-light block w-full pl-10 p-3 shadow-lg outline-none transition-all placeholder-slate-400"
                />
            </div>
        </div>
    );
}
