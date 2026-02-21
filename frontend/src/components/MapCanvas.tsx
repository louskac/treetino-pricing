import { useCallback, useRef, useState, useEffect } from 'react';
import Map, { NavigationControl, Popup, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Feature, Polygon } from 'geojson';
import { MapPin, Globe, Sparkles, Zap, Sun, Wind, Loader2, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SelectedLocation } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const HAS_TOKEN = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'your_mapbox_token_here';

const INITIAL_VIEW = { longitude: 14.42, latitude: 50.08, zoom: 16, pitch: 45, bearing: -17 };

// Building layer paint for 3D extrusions
const BUILDING_LAYER: mapboxgl.FillExtrusionLayer = {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
        'fill-extrusion-color': '#1e293b',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.7,
    },
};

// Highlighted building
const HIGHLIGHT_LAYER: mapboxgl.FillExtrusionLayer = {
    id: 'building-highlight',
    source: 'highlight-source',
    type: 'fill-extrusion',
    paint: {
        'fill-extrusion-color': '#2762AD',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.85,
    },
};

interface Props {
    selectedLocation: SelectedLocation | null;
    onLocationSelect: (loc: SelectedLocation) => void;
}

// Estimate area from GeoJSON polygon coordinates (Shoelace formula in meters approx)
function estimateAreaM2(coords: number[][]): number {
    // Simple Shoelace on lng/lat → rough m² at mid-latitudes (1° ≈ 111km lat, ≈ 75km lng at 50°)
    const n = coords.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = coords[i][0] * 75000; // lng to meters
        const yi = coords[i][1] * 111000; // lat to meters
        const xj = coords[j][0] * 75000;
        const yj = coords[j][1] * 111000;
        area += xi * yj - xj * yi;
    }
    return Math.abs(area / 2);
}

export default function MapCanvas({ onLocationSelect, selectedLocation }: Props) {
    const mapRef = useRef<MapRef>(null);
    const [pin, setPin] = useState<{ lng: number; lat: number } | null>(null);
    const [highlightGeoJSON, setHighlightGeoJSON] = useState<FeatureCollection | null>(null);

    const handleClick = useCallback((e: MapMouseEvent) => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const { lng, lat } = e.lngLat;
        setPin({ lng, lat });

        // Try to find a building at the click point
        const features = map.queryRenderedFeatures(e.point, { layers: ['3d-buildings'] });
        let roofArea: number | null = null;
        let buildingId: string | undefined;
        let height: number | undefined;
        const isBuilding = features.length > 0;

        if (isBuilding) {
            const feature = features[0];
            buildingId = String(feature.id ?? '');
            height = feature.properties?.height;

            // Highlight
            const fc: FeatureCollection = {
                type: 'FeatureCollection',
                features: [feature as unknown as Feature],
            };
            setHighlightGeoJSON(fc);

            // Estimate area from geometry
            if (feature.geometry.type === 'Polygon') {
                const outerRing = (feature.geometry as Polygon).coordinates[0];
                roofArea = Math.round(estimateAreaM2(outerRing));
            }
        } else {
            setHighlightGeoJSON(null);
        }

        onLocationSelect({
            lat: Math.round(lat * 10000) / 10000,
            lon: Math.round(lng * 10000) / 10000,
            roofArea,
            height,
            buildingId,
            isBuilding
        });
    }, [onLocationSelect]);

    // Update highlight source whenever it changes
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const src = map.getSource('highlight-source') as mapboxgl.GeoJSONSource | undefined;
        if (src && highlightGeoJSON) {
            src.setData(highlightGeoJSON);
        } else if (src) {
            src.setData({ type: 'FeatureCollection', features: [] });
        }
    }, [highlightGeoJSON]);

    const onMapLoad = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        // Add 3D building layer
        const layers = map.getStyle().layers;
        let labelLayerId: string | undefined;
        for (const layer of layers || []) {
            if (layer.type === 'symbol' && (layer.layout as Record<string, unknown>)?.['text-field']) {
                labelLayerId = layer.id;
                break;
            }
        }

        if (!map.getLayer('3d-buildings')) {
            map.addLayer(BUILDING_LAYER, labelLayerId);
        }

        // Add highlight source + layer
        if (!map.getSource('highlight-source')) {
            map.addSource('highlight-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer(HIGHLIGHT_LAYER);
        }
    }, []);

    // ─── Fallback: no token ───────────────────────────────
    if (!HAS_TOKEN) {
        return (
            <FallbackMap onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />
        );
    }

    return (
        <div className="absolute inset-0">
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={INITIAL_VIEW}
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                onClick={handleClick}
                onLoad={onMapLoad}
                cursor="crosshair"
                antialias
            >
                <NavigationControl position="top-right" showCompass showZoom />

                {/* Live Evaluation Popup */}
                {selectedLocation && selectedLocation.potential && (
                    <Popup
                        longitude={selectedLocation.lon}
                        latitude={selectedLocation.lat}
                        anchor="bottom"
                        offset={45}
                        closeButton={false}
                        closeOnClick={false}
                        className="z-50 neo-panel"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-treetino-light uppercase tracking-[0.2em]">
                                <Sparkles className="w-3 h-3" /> Spot Evaluated
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                                        <Sun className="w-3 h-3 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-500">Sun Index</div>
                                        <div className="text-xs font-bold text-white">{selectedLocation.potential.solarIndex}%</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                                        <Wind className="w-3 h-3 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-500">Wind Avg</div>
                                        <div className="text-xs font-bold text-white">{selectedLocation.potential.avgWindSpeed}m/s</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Pin overlay */}
            <AnimatePresence>
                {pin && (
                    <PinOverlay lat={pin.lat} lng={pin.lng} mapRef={mapRef} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Pin rendered via screen projection ───────────────────
function PinOverlay({ lat, lng, mapRef }: { lat: number; lng: number; mapRef: React.RefObject<MapRef | null> }) {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        const update = () => {
            const p = map.project([lng, lat]);
            setPos({ x: p.x, y: p.y });
        };
        update();
        map.on('move', update);
        return () => { map.off('move', update); };
    }, [lat, lng, mapRef]);

    if (!pos) return null;

    return (
        <motion.div
            key={`${lat}-${lng}`}
            initial={{ y: -40, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute z-20 pointer-events-none"
            style={{ left: pos.x - 16, top: pos.y - 40 }}
        >
            <MapPin className="w-8 h-8 text-treetino-light drop-shadow-[0_4px_8px_rgba(39,98,173,0.5)] fill-treetino-light/20" />
            <div className="mt-0.5 text-[9px] font-black text-treetino-light bg-slate-950/80 px-2 py-0.5 rounded-md border border-treetino-light/30 text-center whitespace-nowrap">
                {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </div>
        </motion.div>
    );
}

// ─── Fallback grid when no Mapbox token ───────────────────
function FallbackMap({ onLocationSelect, selectedLocation }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        onLocationSelect({
            lat: Math.round((55 - py * 10) * 10000) / 10000,
            lon: Math.round((5 + px * 20) * 10000) / 10000,
            roofArea: null,
            isBuilding: false
        });
    }, [onLocationSelect]);

    return (
        <div ref={ref} onClick={handleClick} className="map-grid absolute inset-0 cursor-crosshair">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                <Globe className="w-3 h-3" />
                No Mapbox token — Add VITE_MAPBOX_TOKEN to .env
            </div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/20" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/20" />
        </div>
    );
}
