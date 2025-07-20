"use client";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useCallback, useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import CreateEventModal from "@/components/CreateEventModal";

// Event interface to match the data structure
interface Event {
    id: string;
    title?: string;
    description?: string;
    category?: string;
    location?: {
        lat: number;
        lng: number;
        address?: string;
    };
    attendees?: string[];
    maxAttendees?: number;
    createdBy?: string;
    time?: string;
    date?: string;
}

// Google Maps configuration
const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const center = {
    lat: 25.79,
    lng: -80.13,
};

const INITIAL_ZOOM = 10;

// Simple map options - let Google Maps handle mobile optimization
const getMapOptions = (): google.maps.MapOptions => {
    return {
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        // Always use greedy - this gives immediate touch response
        gestureHandling: "greedy",
        // Enable fractional zoom for smoother experience
        isFractionalZoomEnabled: true,
        // Basic settings
        clickableIcons: true,
        keyboardShortcuts: true,
        minZoom: 2,
        maxZoom: 20,
        tilt: 0,
        rotateControl: false,
        disableDoubleClickZoom: false,
    };
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
    const [overlayVisible, setOverlayVisible] = useState(true);
    const zoomRef = useRef(INITIAL_ZOOM);
    const mapOptions = useMemo(getMapOptions, []);
    const [selectedEvent, setSelectedEvent] = useState<{
        id: string;
        location: { lat: number; lng: number };
        title?: string;
        category?: string;
        description?: string;
    } | null>(null);

    // Use tRPC to fetch events
    const {
        data: events = [],
        isLoading: loading,
        refetch: loadEvents,
    } = trpc.events.getAll.useQuery() as {
        data: Event[];
        isLoading: boolean;
        refetch: () => void;
    };


    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        zoomRef.current = map.getZoom() || INITIAL_ZOOM;
        setOverlayVisible(zoomRef.current < 8);

        // Mobile touch optimization - let Google Maps handle everything
        const mapDiv = map.getDiv();
        if (mapDiv) {
            // Remove any conflicting touch-action styles
            mapDiv.style.touchAction = "";

            // Ensure the map container has proper styling for mobile
            const container = mapDiv.parentElement;
            if (container) {
                container.style.touchAction = "";
                container.style.overflow = "hidden";
            }
        }
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const onZoomChanged = useCallback(() => {
        if (map) {
            const currentZoom = map.getZoom() || INITIAL_ZOOM;
            zoomRef.current = currentZoom;
            setOverlayVisible(currentZoom < 8);
        }
    }, [map]);

    // Load Google Maps API once with latest version
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: "weekly", // Use the latest weekly release
        libraries: ["places"], // Load additional libraries if needed
    });

    // Memoize filtered events to prevent unnecessary re-renders
    const filteredEvents = useMemo(() => {
        return events.filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number");
    }, [events]);

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* Google Map */}
            {isLoaded ? (
                <div className="w-full h-full">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        defaultZoom={INITIAL_ZOOM}
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
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Mobile-optimized overlays */}
            {overlayVisible && (
                <>
                    {/* Welcome Card - Mobile optimized */}
                    <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto sm:w-80 z-20 pointer-events-auto">
                        <Card className="backdrop-blur-md bg-card/95 shadow-lg border border-border/50">
                            <CardContent className="p-3 sm:p-4">
                                <h3 className="section-title mb-2 text-sm sm:text-base">Welcome to Make Waves</h3>
                                <p className="subtitle mb-2 text-xs sm:text-sm">Zoom in to explore events around the world!</p>
                                <ul className="text-xs subtitle space-y-1">
                                    <li>🌊 3 events near Miami Beach</li>
                                    <li>🗺️ Drag, zoom, and explore</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* How to Use Card - Mobile optimized */}
                    <div className="absolute top-32 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto sm:w-80 z-20 pointer-events-auto">
                        <Card className="backdrop-blur-md bg-card/95 shadow-lg border border-border/50">
                            <CardContent className="p-3 sm:p-4">
                                <h3 className="section-title mb-2 text-sm sm:text-base">How to Use</h3>
                                <ul className="text-xs subtitle space-y-1 list-disc pl-4">
                                    <li>Zoom in to hide these cards</li>
                                    <li>Tap markers for event details</li>
                                    <li>Use + button to create events</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Create Event FAB */}
            <CreateEventModal onEventCreated={loadEvents} />
        </div>
    );
}
