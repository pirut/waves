'use client';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useMapEvents } from '@/contexts/MapEventsContext';
import CreateEventModal from '@/components/CreateEventModal';
import { Locate, Plus, Minus } from 'lucide-react';
// import { useSidebar } from '@/components/ui/sidebar';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMapBounds } from '@/contexts/MapBoundsContext';

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
  [key: string]: unknown;
}

// Google Maps configuration - Better mobile support
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (West Palm Beach) - will be updated with user location
const defaultCenter = {
  lat: 26.7145,
  lng: -80.0549,
};

// Define libraries array as a static constant to prevent reloading
// Using proper type for Google Maps libraries - including marker for Advanced Markers
const mapLibraries: ('places' | 'geometry' | 'drawing' | 'visualization' | 'marker')[] = [
  'places',
  'geometry',
  'marker',
];

// Advanced Marker component for user location
function UserLocationAdvancedMarker({
  position,
  map,
}: {
  position: { lat: number; lng: number };
  map: google.maps.Map | null;
}) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(
    null
  );

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    // Try to use Advanced Markers if available
    if (google.maps.marker) {
      // Create marker element
      const markerDiv = document.createElement('div');
      markerDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
          <circle cx="10" cy="10" r="3" fill="#ffffff"/>
        </svg>
      `;

      // Create advanced marker
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        content: markerDiv,
        title: 'Your Location',
        map,
      });

      markerRef.current = marker;
    } else {
      // Fallback to regular marker
      const marker = new google.maps.Marker({
        position,
        title: 'Your Location',
        map,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="#ffffff"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10),
        },
      });

      markerRef.current = marker;
    }

    return () => {
      if (markerRef.current) {
        if ('map' in markerRef.current) {
          markerRef.current.map = null;
        } else if ('setMap' in markerRef.current) {
          markerRef.current.setMap(null);
        }
      }
    };
  }, [position, map]);

  return null;
}

// Category color mapping with improved colors
const categoryColorMap: { [key: string]: string } = {
  Environmental: '#10b981',
  'Community Service': '#3b82f6',
  Education: '#8b5cf6',
  'Health & Wellness': '#ef4444',
  'Arts & Culture': '#f59e0b',
  'Social Justice': '#f97316',
  'Animal Welfare': '#06b6d4',
  'Disaster Relief': '#dc2626',
  'Youth Development': '#6366f1',
  'Senior Support': '#ec4899',
};

const getCategoryMarkerColor = (category: string) => {
  return categoryColorMap[category] || '#6b7280';
};

// Improved map options for better UX - mobile-aware
const getMapOptions = (isMobile: boolean = false): google.maps.MapOptions => {
  return {
    disableDefaultUI: true,
    zoomControl: false, // Disable default zoom controls - we'll use custom ones
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false, // Disable fullscreen
    gestureHandling: 'greedy', // Allow all gestures without restrictions
    isFractionalZoomEnabled: true, // Enable fractional zoom for smoother interactions
    clickableIcons: false,
    keyboardShortcuts: !isMobile, // Disable keyboard shortcuts on mobile
    minZoom: 3,
    maxZoom: 18,
    scrollwheel: true, // Enable scroll wheel for smoother zooming
    tilt: 0,
    rotateControl: false,
    disableDoubleClickZoom: false,
    draggable: true, // Ensure dragging is enabled
    // Note: styles cannot be used when mapId is present
    // Map styling must be configured in Google Cloud Console
  };
};

export default function ImprovedMapView() {
  // Use ref for map instance for better performance
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { setEvents, setLoading: setGlobalLoading } = useMapEvents();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { setMapBounds } = useMapBounds();
  // Removed minimize button; keep hook import if needed elsewhere
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // State for viewport-based loading
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null);
  const currentBoundsKeyRef = useRef<string>('');
  const userInteractedRef = useRef<boolean>(false);
  const [committedBounds, setCommittedBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [hasPendingBoundsChange, setHasPendingBoundsChange] = useState(false);
  const [isZoomAcceptable, setIsZoomAcceptable] = useState(true);
  const [enableBoundsFiltering, setEnableBoundsFiltering] = useState(false);

  // Handle hydration by only running client-side code after mount
  useEffect(() => {
    setIsMounted(true);

    // Cleanup on unmount
    return () => {
      if (boundsUpdateTimeout.current) {
        clearTimeout(boundsUpdateTimeout.current);
      }

      // Clean up all markers
      for (const [, marker] of markersRef.current.entries()) {
        if ('map' in marker) {
          marker.map = null;
        } else if ('setMap' in marker) {
          marker.setMap(null);
        }
      }
      markersRef.current.clear();

      // Clean up clusterer
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    };
  }, []);

  // Load events for current map bounds from server
  const boundsInput = useMemo(() => {
    if (!committedBounds) return undefined;
    const ne = committedBounds.getNorthEast();
    const sw = committedBounds.getSouthWest();
    return {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };
  }, [committedBounds]);

  const {
    data: allEvents = [],
    isLoading: loading,
    refetch: loadEvents,
  } = trpc.events.getByBounds.useQuery(
    boundsInput as unknown as {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    { enabled: !!boundsInput }
  );

  // No auto-refetch on move; rely on explicit user action

  // Filter events by current viewport with stable reference
  const eventsToShow = useMemo(() => {
    // Show all events initially when map is loading or when no bounds are set
    if (
      !currentBounds ||
      !allEvents.length ||
      typeof google === 'undefined' ||
      !enableBoundsFiltering
    ) {
      return allEvents;
    }

    // Only filter by bounds if we have valid bounds and events and bounds filtering is enabled
    return allEvents.filter((event) => {
      const eventData = event as Event;
      if (!eventData.location) return false;

      const eventLatLng = new google.maps.LatLng(eventData.location.lat, eventData.location.lng);
      return currentBounds.contains(eventLatLng);
    });
  }, [allEvents, currentBounds, enableBoundsFiltering]);

  // Load Google Maps API with clustering
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    version: 'weekly',
    libraries: mapLibraries,
  });

  // Get user location on mount and search that area
  useEffect(() => {
    if (!isMounted) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
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
        () => {
          // Keep default center if geolocation fails
        },
        {
          timeout: 5000, // Don't wait forever for location
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, [isMounted, center.lat, center.lng]);

  // Memoize filtered events from viewport
  const filteredEvents = useMemo(() => {
    return eventsToShow.filter((e): e is Event => {
      const event = e as Event;
      return !!(
        event.location &&
        typeof event.location.lat === 'number' &&
        typeof event.location.lng === 'number'
      );
    });
  }, [eventsToShow]);

  // Keep shared context in sync for sidebar consumption (avoid redundant updates)
  const lastLoadingRef = useRef<boolean>(false);
  useEffect(() => {
    if (lastLoadingRef.current !== loading) {
      lastLoadingRef.current = loading;
      setGlobalLoading(loading);
    }
  }, [loading, setGlobalLoading]);

  const lastEmittedKeyRef = useRef<string>('');
  useEffect(() => {
    // Only push when the array meaningfully changes (length or ids) to avoid render loops
    if (!Array.isArray(allEvents)) return;
    const ids = (allEvents as Array<{ id: string }>).map((e) => e.id).join('|');
    const key = `${allEvents.length}:${ids}`;
    if (key !== lastEmittedKeyRef.current) {
      lastEmittedKeyRef.current = key;
      setEvents(allEvents as unknown as Event[]);
    }
  }, [allEvents, setEvents]);

  // Detect mobile for map options (only after mount to avoid hydration issues)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!isMounted) return;

    // Detect mobile only after hydration
    const detectMobile = () => {
      // Check user agent
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ) {
        return true;
      }
      // Check for touch capability
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        return true;
      }
      // Check screen size as additional indicator
      if (window.innerWidth <= 768) {
        return true;
      }
      return false;
    };

    setIsMobile(detectMobile());
  }, [isMounted]);

  // Ensure Map ID is available - use undefined if not properly configured
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  // Memoize map options for better performance - mobile-aware
  const mapOptions = useMemo(() => getMapOptions(isMobile), [isMobile]);

  // Go to user location
  const goToUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      setCenter(userLocation);
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // Initialize zoom state from map instance
      const initialZoom = map.getZoom() || 10;
      setZoom(initialZoom);

      // Set initial bounds for viewport-based loading
      const bounds = map.getBounds();
      if (bounds) {
        setCurrentBounds(bounds);
        currentBoundsKeyRef.current = bounds.toString();
        // Set initial committed bounds to trigger first load
        setCommittedBounds((prev) => prev || bounds);
        // Publish committed bounds to context once on initial load
        if (!committedBounds) setMapBounds(bounds);
        setHasPendingBoundsChange(false);
        userInteractedRef.current = false;
        // Initial query runs via boundsInput enabling; no manual refetch needed
      }

      // Force a resize to ensure proper rendering
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
      }, 100);
    },
    [setMapBounds]
  );

  const onUnmount = useCallback(() => {
    // Clean up timeouts to prevent memory leaks
    if (boundsUpdateTimeout.current) {
      clearTimeout(boundsUpdateTimeout.current);
    }
    mapRef.current = null;
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      requestAnimationFrame(() => {
        setZoom((prevZoom) => (Math.abs(prevZoom - currentZoom) > 0.1 ? currentZoom : prevZoom));
        setIsZoomAcceptable(currentZoom >= 10); // Disallow search when zoomed out too far
      });
    }
  }, []);

  // Handle bounds change for viewport-based loading (throttled and debounced)
  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        // Debounce bounds updates to prevent interference with dragging
        if (boundsUpdateTimeout.current) {
          clearTimeout(boundsUpdateTimeout.current);
        }
        boundsUpdateTimeout.current = setTimeout(() => {
          // If this is the first bounds notification, commit them and fetch once (no button)
          if (!committedBounds) {
            const firstStr = bounds.toString();
            setCurrentBounds(bounds);
            currentBoundsKeyRef.current = firstStr;
            setCommittedBounds(bounds);
            setMapBounds(bounds);
            setHasPendingBoundsChange(false);
            setEnableBoundsFiltering(false);
            userInteractedRef.current = false;
            return;
          }

          const newBoundsStr = bounds.toString();
          const committedStr = committedBounds?.toString();
          const prevStr = currentBoundsKeyRef.current;

          if (newBoundsStr !== prevStr) {
            setCurrentBounds(bounds);
            currentBoundsKeyRef.current = newBoundsStr;
            // Mark that the user has interacted with the map after initial load
            userInteractedRef.current = true;
            // Only show after initial commit exists and differs from current
            setHasPendingBoundsChange(
              Boolean(userInteractedRef.current && committedStr && committedStr !== newBoundsStr)
            );
            // Enable viewport filtering after user interaction
            setEnableBoundsFiltering(true);
          }
        }, 500);
      }
    }
  }, [committedBounds]);

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

  // Store markers in a ref to prevent recreation and flashing
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >(new Map());

  // Create or update markers only when events actually change
  const markers = useMemo(() => {
    if (!mapRef.current || !isLoaded || !filteredEvents.length || typeof google === 'undefined') {
      return [];
    }

    const newMarkers: (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[] = [];
    const currentEventIds = new Set(filteredEvents.map((event) => event.id));

    // Remove markers for events that are no longer visible
    for (const [eventId, marker] of markersRef.current.entries()) {
      if (!currentEventIds.has(eventId)) {
        // Remove marker from map and cache
        if ('map' in marker) {
          marker.map = null;
        } else if ('setMap' in marker) {
          marker.setMap(null);
        }
        markersRef.current.delete(eventId);
      }
    }

    // Create or reuse markers for current events
    filteredEvents.forEach((event) => {
      let marker = markersRef.current.get(event.id);

      if (!marker) {
        // Create new marker only if it doesn't exist
        // Try to use Advanced Markers if available and Map ID is configured

        if (google.maps.marker && mapId) {
          // Create the marker element for Advanced Marker with improved design
          const markerDiv = document.createElement('div');
          const color = getCategoryMarkerColor(event.category || '');
          markerDiv.innerHTML = `
            <div style="
              width: 40px; 
              height: 40px; 
              position: relative;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer glow -->
                <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.2"/>
                <!-- Main pin body -->
                <circle cx="20" cy="20" r="14" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <!-- Inner highlight -->
                <circle cx="20" cy="20" r="8" fill="#ffffff" opacity="0.9"/>
                <!-- Center dot -->
                <circle cx="20" cy="20" r="4" fill="${color}"/>
                <!-- Pin point -->
                <path d="M20 34 L16 40 L24 40 Z" fill="${color}" stroke="#ffffff" stroke-width="1"/>
              </svg>
            </div>
          `;

          marker = new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: event.location!.lat,
              lng: event.location!.lng,
            },
            content: markerDiv,
            title: event.title,
          });
        } else {
          // Fallback to regular markers if Advanced Markers not available
          const color = getCategoryMarkerColor(event.category || '');
          marker = new google.maps.Marker({
            position: {
              lat: event.location!.lat,
              lng: event.location!.lng,
            },
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <!-- Outer glow -->
                  <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.2"/>
                  <!-- Main pin body -->
                  <circle cx="20" cy="20" r="14" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                  <!-- Inner highlight -->
                  <circle cx="20" cy="20" r="8" fill="#ffffff" opacity="0.9"/>
                  <!-- Center dot -->
                  <circle cx="20" cy="20" r="4" fill="${color}"/>
                  <!-- Pin point -->
                  <path d="M20 34 L16 40 L24 40 Z" fill="${color}" stroke="#ffffff" stroke-width="1"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40),
            },
            title: event.title,
          });
        }

        marker.addListener('click', () => {
          setSelectedEvent(event);
        });

        // Cache the marker
        markersRef.current.set(event.id, marker);
      }

      newMarkers.push(marker);
    });

    return newMarkers;
  }, [isLoaded, filteredEvents]);

  // Initialize marker clustering (only when markers change)
  useEffect(() => {
    if (!mapRef.current || !markers.length) {
      // Clear clusterer if no markers
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      return;
    }

    // Initialize clusterer only once
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: [],
        renderer: {
          render: ({ count, position }) => {
            // Enhanced cluster marker styling
            const getClusterColor = (count: number) => {
              if (count < 5) return '#3b82f6';
              if (count < 10) return '#f59e0b';
              if (count < 20) return '#ef4444';
              return '#8b5cf6';
            };

            const color = getClusterColor(count);
            const size = count < 10 ? 44 : count < 20 ? 52 : 60;

            const svg = `
              <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer glow -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" opacity="0.2"/>
                <!-- Main circle -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <!-- Inner highlight -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="#ffffff" opacity="0.3"/>
                <!-- Count text -->
                <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${Math.max(12, size / 4)}" font-weight="bold" fill="#ffffff">${count}</text>
              </svg>
            `;

            // Try to use Advanced Markers for clusters if available
            if (google.maps.marker) {
              return new google.maps.marker.AdvancedMarkerElement({
                position,
                content: (() => {
                  const div = document.createElement('div');
                  div.innerHTML = svg;
                  return div.firstElementChild as HTMLElement;
                })(),
                zIndex: 1000 + count,
              });
            } else {
              // Fallback to regular marker for clusters
              return new google.maps.Marker({
                position,
                icon: {
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
                  scaledSize: new google.maps.Size(size, size),
                  anchor: new google.maps.Point(size / 2, size / 2),
                },
                zIndex: 1000 + count,
              });
            }
          },
        },
      });
    }

    // Update markers in clusterer without recreating it
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(markers);

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    };
  }, [markers]);

  // Removed custom scroll wheel handler to prevent interference with drag behavior
  // Google Maps handles scroll wheel zooming natively and more smoothly

  // Close info window when clicking elsewhere
  const onMapClick = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Show loading state while Google Maps API is loading or during hydration
  if (!isLoaded || !isMounted) {
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
      {/* Map Controls */}
      {isMounted && (
        <>
          {/* Compact control stack top-right */}
          <div className="absolute top-4 right-4 z-30 pointer-events-auto">
            <div className="flex flex-col gap-2">
              {/* Locate */}
              {userLocation && (
                <Button
                  variant="outline"
                  onClick={goToUserLocation}
                  size="icon"
                  className="h-10 w-10 p-0 bg-background/90 backdrop-blur-sm shadow-lg"
                  title="Go to my location"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              )}
              {/* Zoom group */}
              <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    className="h-10 w-10"
                    title="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="h-px bg-border" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    className="h-10 w-10"
                    title="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Google Map - render immediately when API is loaded */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={isMobile ? 12 : zoom} // Fixed initial zoom for mobile, controlled zoom for desktop
        onLoad={onLoad}
        onUnmount={onUnmount}
        {...(!isMobile && { onZoomChanged })} // Only track zoom changes on desktop
        onBoundsChanged={onBoundsChanged} // Track viewport changes for event loading
        onClick={onMapClick}
        options={{
          ...mapOptions,
          ...(mapId && { mapId }),
        }}
      >
        {/* User location marker using Advanced Marker */}
        {userLocation && (
          <UserLocationAdvancedMarker position={userLocation} map={mapRef.current} />
        )}

        {/* Event markers are now handled by MarkerClusterer */}

        {/* Enhanced InfoWindow */}
        {selectedEvent && selectedEvent.location && (
          <InfoWindow
            position={{
              lat: selectedEvent.location.lat,
              lng: selectedEvent.location.lng,
            }}
            onCloseClick={() => setSelectedEvent(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -50),
              maxWidth: isMobile ? 280 : 320,
            }}
          >
            <div className={`${isMobile ? 'p-3' : 'p-4'} max-w-sm bg-white rounded-lg shadow-lg`}>
              {/* Header with category badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3
                    className={`font-bold text-gray-900 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}
                  >
                    {selectedEvent.title}
                  </h3>
                  {selectedEvent.category && (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                      />
                      <span
                        className={`text-gray-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
                      >
                        {selectedEvent.category}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <p
                  className={`text-gray-700 mb-4 leading-relaxed ${isMobile ? 'text-xs line-clamp-3' : 'text-sm line-clamp-3'}`}
                >
                  {selectedEvent.description}
                </p>
              )}

              {/* Location info */}
              {selectedEvent.location?.address && (
                <div className="flex items-center gap-2 mb-4 text-gray-600">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                    {selectedEvent.location.address}
                  </span>
                </div>
              )}

              {/* Date info */}
              {selectedEvent.date && (
                <div className="flex items-center gap-2 mb-4 text-gray-600">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => (window.location.href = `/events/${selectedEvent.id}`)}
                  className={`flex-1 ${isMobile ? 'text-xs h-8' : 'text-sm h-9'} bg-blue-600 hover:bg-blue-700`}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className={`${isMobile ? 'text-xs h-8' : 'text-sm h-9'} border-gray-300 hover:bg-gray-50`}
                >
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
      <CreateEventModal />

      {/* Search this area button - restyled */}
      {hasPendingBoundsChange && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="bg-background/90 backdrop-blur-sm rounded-full shadow-lg border border-border overflow-hidden">
            <Button
              onClick={() => {
                if (currentBounds) {
                  setCommittedBounds(currentBounds);
                  setMapBounds(currentBounds);
                  setHasPendingBoundsChange(false);
                  loadEvents();
                }
              }}
              variant="ghost"
              disabled={!isZoomAcceptable}
              className="px-5 py-2"
            >
              {isZoomAcceptable ? 'Search this area' : 'Zoom in to search'}
            </Button>
          </div>
        </div>
      )}

      {/* Category legend removed per request */}
    </div>
  );
}
