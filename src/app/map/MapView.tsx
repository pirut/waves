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
        <div className="w-full h-full p-0 m-0">
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
                                    <div className="w-4 h-4 rounded-full border-2 bg-primary border-primary shadow" title={event.title} />
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
            <div className="absolute left-0 top-2 sm:top-8 w-full sm:w-auto flex flex-col sm:block items-center" style={overlayStyle}>
                <Card className="m-2 sm:m-8 bg-card backdrop-blur-md shadow-xl border-none flex flex-col justify-center w-full sm:w-auto max-w-xs sm:max-w-md">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="text-xl font-bold mb-2 text-foreground">Welcome to Make Waves</h3>
                        <p className="text-muted-foreground mb-2">
                            Zoom in to explore events around the world. This info card will hide as you get closer to the action!
                        </p>
                        <ul className="text-sm text-muted-foreground">
                            <li>🌊 3 events near Miami Beach</li>
                            <li>🗺️ Drag, zoom, and explore</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            {/* Right Card Overlay */}
            <div className="absolute right-0 top-32 sm:top-8 w-full sm:w-auto flex flex-col sm:block items-center" style={overlayStyle}>
                <Card className="m-2 sm:m-8 bg-card backdrop-blur-md shadow-xl border-none flex flex-col justify-center w-full sm:w-auto max-w-xs sm:max-w-md">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="text-xl font-bold mb-2 text-foreground">How to Use</h3>
                        <ul className="text-sm text-muted-foreground list-disc pl-4">
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
