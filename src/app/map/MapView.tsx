"use client";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchEvents } from "../../api";
import CreateEventModal from "@/components/CreateEventModal";

// Google Maps configuration
const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const center = {
    lat: 25.79,
    lng: -80.13,
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
};

// Category color mapping
const categoryColorMap: { [key: string]: string } = {
    Environmental: "#4ade80", // Green
    "Community Service": "#60a5fa", // Blue
    Education: "#a78bfa", // Purple
    "Health & Wellness": "#fb7185", // Pink
    "Arts & Culture": "#fbbf24", // Yellow
    "Social Justice": "#f97316", // Orange
    "Animal Welfare": "#10b981", // Emerald
    "Disaster Relief": "#ef4444", // Red
    "Youth Development": "#6366f1", // Indigo
    "Senior Support": "#8b5cf6", // Violet
};

// Helper function to create marker icon (only call after Google Maps API is loaded)
const createMarkerIcon = (color: string) => {
    if (typeof google === "undefined") {
        return undefined;
    }
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="${color}" stroke="#ffffff" stroke-width="3"/>
            </svg>
        `)}`,
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12),
    };
};

const getCategoryMarkerColor = (category: string) => {
    return categoryColorMap[category] || "#FFE5D4"; // Default warm peach
};

export default function MapView() {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [zoom, setZoom] = useState(10);
    const [events, setEvents] = useState<{ id: string; location?: { lat: number; lng: number }; title?: string; category?: string; description?: string }[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<{
        id: string;
        location: { lat: number; lng: number };
        title?: string;
        category?: string;
        description?: string;
    } | null>(null);

    // Overlay fade threshold
    const overlayVisible = zoom < 8;
    const pointerEvents: "auto" | "none" = overlayVisible ? "auto" : "none";
    const overlayStyle: React.CSSProperties = {
        width: "22rem",
        maxWidth: "90vw",
        zIndex: 10,
        transition: "opacity 0.5s",
        opacity: overlayVisible ? 1 : 0,
        pointerEvents,
    };

    const loadEvents = useCallback(() => {
        setLoading(true);
        fetchEvents()
            .then(setEvents)
            .finally(() => setLoading(false));
    }, []);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const onZoomChanged = useCallback(() => {
        if (map) {
            const currentZoom = map.getZoom() || 10;
            setZoom(currentZoom);
        }
    }, [map]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Load Google Maps API once
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    // Memoize filtered events to prevent unnecessary re-renders
    const filteredEvents = useMemo(() => {
        return events.filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number");
    }, [events]);

    return (
        <div className="w-full h-full p-0 m-0">
            {/* Google Map */}
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={zoom}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onZoomChanged={onZoomChanged}
                    options={mapOptions}
                >
                    {!loading &&
                        filteredEvents.map((event) => (
                            <Marker
                                key={event.id}
                                position={{
                                    lat: event.location!.lat,
                                    lng: event.location!.lng,
                                }}
                                onClick={() => {
                                    setSelectedEvent({
                                        id: event.id,
                                        location: event.location!,
                                        title: event.title,
                                        category: event.category,
                                        description: event.description,
                                    });
                                }}
                                icon={createMarkerIcon(getCategoryMarkerColor(event.category || ""))}
                            />
                        ))}

                    {selectedEvent && (
                        <InfoWindow position={selectedEvent.location} onCloseClick={() => setSelectedEvent(null)}>
                            <div className="p-2 max-w-xs">
                                <h3 className="font-semibold text-sm mb-1">{selectedEvent.title}</h3>
                                {selectedEvent.category && (
                                    <p className="text-xs text-gray-600 mb-2">
                                        <span
                                            className="inline-block w-2 h-2 rounded-full mr-1"
                                            style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                                        />
                                        {selectedEvent.category}
                                    </p>
                                )}
                                {selectedEvent.description && <p className="text-xs text-gray-700 mb-2 line-clamp-2">{selectedEvent.description}</p>}
                                <button
                                    onClick={() => window.open(`/events/${selectedEvent.id}`, "_blank")}
                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading map...</p>
                    </div>
                </div>
            )}
            {/* Left Card Overlay */}
            <div className="absolute left-0 top-2 sm:top-8 w-full sm:w-auto flex flex-col sm:block items-center" style={overlayStyle}>
                <Card className="m-2 sm:m-8 backdrop-blur-md shadow-xl border-none flex flex-col justify-center w-full sm:w-auto max-w-xs sm:max-w-md">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="section-title mb-2">Welcome to Make Waves</h3>
                        <p className="subtitle mb-2">Zoom in to explore events around the world. This info card will hide as you get closer to the action!</p>
                        <ul className="text-sm subtitle">
                            <li>🌊 3 events near Miami Beach</li>
                            <li>🗺️ Drag, zoom, and explore</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            {/* Right Card Overlay */}
            <div className="absolute right-0 top-32 sm:top-8 w-full sm:w-auto flex flex-col sm:block items-center" style={overlayStyle}>
                <Card className="m-2 sm:m-8 backdrop-blur-md shadow-xl border-none flex flex-col justify-center w-full sm:w-auto max-w-xs sm:max-w-md">
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="section-title mb-2">How to Use</h3>
                        <ul className="text-sm subtitle list-disc pl-4">
                            <li>Zoom in to hide these cards and focus on the map.</li>
                            <li>Click markers to see event details.</li>
                            <li>Use the FAB to create a new event (future feature).</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Create Event FAB */}
            <CreateEventModal onEventCreated={loadEvents} />
        </div>
    );
}
