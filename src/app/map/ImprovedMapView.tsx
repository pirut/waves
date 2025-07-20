"use client";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import CreateEventModal from "@/components/CreateEventModal";
import { Search, Locate, X } from "lucide-react";

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

// Google Maps configuration - Better mobile support
const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

// Default center (Miami) - will be updated with user location
const defaultCenter = {
    lat: 25.79,
    lng: -80.13,
};

// Improved map options for better UX
const getMapOptions = (): google.maps.MapOptions => {
    return {
        disableDefaultUI: false,
        zoomControl: false, // Disable default zoom controls - we'll use custom ones
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
        isFractionalZoomEnabled: false, // Disable fractional zoom for snappier feel
        clickableIcons: false,
        keyboardShortcuts: true,
        minZoom: 3,
        maxZoom: 18,
        scrollwheel: true,
        tilt: 0,
        rotateControl: false,
        disableDoubleClickZoom: false,
        // Better styling
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
            },
        ],
    };
};

// Category color mapping
const categoryColorMap: { [key: string]: string } = {
    Environmental: "#4ade80",
    "Community Service": "#60a5fa",
    Education: "#a78bfa",
    "Health & Wellness": "#fb7185",
    "Arts & Culture": "#fbbf24",
    "Social Justice": "#f97316",
    "Animal Welfare": "#10b981",
    "Disaster Relief": "#ef4444",
    "Youth Development": "#6366f1",
    "Senior Support": "#8b5cf6",
};

// Optimized marker icon creation with caching
const markerIconCache = new Map<string, google.maps.Icon>();

const createMarkerIcon = (color: string): google.maps.Icon | undefined => {
    if (typeof google === "undefined") return undefined;

    if (markerIconCache.has(color)) {
        return markerIconCache.get(color);
    }

    const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="#ffffff" opacity="0.8"/>
            </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
    };

    markerIconCache.set(color, icon);
    return icon;
};

const getCategoryMarkerColor = (category: string) => {
    return categoryColorMap[category] || "#FFE5D4";
};

