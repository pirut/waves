'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import CreateEventModal from '@/components/CreateEventModal';
import { Search, Locate, X, Filter } from 'lucide-react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

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

export default function ImprovedMapView() {
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

  // Show error if API key is missing
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Google Maps API key is not configured</p>
          <p className="text-sm text-gray-500 mt-2">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
          </p>
        </div>
      </div>
    );
  }

  // Show loading state only while Google Maps API is loading
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Mobile layout components
  const MobileHeader = () => (
    <div className="bg-white border-b border-[#F6E8D6] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className="p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-xs font-bold">W</span>
            </div>
            <h1 className="text-lg font-semibold">
              {mobileView === 'map' ? 'Map View' : 'Events'}
            </h1>
          </div>
        </div>
        <button className="p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      <div className="relative mb-4">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-gray-200 rounded-full"
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm whitespace-nowrap"
          onClick={() => setSelectedCategories(Object.keys(categoryColorMap))}
        >
          All Events
        </button>
        {Object.entries(categoryColorMap).map(([category]) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border ${
              selectedCategories.includes(category)
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200'
            }`}
            onClick={() => {
              setSelectedCategories((prev) =>
                prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
              );
            }}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );

  const MobileBottomNav = () => (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        <button
          className={`flex flex-col items-center py-2 px-4 ${
            mobileView === 'map' ? 'text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => setMobileView('map')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-xs">Map</span>
        </button>
        <button
          className={`flex flex-col items-center py-2 px-4 ${
            mobileView === 'events' ? 'text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => setMobileView('events')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="text-xs">Event</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <div className="w-6 h-6 mb-1 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">i</span>
          </div>
          <span className="text-xs">Info</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs">Profile</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full">
        <MobileHeader />

        {mobileView === 'map' ? (
          <div className="flex-1 relative bg-gray-200">
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={zoomIn}
                className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <span className="text-xl font-bold">+</span>
              </button>
              <button
                onClick={zoomOut}
                className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <span className="text-xl font-bold">−</span>
              </button>
            </div>

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
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No events found</div>
            ) : (
              filteredEvents.map((event: Event) => (
                <div
                  key={event.id}
                  className="bg-white mx-4 mb-4 rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-600 mb-2">{event.location?.address}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          📅 {event.date} • {event.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          👥 {event.attendees?.length || 0} attendees
                        </span>
                        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <MobileBottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full bg-[#F6E8D6]">
        <div className="w-80 bg-white border-r border-[#F6E8D6] flex flex-col">
          <div className="p-4 border-b border-[#F6E8D6]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Events</h2>
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
            </div>

            <div className="relative mb-3">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 border-[#F6E8D6] focus:border-[#FFE5D4]"
              />
              <svg
                className="w-4 h-4 absolute left-2.5 top-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="relative">
              <Select
                value={
                  selectedCategories.length === Object.keys(categoryColorMap).length
                    ? 'all'
                    : 'filtered'
                }
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedCategories(Object.keys(categoryColorMap));
                  } else if (value === 'none') {
                    setSelectedCategories([]);
                  }
                }}
              >
                <SelectTrigger className="border-[#F6E8D6] focus:border-[#FFE5D4]">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Filter by category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Categories ({Object.keys(categoryColorMap).length})
                  </SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <div className="border-t border-gray-200 my-1"></div>
                  {Object.entries(categoryColorMap).map(([category, color]) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span>{category}</span>
                        {selectedCategories.includes(category) && (
                          <svg
                            className="w-4 h-4 ml-auto text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCategories.length > 0 &&
                selectedCategories.length < Object.keys(categoryColorMap).length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedCategories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#FFE5D4] text-gray-700 rounded-full"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoryColorMap[category] }}
                        />
                        {category}
                        <button
                          onClick={() =>
                            setSelectedCategories((prev) => prev.filter((c) => c !== category))
                          }
                          className="ml-1 hover:text-gray-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {allEvents.length === 0
                  ? 'No events found'
                  : selectedCategories.length === 0
                    ? 'No categories selected. Choose categories to see events.'
                    : searchQuery.trim()
                      ? 'No events match your search and filters'
                      : 'No events match your selected categories'}
              </div>
            ) : (
              filteredEvents.map((event: Event) => (
                <div
                  key={event.id}
                  className="p-4 border-b border-[#F6E8D6] hover:bg-[#FFE5D4]/20 cursor-pointer"
                  onClick={() => {
                    setSelectedEvent(event);
                    if (mapRef.current && event.location) {
                      mapRef.current.panTo({ lat: event.location.lat, lng: event.location.lng });
                      mapRef.current.setZoom(15);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{ backgroundColor: getCategoryMarkerColor(event.category || '') }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.location?.address}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                          {event.attendees?.length || 0} attendees
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-[#F6E8D6]">
            <CreateEventModal onEventCreated={loadEvents}>
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Event
              </Button>
            </CreateEventModal>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {selectedCategories.length < Object.keys(categoryColorMap).length && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/95 backdrop-blur-sm border border-[#F6E8D6] rounded-md px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>
                    {selectedCategories.length === 0
                      ? 'No categories selected'
                      : `${selectedCategories.length} of ${Object.keys(categoryColorMap).length} categories`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
            >
              <span className="text-lg font-bold">+</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
            >
              <span className="text-lg font-bold">−</span>
            </Button>
            {userLocation && (
              <Button
                variant="outline"
                onClick={goToUserLocation}
                size="sm"
                className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
              >
                <Locate className="h-4 w-4" />
              </Button>
            )}
          </div>

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

          {loading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-40">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Loading events...</span>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-10 bg-white px-3 py-2 rounded-md shadow-sm border border-[#F6E8D6]">
            <p className="text-xs text-gray-600">
              Showing {filteredEvents.length} events in current view
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
