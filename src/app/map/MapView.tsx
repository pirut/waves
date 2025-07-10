"use client";
import Map, { Marker, Popup } from "react-map-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchEvents } from "../../api";
import maplibregl from "maplibre-gl";

const MAP_STYLE = "https://api.maptiler.com/maps/streets-v2/style.json?key=K6WmZnyE5taUYHe4fQ0P";

export default function MapView() {
    const [zoom, setZoom] = useState(2);
    const [events, setEvents] = useState<{ id: string; location?: { lat: number; lng: number }; title?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [popupInfo, setPopupInfo] = useState<{ lat: number; lng: number; title?: string } | null>(null);
    // Removed unused mapRef

    // Overlay fade threshold
    const overlayVisible = zoom < 4;
    const pointerEvents: "auto" | "none" = overlayVisible ? "auto" : "none";
    const overlayStyle: React.CSSProperties = {
        width: "22rem",
        maxWidth: "90vw",
        zIndex: 10,
        transition: "opacity 0.5s",
        opacity: overlayVisible ? 1 : 0,
        pointerEvents,
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    mapLib={maplibregl as any}
                    initialViewState={{
                        longitude: -80.13,
                        latitude: 25.79,
                        zoom: 2,
                    }}
                    style={{ width: "100%", height: "100%", borderRadius: "0px" }}
                    mapStyle={MAP_STYLE}
                    minZoom={2}
                    maxZoom={18}
                    onZoom={({ viewState }) => setZoom(viewState.zoom)}
                >
                    {!loading &&
                        events
                            .filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number")
                            .map((event) => (
                                <Marker
                                    key={event.id}
                                    longitude={event.location!.lng}
                                    latitude={event.location!.lat}
                                    anchor="center"
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        setPopupInfo({
                                            lat: event.location!.lat,
                                            lng: event.location!.lng,
                                            title: event.title,
                                        });
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            background: "#B3DFF2",
                                            borderRadius: "50%",
                                            border: "2px solid #7F8C8D",
                                            boxShadow: "0 2px 8px #0002",
                                            cursor: "pointer",
                                        }}
                                        title={event.title}
                                    />
                                </Marker>
                            ))}
                    {popupInfo && (
                        <Popup longitude={popupInfo.lng} latitude={popupInfo.lat} anchor="top" onClose={() => setPopupInfo(null)}>
                            <div>
                                <strong>{popupInfo.title}</strong>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>
            {/* Left Card Overlay */}
            <div className="absolute left-0 top-8" style={overlayStyle}>
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
            <div className="absolute right-0 top-8" style={overlayStyle}>
                <Card className="m-8 bg-white/90 backdrop-blur-md shadow-xl border-none flex flex-col justify-center">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-[#7F8C8D]">How to Use</h3>
                        <ul className="text-sm text-[#7F8C8D] list-disc pl-4">
                            <li>Zoom in to hide these cards and focus on the map.</li>
                            <li>Click markers to see event details.</li>
                            <li>Use the FAB to create a new event (future feature).</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
