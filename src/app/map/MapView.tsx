'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Calendar, MapPin, Users, Plus, Minus, Maximize, Crosshair } from 'lucide-react';
import Link from 'next/link';
import CreateEventModal from '@/components/CreateEventModal';

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
  width: '100%',
  height: '100%',
};

const center = {
  lat: 25.79,
  lng: -80.13, // Miami
};

const getMapOptions = (): google.maps.MapOptions => {
  return {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    clickableIcons: true,
    keyboardShortcuts: true,
    minZoom: 2,
    maxZoom: 20,
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry.fill',
        stylers: [{ color: '#F6E8D6' }], // Sand color
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#B3DFF2' }], // Baby blue
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#FFFFFF' }],
      },
    ],
  };
};

// Category filters using your color scheme
const categories = [
  { name: 'Music', color: '#FFE5D4', active: true },
  { name: 'Tech', color: '#B3DFF2', active: true },
  { name: 'Art', color: '#F6E8D6', active: true },
  { name: 'Food', color: '#FFE5D4', active: true },
];

// Helper function to create marker icon
const createMarkerIcon = (color: string) => {
  if (typeof google === 'undefined') {
    return undefined;
  }
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="10" fill="${color}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="#ffffff" fill-opacity="0.6"/>
            </svg>
        `)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
  };
};

export default function MapView() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'Music',
    'Tech',
    'Art',
    'Food',
  ]);

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

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    version: 'weekly',
    libraries: ['places'],
  });

  // Filter events based on search and categories
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !event.category || activeCategories.includes(event.category);

      return matchesSearch && matchesCategory && event.location?.lat && event.location?.lng;
    });
  }, [events, searchQuery, activeCategories]);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 10) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 10) - 1);
    }
  };

  const handleRecenter = () => {
    if (map) {
      map.setCenter(center);
      map.setZoom(10);
    }
  };

  const handleFullscreen = () => {
    if (map) {
      const mapDiv = map.getDiv();
      if (mapDiv.requestFullscreen) {
        mapDiv.requestFullscreen();
      }
    }
  };

  const toggleCategory = (categoryName: string) => {
    setActiveCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName]
    );
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-[#F6E8D6]">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-[#F6E8D6] flex flex-col">
        {/* Events Header */}
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

          {/* Search */}
          <div className="relative">
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
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {events.length === 0 ? 'No events found' : 'No events match your filters'}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border-b border-[#F6E8D6] hover:bg-[#FFE5D4]/20 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2"
                    style={{
                      backgroundColor:
                        categories.find((c) => c.name === event.category)?.color || '#FFE5D4',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.location?.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
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
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </CreateEventModal>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        {/* Category Filters */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={activeCategories.includes(category.name) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleCategory(category.name)}
              className="bg-white border border-[#F6E8D6] text-gray-700 hover:bg-[#FFE5D4]/50"
              style={{
                backgroundColor: activeCategories.includes(category.name)
                  ? category.color
                  : 'white',
              }}
            >
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="bg-white border-[#F6E8D6]"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="bg-white border-[#F6E8D6]"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecenter}
            className="bg-white border-[#F6E8D6]"
          >
            <Crosshair className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className="bg-white border-[#F6E8D6]"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Map */}
        <div className="w-full h-full bg-[#B3DFF2]">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={zoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onZoomChanged={onZoomChanged}
              options={getMapOptions()}
            >
              {!loading &&
                filteredEvents.map((event) => (
                  <Marker
                    key={event.id}
                    position={{
                      lat: event.location!.lat,
                      lng: event.location!.lng,
                    }}
                    onClick={() => setSelectedEvent(event)}
                    icon={createMarkerIcon(
                      categories.find((c) => c.name === event.category)?.color || '#FFE5D4'
                    )}
                  />
                ))}

              {selectedEvent && (
                <InfoWindow
                  position={{
                    lat: selectedEvent.location!.lat,
                    lng: selectedEvent.location!.lng,
                  }}
                  onCloseClick={() => setSelectedEvent(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-sm mb-1">{selectedEvent.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{selectedEvent.location?.address}</p>
                    <p className="text-xs text-gray-500 mb-2">{selectedEvent.date}</p>
                    <Link href={`/events/${selectedEvent.id}`}>
                      <Button
                        size="sm"
                        className="text-xs bg-[#FFE5D4] hover:bg-[#F6E8D6] text-gray-900"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#FFE5D4] rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map View</h3>
                <p className="text-sm text-gray-600">
                  Click and drag to pan • Scroll to zoom • Click markers for details
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status */}
        <div className="absolute bottom-4 left-4 z-10 bg-white px-3 py-2 rounded-md shadow-sm border border-[#F6E8D6]">
          <p className="text-xs text-gray-600">
            Showing {filteredEvents.length} events in current view
          </p>
        </div>
      </div>
    </div>
  );
}
