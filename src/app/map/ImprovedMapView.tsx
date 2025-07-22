'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

// Import our new components
import MobileMapHeader from '@/components/MobileMapHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import DesktopMapSidebar from '@/components/DesktopMapSidebar';
import MapControls from '@/components/MapControls';
import MobileMapControls from '@/components/MobileMapControls';
import EventList from '@/components/EventList';
import MapFilterBadge from '@/components/MapFilterBadge';
import MapStatusBadge from '@/components/MapStatusBadge';
import MapLoadingStates from '@/components/MapLoadingStates';

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
  createdAt?: string;
}

// Google Maps configuration - Better mobile support
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (Miami) - will be updated with user location
const defaultCenter = {
  lat: 25.79,
  lng: -80.13,
};

// Improved map options for better UX - mobile-aware
const getMapOptions = (isMobile: boolean = false): google.maps.MapOptions => {
  return {
    disableDefaultUI: false,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: !isMobile,
    gestureHandling: 'greedy',
    isFractionalZoomEnabled: isMobile,
    clickableIcons: false,
    keyboardShortcuts: !isMobile,
    minZoom: 3,
    maxZoom: 18,
    scrollwheel: !isMobile,
    tilt: 0,
    rotateControl: false,
    disableDoubleClickZoom: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };
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

const getCategoryMarkerColor = (category: string) => {
  return categoryColorMap[category] || '#FFE5D4';
};

export default function ImprovedMapViewRefactored() {
  // Use ref for map instance for better performance
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Object.keys(categoryColorMap)
  );
  const [mobileView, setMobileView] = useState<'map' | 'events'>('map');
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // Handle hydration by only running client-side code after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use tRPC to fetch events
  const {
    data: allEvents = [],
    isLoading: loading,
    refetch: loadEvents,
  } = trpc.events.getAll.useQuery();

  // Filter events based on viewport bounds for performance
  const eventsInViewport = useMemo(() => {
    if (!mapBounds || !allEvents?.length) return allEvents || [];

    return allEvents.filter((event: Event) => {
      if (!event.location) return false;

      if (typeof google !== 'undefined') {
        const eventLatLng = new google.maps.LatLng(event.location.lat, event.location.lng);
        return mapBounds.contains(eventLatLng);
      }
      return true;
    });
  }, [allEvents, mapBounds]);

  // Load Google Maps API with clustering
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  // Get user location on mount (only after hydration)
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
        },
        {
          timeout: 5000,
          maximumAge: 300000,
        }
      );
    }
  }, [isMounted, center.lat, center.lng]);

  // Memoize filtered events from viewport with search and category filtering
  const filteredEvents = useMemo(() => {
    return eventsInViewport.filter((e: Event) => {
      if (!e.location || typeof e.location.lat !== 'number' || typeof e.location.lng !== 'number') {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          e.title?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.location?.address?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (e.category && !selectedCategories.includes(e.category)) {
        return false;
      }

      return true;
    });
  }, [eventsInViewport, searchQuery, selectedCategories]);

  // Detect mobile for map options
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!isMounted) return;

    const detectMobile = () => {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ) {
        return true;
      }
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        return true;
      }
      if (window.innerWidth <= 768) {
        return true;
      }
      return false;
    };

    setIsMobile(detectMobile());
  }, [isMounted]);

  // Memoize map options for better performance
  const mapOptions = useMemo(() => getMapOptions(isMobile), [isMobile]);

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
    const initialZoom = map.getZoom() || 10;
    setZoom(initialZoom);

    const bounds = map.getBounds();
    if (bounds) {
      setMapBounds(bounds);
    }

    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 100);
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      setZoom(currentZoom);
    }
  }, []);

  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        setMapBounds(bounds);
      }
    }
  }, []);

  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      const newZoom = Math.min(18, currentZoom + 2);
      mapRef.current.setZoom(newZoom);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 10;
      const newZoom = Math.max(3, currentZoom - 2);
      mapRef.current.setZoom(newZoom);
    }
  }, []);

  // Initialize marker clustering
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !filteredEvents.length || typeof google === 'undefined')
      return;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const markers = filteredEvents
      .map((event: Event) => {
        if (!event.location) return null;

        const marker = new google.maps.Marker({
          position: {
            lat: event.location.lat,
            lng: event.location.lng,
          },
          icon: createMarkerIcon(getCategoryMarkerColor(event.category || '')),
          title: event.title,
        });

        marker.addListener('click', () => {
          setSelectedEvent(event);
        });

        return marker;
      })
      .filter(Boolean) as google.maps.Marker[];

    if (markers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers,
      });
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [isLoaded, filteredEvents]);

  const onMapClick = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Event handlers for components
  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event);
    if (mapRef.current && event.location) {
      mapRef.current.panTo({ lat: event.location.lat, lng: event.location.lng });
      mapRef.current.setZoom(15);
    }
  }, []);

  // Show error if API key is missing
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <MapLoadingStates type="api-key-missing" />;
  }

  // Show loading state only while Google Maps API is loading
  if (!isLoaded) {
    return <MapLoadingStates type="loading" />;
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full">
        <MobileMapHeader
          mobileView={mobileView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          categoryColorMap={categoryColorMap}
        />

        {mobileView === 'map' ? (
          <div className="flex-1 relative bg-gray-200">
            <MobileMapControls
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              className="absolute top-4 right-4 z-10"
            />

            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={zoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onBoundsChanged={onBoundsChanged}
              onClick={onMapClick}
              options={mapOptions}
            >
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

              {selectedEvent && selectedEvent.location && (
                <InfoWindow
                  position={{
                    lat: selectedEvent.location.lat,
                    lng: selectedEvent.location.lng,
                  }}
                  onCloseClick={() => setSelectedEvent(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-sm mb-1">{selectedEvent.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{selectedEvent.location?.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {selectedEvent.date}</span>
                      <span>👥 {selectedEvent.attendees?.length || 0} attendees</span>
                    </div>
                    <button className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg text-sm">
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        ) : (
          <EventList
            events={filteredEvents}
            loading={loading}
            onEventSelect={handleEventSelect}
            className="flex-1"
          />
        )}

        <MobileBottomNav activeView={mobileView} onViewChange={setMobileView} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full bg-[#F6E8D6]">
        <DesktopMapSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          categoryColorMap={categoryColorMap}
          filteredEvents={filteredEvents}
          allEvents={allEvents || []}
          loading={loading}
          onEventSelect={handleEventSelect}
          onEventCreated={loadEvents}
        />

        <div className="flex-1 relative overflow-hidden">
          <MapFilterBadge
            selectedCategoriesCount={selectedCategories.length}
            totalCategoriesCount={Object.keys(categoryColorMap).length}
            className="absolute top-4 left-4 z-10"
          />

          <MapControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onGoToUserLocation={goToUserLocation}
            showUserLocationButton={!!userLocation}
            className="absolute top-4 right-4 z-10"
          />

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={isMobile ? 12 : zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            {...(!isMobile && { onZoomChanged })}
            onBoundsChanged={onBoundsChanged}
            onClick={onMapClick}
            options={mapOptions}
          >
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

            {selectedEvent && selectedEvent.location && (
              <InfoWindow
                position={{
                  lat: selectedEvent.location.lat,
                  lng: selectedEvent.location.lng,
                }}
                onCloseClick={() => setSelectedEvent(null)}
              >
                <div className="p-2 sm:p-3 max-w-xs sm:max-w-sm">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">
                    {selectedEvent.title}
                  </h3>
                  {selectedEvent.category && (
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span
                        className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                        style={{ backgroundColor: getCategoryMarkerColor(selectedEvent.category) }}
                      />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {selectedEvent.category}
                      </span>
                    </div>
                  )}
                  {selectedEvent.description && (
                    <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 overflow-hidden">
                      {selectedEvent.description}
                    </p>
                  )}
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      size="sm"
                      onClick={() => (window.location.href = `/events/${selectedEvent.id}`)}
                      className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvent(null)}
                      className="text-xs sm:text-sm h-8 sm:h-9"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {loading && <MapLoadingStates type="events-loading" />}

          <MapStatusBadge
            eventCount={filteredEvents.length}
            className="absolute bottom-4 left-4 z-10"
          />
        </div>
      </div>
    </>
  );
}