export default function ImprovedMapView() {
    // Use ref for map instance for better performance
    const mapRef = useRef<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(12);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Handle hydration by only running client-side code after mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    // Load Google Maps API with clustering
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["places", "geometry"],
    });

    // Get user location on mount (only after hydration) - but don't block map rendering
    useEffect(() => {
        if (!isMounted) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(userPos);
                    // Only update center if we haven't moved from default location
                    if (center.lat === defaultCenter.lat && center.lng === defaultCenter.lng) {
                        setCenter(userPos);
                        if (mapRef.current) {
                            mapRef.current.panTo(userPos);
                            mapRef.current.setZoom(12);
                        }
                    }
                },
                (error) => {
                    console.log("Geolocation error:", error);
                    // Keep default center if geolocation fails
                },
                {
                    timeout: 5000, // Don't wait forever for location
                    maximumAge: 300000, // 5 minutes
                }
            );
        }
    }, [isMounted, center.lat, center.lng]);

    // Memoize filtered events
    const filteredEvents = useMemo(() => {
        return events.filter((e) => e.location && typeof e.location.lat === "number" && typeof e.location.lng === "number");
    }, [events]);

    // Memoize map options for better performance
    const mapOptions = useMemo(() => getMapOptions(), []);

    // Search functionality
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || !mapRef.current || !isLoaded || typeof google === "undefined") return;

        setIsSearching(true);

        try {
            const geocoder = new google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: searchQuery }, (results, status) => {
                    if (status === "OK" && results && results.length > 0) {
                        resolve(results);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            });

            if (result[0]) {
                const location = result[0].geometry.location;
                const newCenter = { lat: location.lat(), lng: location.lng() };
                setCenter(newCenter);
                mapRef.current.panTo(newCenter);
                mapRef.current.setZoom(14);
                setSearchQuery(""); // Clear search after successful search
            }
        } catch (error) {
            console.error("Search failed:", error);
            // You could add a toast notification here for user feedback
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, isLoaded]);

    // Go to user location
    const goToUserLocation = useCallback(() => {
        if (userLocation && mapRef.current) {
            setCenter(userLocation);
            mapRef.current.panTo(userLocation);
            mapRef.current.setZoom(14);
        }
    }, [userLocation]);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;

        // Initialize zoom state from map instance
        const initialZoom = map.getZoom() || 10;
        setZoom(initialZoom);

        // Force a resize to ensure proper rendering
        setTimeout(() => {
            google.maps.event.trigger(map, "resize");
        }, 100);
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const onZoomChanged = useCallback(() => {
        if (mapRef.current) {
            // Update zoom directly from map for smoother interactions
            const currentZoom = mapRef.current.getZoom() || 10;
            setZoom(currentZoom);
        }
    }, []);

    // Add custom zoom controls with better increments
    const zoomIn = useCallback(() => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 10;
            const newZoom = Math.min(18, currentZoom + 2); // Zoom in by 2 levels for buttons
            mapRef.current.setZoom(newZoom);
        }
    }, []);

    const zoomOut = useCallback(() => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 10;
            const newZoom = Math.max(3, currentZoom - 2); // Zoom out by 2 levels for buttons
            mapRef.current.setZoom(newZoom);
        }
    }, []);

    // Override scroll wheel behavior ONLY on desktop (not mobile)
    useEffect(() => {
        if (!mapRef.current || !isMounted) return;

        // Detect if this is a mobile device (only after mount to avoid hydration issues)
        const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0;

        // Only override scroll wheel on desktop, let mobile handle everything natively
        if (isMobile) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const currentZoom = mapRef.current!.getZoom() || 10;
            // Much smaller increment for scroll wheel - 0.25 levels for very smooth feel
            const delta = e.deltaY > 0 ? -0.25 : 0.25;
            const newZoom = Math.max(3, Math.min(18, currentZoom + delta));

            mapRef.current!.setZoom(newZoom);
        };

        const mapDiv = mapRef.current.getDiv();
        if (mapDiv) {
            mapDiv.addEventListener("wheel", handleWheel, { passive: false });

            return () => {
                mapDiv.removeEventListener("wheel", handleWheel);
            };
        }
    }, [isMounted]);

    // Close info window when clicking elsewhere
    const onMapClick = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    // Show loading state only while Google Maps API is loading
    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* Loading indicator for enhanced features */}
            {!isMounted && (
                <div className="absolute top-4 left-4 right-4 z-30 pointer-events-auto">
                    <Card className="bg-card/95 backdrop-blur-sm">
                        <CardContent className="p-2 text-xs text-muted-foreground flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                            Loading enhanced features...
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search Bar - mobile optimized spacing */}
            {isMounted && (
                <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-auto">
                    <div className="flex gap-1 sm:gap-2 max-w-md">
                        <div className="flex-1 relative">
                            <Input
                                placeholder="Search location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pr-8 text-sm h-9 sm:h-10"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} size="sm" className="h-9 w-9 p-0 sm:h-10 sm:w-10">
                            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        {userLocation && (
                            <Button variant="outline" onClick={goToUserLocation} size="sm" className="h-9 w-9 p-0 sm:h-10 sm:w-10">
                                <Locate className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Google Map - render immediately when API is loaded */}
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onZoomChanged={onZoomChanged}
                onClick={onMapClick}
                options={mapOptions}
            >
                {/* User location marker */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
                                    <circle cx="10" cy="10" r="3" fill="#ffffff"/>
                                </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(20, 20),
                            anchor: new google.maps.Point(10, 10),
                        }}
                        title="Your Location"
                    />
                )}

                {/* Event markers */}
                {filteredEvents.map((event) => (
                    <Marker
                        key={event.id}
                        position={{
                            lat: event.location!.lat,
                            lng: event.location!.lng,
                        }}
                        onClick={() => setSelectedEvent(event)}
                        icon={createMarkerIcon(getCategoryMarkerColor(event.category || ""))}
                        title={event.title}
                    />
                ))}

                {/* Improved InfoWindow - mobile optimized */}
                {selectedEvent && selectedEvent.location && (
                    <InfoWindow
                        position={{
                            lat: selectedEvent.location.lat,
                            lng: selectedEvent.location.lng,
                        }}
                        onCloseClick={() => setSelectedEvent(null)}
                    >
                        <div className="p-2 sm:p-3 max-w-xs sm:max-w-sm">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">{selectedEvent.title}</h3>
                            {selectedEvent.category && (
                                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                    <span
                                        className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                                        style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                                    />
                                    <span className="text-xs sm:text-sm text-gray-600">{selectedEvent.category}</span>
                                </div>
                            )}
                            {selectedEvent.description && (
                                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">{selectedEvent.description}</p>
                            )}
                            <div className="flex gap-1 sm:gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => (window.location.href = `/events/${selectedEvent.id}`)}
                                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                                >
                                    View Details
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)} className="text-xs sm:text-sm h-8 sm:h-9">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-40">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Loading events...</span>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Event FAB */}
            <CreateEventModal onEventCreated={loadEvents} />

            {/* Custom Fast Zoom Controls - mobile optimized */}
            <div className="absolute bottom-24 right-2 sm:bottom-20 sm:right-4 z-30 pointer-events-auto flex flex-col gap-1 sm:gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    className="w-12 h-12 p-0 bg-background/95 backdrop-blur-sm shadow-lg sm:w-10 sm:h-10"
                    title="Zoom in (fast)"
                >
                    <span className="text-xl font-bold sm:text-lg">+</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    className="w-12 h-12 p-0 bg-background/95 backdrop-blur-sm shadow-lg sm:w-10 sm:h-10"
                    title="Zoom out (fast)"
                >
                    <span className="text-xl font-bold sm:text-lg">−</span>
                </Button>
            </div>

            {/* Map Stats - mobile optimized */}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-30 pointer-events-auto">
                <Card className="bg-card/95 backdrop-blur-sm">
                    <CardContent className="p-1.5 sm:p-2 text-xs text-muted-foreground">
                        <span className="hidden sm:inline">
                            {filteredEvents.length} events • Zoom: {zoom}
                        </span>
                        <span className="sm:hidden">{filteredEvents.length} events</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
