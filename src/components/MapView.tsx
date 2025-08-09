'use client';

import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Event } from '@/types/event';
import { useMapBounds } from '@/contexts/MapBoundsContext';

// Map configuration
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (United States center)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

// Define libraries array as a static constant
const mapLibraries: ('places' | 'geometry' | 'marker')[] = ['places', 'geometry', 'marker'];

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

export interface MapViewProps {
  events?: Event[];
  className?: string;

  // Map behavior configuration
  interactive?: boolean; // Enable/disable user interaction
  showZoomControls?: boolean;
  showFullscreenControl?: boolean;
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';

  // Initial map state
  center?: { lat: number; lng: number };
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;

  // Event handling
  onBoundsChanged?: (events: Event[]) => void;
  onEventClick?: (event: Event) => void;
  onMapClick?: (lat: number, lng: number) => void;

  // Display options
  showEventMarkers?: boolean;
  showUserLocation?: boolean;
  showInfoWindows?: boolean;

  // Overlay options
  showClickOverlay?: boolean;
  overlayClickAction?: () => void;
  overlayTitle?: string;

  // Loading state
  loadingComponent?: React.ReactNode;
  emptyStateComponent?: React.ReactNode;
}

export function MapView({
  events = [],
  className = '',
  interactive = true,
  showZoomControls = false,
  showFullscreenControl = false,
  gestureHandling = 'cooperative',
  center,
  zoom = 10,
  minZoom = 8,
  maxZoom = 18,
  onBoundsChanged,
  onEventClick,
  onMapClick,
  showEventMarkers = true,
  showUserLocation = true,
  showInfoWindows = true,
  showClickOverlay = false,
  overlayClickAction,
  overlayTitle = 'Click to open full map',
  loadingComponent,
  emptyStateComponent,
}: MapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >(new Map());
  const { setMapBounds } = useMapBounds();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries: mapLibraries,
  });

  // Map ID for Advanced Markers
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  // Get user location on mount if enabled
  useEffect(() => {
    if (!isMounted || !showUserLocation || typeof window === 'undefined' || !navigator.geolocation)
      return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userPos);

        // If no custom center is provided, use user location
        if (!center) {
          setMapCenter(userPos);

          // If map is already loaded, center it immediately
          if (mapRef.current) {
            mapRef.current.setCenter(userPos);
            mapRef.current.setZoom(zoom);
          }
        }
      },
      () => {
        // Keep default center if geolocation fails
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [isMounted, showUserLocation, center, zoom]);

  // Map options based on props
  const mapOptions: google.maps.MapOptions = useMemo(
    () => ({
      disableDefaultUI: !interactive,
      zoomControl: showZoomControls,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: showFullscreenControl,
      gestureHandling: interactive ? gestureHandling : 'none',
      clickableIcons: interactive,
      keyboardShortcuts: interactive,
      minZoom,
      maxZoom,
      scrollwheel: interactive,
      draggable: interactive,
      disableDoubleClickZoom: !interactive,
      ...(mapId && { mapId }),
    }),
    [interactive, showZoomControls, showFullscreenControl, gestureHandling, minZoom, maxZoom, mapId]
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setMapReady(true);

      // Set initial center and zoom
      if (center || userLocation) {
        const initialCenter = center || userLocation || defaultCenter;
        map.setCenter(initialCenter);
        map.setZoom(zoom);
      }

      // Add bounds changed listener if callback provided
      if (onBoundsChanged) {
        const updateBounds = () => {
          const bounds = map.getBounds();
          if (bounds) {
            setMapBounds(bounds);

            // Filter events in current bounds and notify parent
            const eventsInBounds = events.filter((event) => {
              if (
                !event.location ||
                typeof event.location.lat !== 'number' ||
                typeof event.location.lng !== 'number'
              ) {
                return false;
              }
              const eventLatLng = new google.maps.LatLng(event.location.lat, event.location.lng);
              return bounds.contains(eventLatLng);
            });

            onBoundsChanged(eventsInBounds);
          }
        };

        const debouncedUpdateBounds = () => {
          if (boundsUpdateTimeout.current) {
            clearTimeout(boundsUpdateTimeout.current);
          }
          boundsUpdateTimeout.current = setTimeout(updateBounds, 500);
        };

        map.addListener('bounds_changed', debouncedUpdateBounds);

        // Trigger initial bounds update after a delay to allow map to settle
        setTimeout(updateBounds, 500);
      }

      // Add map click listener if callback provided
      if (onMapClick) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }
    },
    [center, userLocation, zoom, onBoundsChanged, onMapClick, events, setMapBounds]
  );

  const onUnmount = useCallback(() => {
    // Clean up timeout
    if (boundsUpdateTimeout.current) {
      clearTimeout(boundsUpdateTimeout.current);
    }

    // Clean up markers
    for (const [, marker] of markersRef.current.entries()) {
      if ('map' in marker) {
        marker.map = null;
      } else if ('setMap' in marker) {
        marker.setMap(null);
      }
    }
    markersRef.current.clear();
    mapRef.current = null;
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      setMapCenter(center);
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Create markers for events once map is ready
  useEffect(() => {
    if (
      !isMounted ||
      !mapReady ||
      !mapRef.current ||
      !isLoaded ||
      !showEventMarkers ||
      !events.length ||
      typeof window === 'undefined' ||
      typeof google === 'undefined'
    ) {
      return;
    }

    // Clear existing markers
    for (const [, marker] of markersRef.current.entries()) {
      if ('map' in marker) {
        marker.map = null;
      } else if ('setMap' in marker) {
        marker.setMap(null);
      }
    }
    markersRef.current.clear();

    events.forEach((event) => {
      if (!event.location) return;

      let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

      if (google.maps.marker && mapId) {
        const markerDiv = document.createElement('div');
        markerDiv.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="${getCategoryMarkerColor(event.category || '')}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.8"/>
          </svg>
        `;

        marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: event.location.lat, lng: event.location.lng },
          content: markerDiv,
          title: event.title,
          map: mapRef.current,
        });
      } else {
        marker = new google.maps.Marker({
          position: { lat: event.location.lat, lng: event.location.lng },
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="${getCategoryMarkerColor(event.category || '')}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.8"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
          title: event.title,
          map: mapRef.current,
        });
      }

      marker.addListener('click', () => {
        if (showInfoWindows) setSelectedEvent(event);
        if (onEventClick) onEventClick(event);
      });

      markersRef.current.set(event.id, marker);
    });
  }, [
    events,
    isLoaded,
    isMounted,
    mapReady,
    showEventMarkers,
    showInfoWindows,
    onEventClick,
    mapId,
  ]);

  // Fit map to show all events (if no custom center provided)
  useEffect(() => {
    if (!isMounted || !mapRef.current || typeof window === 'undefined' || center) return;

    // If user location is available, prioritize it
    if (userLocation && !center) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(events.length === 0 ? zoom : Math.max(zoom - 1, minZoom));
      return;
    }

    // If no user location and no events, don't do anything
    if (events.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    // Add user location to bounds if available
    if (userLocation) {
      bounds.extend(userLocation);
    }

    // Add all event locations to bounds
    events.forEach((event) => {
      if (event.location) {
        bounds.extend({
          lat: event.location.lat,
          lng: event.location.lng,
        });
      }
    });

    // Only fit bounds if we have multiple points
    if (events.length > 2 || (events.length > 0 && !userLocation)) {
      mapRef.current.fitBounds(bounds, {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      });
    }

    // Ensure reasonable zoom level
    if (events.length === 1 && userLocation) {
      setTimeout(() => {
        if (mapRef.current && mapRef.current.getZoom() && mapRef.current.getZoom()! > maxZoom - 2) {
          mapRef.current.setZoom(zoom);
        }
      }, 100);
    }
  }, [events, userLocation, isMounted, center, zoom, minZoom, maxZoom]);

  if (!isMounted || !isLoaded) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        {loadingComponent || (
          <div className="text-center text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        )}
      </div>
    );
  }

  // User Location Marker Component
  function UserLocationMarker({
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

      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

      if (google.maps.marker && mapId) {
        const markerDiv = document.createElement('div');
        markerDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
          <circle cx="10" cy="10" r="3" fill="#ffffff"/>
        </svg>
      `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position,
          content: markerDiv,
          title: 'Your Location',
          map,
        });

        markerRef.current = marker;
      } else {
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

  return (
    <div className={`relative h-full overflow-hidden rounded-lg ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* User location marker */}
        {showUserLocation && userLocation && (
          <UserLocationMarker position={userLocation} map={mapRef.current} />
        )}

        {/* Info window for selected event */}
        {showInfoWindows && selectedEvent && selectedEvent.location && (
          <InfoWindow
            position={{
              lat: selectedEvent.location.lat,
              lng: selectedEvent.location.lng,
            }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div className="p-2 max-w-xs">
              <h4 className="font-semibold text-sm mb-1">{selectedEvent.title}</h4>
              {selectedEvent.category && (
                <div className="flex items-center gap-1 mb-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                  />
                  <span className="text-xs text-muted-foreground">{selectedEvent.category}</span>
                </div>
              )}
              {selectedEvent.location?.address && (
                <p className="text-xs text-muted-foreground">{selectedEvent.location.address}</p>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <span>{selectedEvent.attendees?.length || 0} attending</span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Click overlay for non-interactive maps */}
      {showClickOverlay && overlayClickAction && (
        <div
          className="absolute inset-0 bg-transparent cursor-pointer"
          onClick={overlayClickAction}
          title={overlayTitle}
        />
      )}

      {/* Empty state overlay */}
      {showEventMarkers && events.length === 0 && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          {emptyStateComponent || (
            <div className="text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events in this area</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
