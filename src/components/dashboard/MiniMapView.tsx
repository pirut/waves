'use client';

import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Event } from '@/types/event';

// Mini map configuration
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

// Simplified map options for mini map
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: 'cooperative', // Less aggressive for mini map
  clickableIcons: false,
  keyboardShortcuts: false,
  minZoom: 10,
  maxZoom: 16,
  scrollwheel: false, // Disable scroll wheel for mini map
  draggable: true,
  disableDoubleClickZoom: true, // Prevent accidental zooming
};

interface MiniMapViewProps {
  events: Event[];
  className?: string;
}

export function MiniMapView({ events, className = '' }: MiniMapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: mapLibraries,
  });

  // Get user location on mount
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('User location detected:', userPos);
        setUserLocation(userPos);
        setCenter(userPos);

        // If map is already loaded, center it immediately and force it
        if (mapRef.current) {
          console.log('Centering map on user location:', userPos);
          mapRef.current.setCenter(userPos);
          mapRef.current.setZoom(13);

          // Force a slight delay to ensure it sticks
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.setCenter(userPos);
            }
          }, 100);
        }
      },
      (error) => {
        console.log('Geolocation error:', error);
        // Keep default center if geolocation fails
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // 1 minute for better accuracy
      }
    );
  }, [isMounted]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      console.log('Map loaded, user location:', userLocation);

      // If we already have user location, center on it immediately
      if (userLocation) {
        console.log('Centering map on load with user location:', userLocation);
        map.setCenter(userLocation);
        map.setZoom(13);
      }
    },
    [userLocation]
  );

  const onUnmount = useCallback(() => {
    // Clean up markers
    for (const [, marker] of markersRef.current.entries()) {
      marker.setMap(null);
    }
    markersRef.current.clear();
    mapRef.current = null;
  }, []);

  // Ensure map centers on user location when both map and location are available
  useEffect(() => {
    if (mapRef.current && userLocation && isLoaded) {
      console.log('Force centering map on user location:', userLocation);
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(13);
    }
  }, [userLocation, isLoaded]);

  // Create markers for events
  useMemo(() => {
    if (
      !isMounted ||
      !mapRef.current ||
      !isLoaded ||
      !events.length ||
      typeof window === 'undefined' ||
      typeof google === 'undefined'
    ) {
      return;
    }

    // Clear existing markers
    for (const [, marker] of markersRef.current.entries()) {
      marker.setMap(null);
    }
    markersRef.current.clear();

    const newMarkers: google.maps.Marker[] = [];

    events.forEach((event) => {
      if (!event.location) return;

      const marker = new google.maps.Marker({
        position: {
          lat: event.location.lat,
          lng: event.location.lng,
        },
        map: mapRef.current,
        title: event.title,
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
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedEvent(event);
      });

      markersRef.current.set(event.id, marker);
      newMarkers.push(marker);
    });

    // Return is not needed since we're just creating markers
    return;
  }, [events, isLoaded, isMounted]);

  // Fit map to show all events (but prioritize user location)
  useEffect(() => {
    if (!isMounted || !mapRef.current || typeof window === 'undefined') return;

    // Always prioritize user location if available
    if (userLocation) {
      console.log('Prioritizing user location in bounds fitting:', userLocation);
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(events.length === 0 ? 13 : 12);
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

    // If only one event and user location, ensure reasonable zoom level
    if (events.length === 1 && userLocation) {
      setTimeout(() => {
        if (mapRef.current && mapRef.current.getZoom() && mapRef.current.getZoom()! > 15) {
          mapRef.current.setZoom(14);
        }
      }, 100);
    }
  }, [events, userLocation, isMounted]);

  if (!isMounted || !isLoaded) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* User location marker */}
        {userLocation && <div>{/* This would be rendered as a custom marker */}</div>}

        {/* Info window for selected event */}
        {selectedEvent && selectedEvent.location && (
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

      {/* Overlay for click-through prevention in dashboard */}
      <div
        className="absolute inset-0 bg-transparent cursor-pointer"
        onClick={() => {
          // Navigate to full map view
          window.location.href = '/map';
        }}
        title="Click to open full map"
      />

      {/* No events overlay */}
      {events.length === 0 && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events in this area</p>
          </div>
        </div>
      )}
    </div>
  );
}
