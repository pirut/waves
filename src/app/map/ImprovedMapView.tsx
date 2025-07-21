'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    zoomControl: false, // Disable default zoom controls - we'll use custom ones
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: !isMobile, // Disable fullscreen on mobile to avoid conflicts
    gestureHandling: 'greedy',
    isFractionalZoomEnabled: isMobile, // Enable fractional zoom on mobile for smoother pinch
    clickableIcons: false,
    keyboardShortcuts: !isMobile, // Disable keyboard shortcuts on mobile
    minZoom: 3,
    maxZoom: 18,
    scrollwheel: !isMobile, // Disable scroll wheel on mobile
    tilt: 0,
    rotateControl: false,
    disableDoubleClickZoom: false,
    // Better styling
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
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(Object.keys(categoryColorMap));
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // Handle hydration by only running client-side code after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use tRPC to fetch events - we'll implement viewport-based loading later
  const {
    data: allEvents = [],
    isLoading: loading,
    refetch: loadEvents,
  } = trpc.events.getAll.useQuery() as {
    data: Event[];
    isLoading: boolean;
    refetch: () => void;
  };

  // Filter events based on viewport bounds for performance
  const eventsInViewport = useMemo(() => {
    if (!mapBounds || !allEvents.length) return allEvents;

    return allEvents.filter((event) => {
      if (!event.location) return false;

      const eventLatLng = new google.maps.LatLng(event.location.lat, event.location.lng);
      return mapBounds.contains(eventLatLng);
    });
  }, [allEvents, mapBounds]);

  // Load Google Maps API with clustering
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    version: 'weekly',
    libraries: ['places', 'geometry'],
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

  // Memoize filtered events from viewport with search and category filtering
  const filteredEvents = useMemo(() => {
    return eventsInViewport.filter((e) => {
      // Check location validity
      if (!e.location || typeof e.location.lat !== 'number' || typeof e.location.lng !== 'number') {
        return false;
      }
      
      // Check search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          e.title?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.location?.address?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Check category filter
      if (e.category && !selectedCategories.includes(e.category)) {
        return false;
      }
      
      return true;
    });
  }, [eventsInViewport, searchQuery, selectedCategories]);

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

  // Memoize map options for better performance - mobile-aware
  const mapOptions = useMemo(() => getMapOptions(isMobile), [isMobile]);

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current || !isLoaded || typeof google === 'undefined')
      return;

    setIsSearching(true);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
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
        setSearchQuery(''); // Clear search after successful search
      }
    } catch (error) {
      console.error('Search failed:', error);
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

    // Set initial bounds for viewport-based loading
    const bounds = map.getBounds();
    if (bounds) {
      setMapBounds(bounds);
    }

    // Force a resize to ensure proper rendering
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
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

  // Handle bounds change for viewport-based loading
  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        setMapBounds(bounds);
      }
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

  // Initialize marker clustering
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !filteredEvents.length) return;

    // Clean up existing clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create markers for clustering
    const markers = filteredEvents.map((event) => {
      const marker = new google.maps.Marker({
        position: {
          lat: event.location!.lat,
          lng: event.location!.lng,
        },
        icon: createMarkerIcon(getCategoryMarkerColor(event.category || '')),
        title: event.title,
      });

      // Add click listener to marker
      marker.addListener('click', () => {
        setSelectedEvent(event);
      });

      return marker;
    });

    // Create or update clusterer with simplified configuration
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

  // Override scroll wheel behavior ONLY on desktop (not mobile)
  useEffect(() => {
    if (!mapRef.current || !isMounted || isMobile) return;

    console.log('Desktop detected - using custom scroll wheel handling');

    const handleWheel = (e: WheelEvent) => {
      // Only handle actual wheel events, not touch
      if (e.type !== 'wheel') return;

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
      // Only add wheel listener on desktop
      mapDiv.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        mapDiv.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isMounted, isMobile]);

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
    <div className="flex h-full bg-[#F6E8D6]">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-[#F6E8D6] flex flex-col">
        {/* Events Header */}
        <div className="p-4 border-b border-[#F6E8D6]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Events</h2>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 border-[#F6E8D6] focus:border-[#FFE5D4]"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Select
              value={selectedCategories.length === Object.keys(categoryColorMap).length ? "all" : "filtered"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedCategories(Object.keys(categoryColorMap));
                } else if (value === "none") {
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
                <SelectItem value="all">All Categories ({Object.keys(categoryColorMap).length})</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <div className="border-t border-gray-200 my-1"></div>
                {Object.entries(categoryColorMap).map(([category, color]) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategories(prev => 
                        prev.includes(category) 
                          ? prev.filter(c => c !== category)
                          : [...prev, category]
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      <span>{category}</span>
                      {selectedCategories.includes(category) && (
                        <svg className="w-4 h-4 ml-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Active filters indicator */}
            {selectedCategories.length > 0 && selectedCategories.length < Object.keys(categoryColorMap).length && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedCategories.map(category => (
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
                      onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
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

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {allEvents.length === 0 
                ? "No events found" 
                : selectedCategories.length === 0
                  ? "No categories selected. Choose categories to see events."
                  : searchQuery.trim()
                    ? "No events match your search and filters"
                    : "No events match your selected categories"
              }
            </div>
          ) : (
            filteredEvents.map((event) => (
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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

        {/* Add Event Button */}
        <div className="p-4 border-t border-[#F6E8D6]">
          <CreateEventModal onEventCreated={loadEvents}>
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </Button>
          </CreateEventModal>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Filter Status Indicator */}
        {selectedCategories.length < Object.keys(categoryColorMap).length && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/95 backdrop-blur-sm border border-[#F6E8D6] rounded-md px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>
                  {selectedCategories.length === 0 
                    ? "No categories selected" 
                    : `${selectedCategories.length} of ${Object.keys(categoryColorMap).length} categories`
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map Controls */}
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

        {/* Event markers are now handled by MarkerClusterer */}

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
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">
                {selectedEvent.title}
              </h3>
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
                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
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



        {/* Bottom Status */}
        <div className="absolute bottom-4 left-4 z-10 bg-white px-3 py-2 rounded-md shadow-sm border border-[#F6E8D6]">
          <p className="text-xs text-gray-600">Showing {filteredEvents.length} events in current view</p>
        </div>
      </div>
    </div>
  );
}
