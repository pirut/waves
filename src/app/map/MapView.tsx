"use client";
import Map, { Marker, ViewStateChangeEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Style as MapboxStyle } from "mapbox-gl";
import type { MapRef } from "react-map-gl";
import { fetchEvents } from "../../api";

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

export default function MapView() {
    const [zoom, setZoom] = useState(2);
    const [events, setEvents] = useState<{ id: string; location?: { lat: number; lng: number }; title?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    // const [fading, setFading] = useState(false); // REMOVE unused fading

    const onMove = useCallback((evt: ViewStateChangeEvent) => {
        setZoom(evt.viewState.zoom);
    }, []);

    const mapRef = useRef<MapRef>(null);
    // const containerRef = useRef<HTMLDivElement>(null); // REMOVE: fade/resize logic and ResizeObserver
    // const fadeTimeout = useRef<NodeJS.Timeout | null>(null); // REMOVE: fade/resize logic and ResizeObserver
    // const resizeTimeout = useRef<NodeJS.Timeout | null>(null); // REMOVE: fade/resize logic and ResizeObserver

    // Helper to fade the map canvas // REMOVE: fade/resize logic and ResizeObserver
    // const setCanvasOpacity = (opacity: number) => { // REMOVE: fade/resize logic and ResizeObserver
    //     const map = mapRef.current; // REMOVE: fade/resize logic and ResizeObserver
    //     if (map && map.getMap) { // REMOVE: fade/resize logic and ResizeObserver
    //         const canvas = map.getMap().getCanvas(); // REMOVE: fade/resize logic and ResizeObserver
    //         if (canvas) { // REMOVE: fade/resize logic and ResizeObserver
    //             (canvas as HTMLCanvasElement).style.transition = "opacity 0.3s"; // REMOVE: fade/resize logic and ResizeObserver
    //             (canvas as HTMLCanvasElement).style.opacity = String(opacity); // REMOVE: fade/resize logic and ResizeObserver
    //         } // REMOVE: fade/resize logic and ResizeObserver
    //     } // REMOVE: fade/resize logic and ResizeObserver
    // }; // REMOVE: fade/resize logic and ResizeObserver

    // Observe container resize, debounce resize and fade // REMOVE: fade/resize logic and ResizeObserver
    // useEffect(() => { // REMOVE: fade/resize logic and ResizeObserver
    //     if (!containerRef.current) return; // REMOVE: fade/resize logic and ResizeObserver
    //     const handleResize = () => { // REMOVE: fade/resize logic and ResizeObserver
    //         // Fade out canvas // REMOVE: fade/resize logic and ResizeObserver
    //         setCanvasOpacity(0); // REMOVE: fade/resize logic and ResizeObserver
    //         // Debounce resize and fade in // REMOVE: fade/resize logic and ResizeObserver
    //         if (resizeTimeout.current) clearTimeout(resizeTimeout.current); // REMOVE: fade/resize logic and ResizeObserver
    //         resizeTimeout.current = setTimeout(() => { // REMOVE: fade/resize logic and ResizeObserver
    //             mapRef.current?.resize(); // REMOVE: fade/resize logic and ResizeObserver
    //             setCanvasOpacity(1); // REMOVE: fade/resize logic and ResizeObserver
    //         }, 350); // match transition duration // REMOVE: fade/resize logic and ResizeObserver
    //     }; // REMOVE: fade/resize logic and ResizeObserver
    //     const observer = new window.ResizeObserver(handleResize); // REMOVE: fade/resize logic and ResizeObserver
    //     observer.observe(containerRef.current); // REMOVE: fade/resize logic and ResizeObserver
    //     return () => { // REMOVE: fade/resize logic and ResizeObserver
    //         observer.disconnect(); // REMOVE: fade/resize logic and ResizeObserver
    //         if (resizeTimeout.current) clearTimeout(resizeTimeout.current); // REMOVE: fade/resize logic and ResizeObserver
    //     }; // REMOVE: fade/resize logic and ResizeObserver
    // }, []); // REMOVE: fade/resize logic and ResizeObserver

    // Also trigger fade/resize on card show/hide (width transition) // REMOVE: fade/resize logic and ResizeObserver
    // useEffect(() => { // REMOVE: fade/resize logic and ResizeObserver
    //     setCanvasOpacity(0); // REMOVE: fade/resize logic and ResizeObserver
    //     if (fadeTimeout.current) clearTimeout(fadeTimeout.current); // REMOVE: fade/resize logic and ResizeObserver
    //     fadeTimeout.current = setTimeout(() => { // REMOVE: fade/resize logic and ResizeObserver
    //         mapRef.current?.resize(); // REMOVE: fade/resize logic and ResizeObserver
    //         setCanvasOpacity(1); // REMOVE: fade/resize logic and ResizeObserver
    //     }, 350); // REMOVE: fade/resize logic and ResizeObserver
    //     return () => { // REMOVE: fade/resize logic and ResizeObserver
    //         if (fadeTimeout.current) clearTimeout(fadeTimeout.current); // REMOVE: fade/resize logic and ResizeObserver
    //     }; // REMOVE: fade/resize logic and ResizeObserver
    // }, [showCards]); // REMOVE: fade/resize logic and ResizeObserver

    // Remove flex layout and resizing logic, use absolute overlay for cards // REMOVE: fade/resize logic and ResizeObserver
    // Card slide/fade animation based on zoom
    const minZoom = 3;
    const maxZoom = 5;
    // Clamp progress between 0 (fully visible) and 1 (fully hidden)
    const progress = Math.min(Math.max((zoom - minZoom) / (maxZoom - minZoom), 0), 1);
    // Opacity and slide distance
    const cardOpacity = 1 - progress;
    const slideDistance = 120; // px
    const leftCardStyle = {
        width: "22rem",
        maxWidth: "90vw",
        zIndex: 10,
        transition: "opacity 0.5s, transform 0.5s",
        opacity: cardOpacity,
        transform: `translateY(-50%) translateX(-${progress * slideDistance}px)`,
    };
    const rightCardStyle = {
        width: "22rem",
        maxWidth: "90vw",
        zIndex: 10,
        transition: "opacity 0.5s, transform 0.5s",
        opacity: cardOpacity,
        transform: `translateY(-50%) translateX(${progress * slideDistance}px)`,
    };

    useEffect(() => {
        setLoading(true);
        fetchEvents()
            .then(setEvents)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Map Area (always full width/height) */}
            <div className="absolute inset-0 w-full h-full" style={{ willChange: "transform", borderRadius: "1.5rem" }}>
                <Map
                    ref={mapRef}
                    initialViewState={{
                        longitude: -80.13,
                        latitude: 25.79,
                        zoom: 2,
                        pitch: 0,
                        bearing: 0,
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: "0px" }}
                    mapStyle={pastelMapStyle as MapboxStyle}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection={{ name: "globe" }}
                    attributionControl={true}
                    onMove={onMove}
                >
                    {loading
                        ? null
                        : events
                              .filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number")
                              .map((event) => (
                                  <Marker key={event.id} longitude={event.location!.lng} latitude={event.location!.lat} anchor="center">
                                      <div
                                          style={{
                                              width: 18,
                                              height: 18,
                                              background: "#B3DFF2",
                                              borderRadius: "50%",
                                              border: "2px solid #7F8C8D",
                                              boxShadow: "0 2px 8px #0002",
                                          }}
                                          title={event.title}
                                      />
                                  </Marker>
                              ))}
                </Map>
            </div>
            {/* Left Card Overlay */}
            <div className="absolute left-0 top-1/2" style={leftCardStyle}>
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
            </div>
            {/* Right Card Overlay */}
            <div className="absolute right-0 top-1/2" style={rightCardStyle}>
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
            </div>
        </div>
    );
}
