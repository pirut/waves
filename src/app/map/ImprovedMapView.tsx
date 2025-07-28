'use client';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import CreateEventModal from '@/components/CreateEventModal';
import { Locate, PanelLeftIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
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
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps.marker) return;

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

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [position, map]);

  return null;
}

// Optimized marker icon creation with caching
const markerIconCache = new Map<string, google.maps.Icon>();

const createMarkerIcon = (color: string): google.maps.Icon | undefined => {
  if (typeof google === 'undefined') return undefined;

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

// Category color mapping
const categoryColorMap: { [key: string]: string } = {
  Environmental: '#4ade80',
  'Community Service': '#60a5fa',
  Education: '#a78bfa',
  'Health & Wellness': '#fb7185',
  'Arts & Culture': '#fbbf24',
  'Social Justice': '#f97316',
  'Animal Welfare': '#10b981',
  'Disaster Relief': '#ef4444',
  'Youth Development': '#6366f1',
  'Senior Support': '#8b5cf6',
};

const getCategoryMarkerColor = (category: string) => {
  return categoryColorMap[category] || '#FFE5D4';
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

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { setMapBounds } = useMapBounds();
  const { toggleSidebar } = useSidebar();
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // State for viewport-based loading
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null);

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

  // Load all events initially
  const {
    data: allEvents = [],
    isLoading: loading,
    refetch: loadEvents,
  } = trpc.events.getAll.useQuery();

  // Firebase real-time updates
  useEffect(() => {
    if (!isMounted) return;

    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        const { db, auth } = await import('@/firebase');
        const { collection, onSnapshot } = await import('firebase/firestore');

        // Wait for auth state to be determined
        const waitForAuth = () => {
          return new Promise<void>((resolve) => {
            const unsubscribeAuth = auth.onAuthStateChanged(() => {
              unsubscribeAuth();
              resolve();
            });
          });
        };

        await waitForAuth();

        unsubscribe = onSnapshot(
          collection(db, 'events'),
          () => {
            // Trigger a refetch when data changes
            loadEvents();
          },
          (error) => {
            console.error('Realtime events error:', error);
            // Fallback to periodic refresh if real-time fails
            const interval = setInterval(() => {
              if (!document.hidden) {
                loadEvents();
              }
            }, 30000);
            return () => clearInterval(interval);
          }
        );
      } catch (error) {
        console.error('Failed to set up realtime listener:', error);
        // Fallback to periodic refresh
        const interval = setInterval(() => {
          if (!document.hidden) {
            loadEvents();
          }
        }, 30000);
        return () => clearInterval(interval);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isMounted, loadEvents]);

  // Filter events by current viewport with stable reference
  const eventsToShow = useMemo(() => {
    if (!currentBounds || !allEvents.length || typeof google === 'undefined') return allEvents;

    return allEvents.filter((event) => {
      const eventData = event as Event;
      if (!eventData.location) return false;

      const eventLatLng = new google.maps.LatLng(eventData.location.lat, eventData.location.lng);
      return currentBounds.contains(eventLatLng);
    });
  }, [allEvents, currentBounds]);

  // Load Google Maps API with clustering
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
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
        (error) => {
          console.log('Geolocation error:', error);
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

  // Ensure Map ID is available
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || '15a6e838f93a0ca12caba8f6';

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
        setMapBounds(bounds);
        setCurrentBounds(bounds);
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
      // Debounce zoom updates to prevent interference with interactions
      const currentZoom = mapRef.current.getZoom() || 10;
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setZoom((prevZoom) => (Math.abs(prevZoom - currentZoom) > 0.1 ? currentZoom : prevZoom));
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
          // Only update if bounds actually changed significantly
          const currentBoundsStr = currentBounds?.toString();
          const newBoundsStr = bounds.toString();

          if (currentBoundsStr !== newBoundsStr) {
            setMapBounds(bounds);
            setCurrentBounds(bounds);
          }
        }, 500); // Increased debounce time to reduce flashing
      }
    }
  }, [setMapBounds, currentBounds]);

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
        }
        markersRef.current.delete(eventId);
      }
    }

    // Create or reuse markers for current events
    filteredEvents.forEach((event) => {
      let marker = markersRef.current.get(event.id);

      if (!marker) {
        // Create new marker only if it doesn't exist
        if (!google.maps.marker) {
          // Fallback to standard markers if Advanced Markers not available
          marker = new google.maps.Marker({
            position: {
              lat: event.location!.lat,
              lng: event.location!.lng,
            },
            icon: createMarkerIcon(getCategoryMarkerColor(event.category || '')),
            title: event.title,
          });

          marker.addListener('click', () => {
            setSelectedEvent(event);
          });
        } else {
          // Create the marker element for Advanced Marker
          const markerDiv = document.createElement('div');
          markerDiv.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${getCategoryMarkerColor(event.category || '')}" stroke="#ffffff" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="#ffffff" opacity="0.8"/>
            </svg>
          `;

          marker = new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: event.location!.lat,
              lng: event.location!.lng,
            },
            content: markerDiv,
            title: event.title,
          });

          marker.addListener('click', () => {
            setSelectedEvent(event);
          });
        }

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
            // Custom cluster marker styling
            const color = count < 10 ? '#FFE5D4' : count < 50 ? '#F6E8D6' : '#B3DFF2';
            const size = count < 10 ? 40 : count < 50 ? 50 : 60;

            const svg = `
              <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="bold" fill="#333">${count}</text>
              </svg>
            `;

            return new google.maps.marker.AdvancedMarkerElement({
              position,
              content: (() => {
                const div = document.createElement('div');
                div.innerHTML = svg;
                return div.firstElementChild as HTMLElement;
              })(),
              zIndex: 1000 + count,
            });
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
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none">
            <div className="flex justify-between items-center">
              {/* Sidebar Toggle Button - Left side */}
              <Button
                variant="outline"
                onClick={toggleSidebar}
                size="sm"
                className="h-10 w-10 p-0 bg-background/95 backdrop-blur-sm shadow-lg pointer-events-auto"
              >
                <PanelLeftIcon className="h-4 w-4" />
              </Button>

              {/* Location Button - Right side */}
              {userLocation && (
                <Button
                  variant="outline"
                  onClick={goToUserLocation}
                  size="sm"
                  className="h-10 w-10 p-0 bg-background/95 backdrop-blur-sm shadow-lg pointer-events-auto"
                  title="Go to my location"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              )}
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
          mapId: mapId,
        }}
      >
        {/* User location marker using Advanced Marker */}
        {userLocation && (
          <UserLocationAdvancedMarker position={userLocation} map={mapRef.current} />
        )}

        {/* Event markers are now handled by MarkerClusterer */}

        {/* Improved InfoWindow */}
        {selectedEvent && selectedEvent.location && (
          <InfoWindow
            position={{
              lat: selectedEvent.location.lat,
              lng: selectedEvent.location.lng,
            }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className={isMobile ? 'p-2 max-w-xs' : 'p-3 max-w-sm'}>
              <h3 className={`font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {selectedEvent.title}
              </h3>
              {selectedEvent.category && (
                <div className={`flex items-center gap-2 mb-2`}>
                  <span
                    className={`inline-block rounded-full ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`}
                    style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                  />
                  <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {selectedEvent.category}
                  </span>
                </div>
              )}
              {selectedEvent.description && (
                <p
                  className={`text-gray-700 mb-3 ${isMobile ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}
                >
                  {selectedEvent.description}
                </p>
              )}
              <div className={`flex gap-2`}>
                <Button
                  size="sm"
                  onClick={() => (window.location.href = `/events/${selectedEvent.id}`)}
                  className={`flex-1 ${isMobile ? 'text-xs h-8' : 'text-sm h-9'}`}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className={isMobile ? 'text-xs h-8' : 'text-sm h-9'}
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

      {/* Custom Fast Zoom Controls */}
      <div className="absolute bottom-24 right-4 z-30 pointer-events-auto flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={zoomIn}
          className="w-10 h-10 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
          title="Zoom in (fast)"
        >
          <span className="text-lg font-bold">+</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={zoomOut}
          className="w-10 h-10 p-0 bg-background/95 backdrop-blur-sm shadow-lg"
          title="Zoom out (fast)"
        >
          <span className="text-lg font-bold">−</span>
        </Button>
      </div>
    </div>
  );
}
