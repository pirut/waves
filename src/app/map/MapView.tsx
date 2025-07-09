"use client";
import Map, { Marker, ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Style as MapboxStyle } from "mapbox-gl";
import type { MapRef } from "react-map-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

const pastelMapStyle = {
    version: 8,
    sources: {
        "raster-tiles": {
            type: "raster",
            tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
        },
    },
    layers: [
        {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
            minzoom: 0,
            maxzoom: 22,
        },
    ],
    background: {
        color: "#FFE5D4",
    },
};

const eventMarkers = [
    { id: 1, lat: 25.792, lng: -80.13, color: "#B3DFF2" },
    { id: 2, lat: 25.789, lng: -80.132, color: "#FFE5D4" },
    { id: 3, lat: 25.791, lng: -80.128, color: "#F6E8D6" },
];

export default function MapView() {
    const [zoom, setZoom] = useState(2);
    // const [fading, setFading] = useState(false); // REMOVE unused fading

    const onMove = useCallback((evt: ViewStateChangeEvent) => {
        setZoom(evt.viewState.zoom);
    }, []);

    const showCards = zoom <= 5;

    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

    // Helper to fade the map canvas
    const setCanvasOpacity = (opacity: number) => {
        const map = mapRef.current;
        if (map && map.getMap) {
            const canvas = map.getMap().getCanvas();
            if (canvas) {
                (canvas as HTMLCanvasElement).style.transition = "opacity 0.3s";
                (canvas as HTMLCanvasElement).style.opacity = String(opacity);
            }
        }
    };

    // Observe container resize, debounce resize and fade
    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = () => {
            // Fade out canvas
            setCanvasOpacity(0);
            // Debounce resize and fade in
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
            resizeTimeout.current = setTimeout(() => {
                mapRef.current?.resize();
                setCanvasOpacity(1);
            }, 350); // match transition duration
        };
        const observer = new window.ResizeObserver(handleResize);
        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
        };
    }, []);

    // Also trigger fade/resize on card show/hide (width transition)
    useEffect(() => {
        setCanvasOpacity(0);
        if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        fadeTimeout.current = setTimeout(() => {
            mapRef.current?.resize();
            setCanvasOpacity(1);
        }, 350);
        return () => {
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        };
    }, [showCards]);

    // Remove flex layout and resizing logic, use absolute overlay for cards
    return (
        <div className="relative w-full h-full">
            {/* Map Area (always full width/height) */}
            <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ willChange: "transform", borderRadius: "1.5rem" }}>
                <Map
                    ref={mapRef}
                    initialViewState={{
                        longitude: -80.13,
                        latitude: 25.79,
                        zoom: 2,
                        pitch: 0,
                        bearing: 0,
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
                    mapStyle={pastelMapStyle as MapboxStyle}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection={{ name: "globe" }}
                    attributionControl={true}
                    onMove={onMove}
                >
                    {eventMarkers.map((marker) => (
                        <Marker key={marker.id} longitude={marker.lng} latitude={marker.lat} anchor="center">
                            <div
                                style={{
                                    width: 18,
                                    height: 18,
                                    background: marker.color,
                                    borderRadius: "50%",
                                    border: "2px solid #7F8C8D",
                                    boxShadow: "0 2px 8px #0002",
                                }}
                            />
                        </Marker>
                    ))}
                </Map>
            </div>
            {/* Left Card Overlay */}
            <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${
                    showCards ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ width: "22rem", maxWidth: "90vw", zIndex: 10, transitionProperty: "opacity" }}
            >
                {showCards && (
                    <Card className="m-8 bg-white/90 backdrop-blur-md shadow-xl border-none flex flex-col justify-center">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-[#7F8C8D]">Welcome to Make Waves</h3>
                            <p className="text-[#7F8C8D] mb-2">
                                Zoom in to explore events around the world. This info card will hide as you get closer to the action!
                            </p>
                            <ul className="text-sm text-[#7F8C8D]">
                                <li>🌊 3 events near Miami Beach</li>
                                <li>🗺️ Drag, zoom, and explore</li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* Right Card Overlay */}
            <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${
                    showCards ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ width: "22rem", maxWidth: "90vw", zIndex: 10, transitionProperty: "opacity" }}
            >
                {showCards && (
                    <Card className="m-8 bg-white/90 backdrop-blur-md shadow-xl border-none flex flex-col justify-center">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-[#7F8C8D]">How to Use</h3>
                            <ul className="text-sm text-[#7F8C8D] list-disc pl-4">
                                <li>Zoom in to hide these cards and focus on the map.</li>
                                <li>Click markers to see event details (future feature).</li>
                                <li>Use the FAB to create a new event (future feature).</li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
