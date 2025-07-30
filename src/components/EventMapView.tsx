'use client';

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useState, useMemo } from 'react';
import { Event } from '@/types/event';
import { Button } from '@/components/ui/button';
import { ExternalLink, Navigation } from 'lucide-react';

interface EventMapViewProps {
  event: Event;
  className?: string;
  height?: string;
  showInfoWindow?: boolean;
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapLibraries: ('places' | 'geometry')[] = ['places', 'geometry'];

export function EventMapView({
  event,
  className = '',
  height = '300px',
  showInfoWindow = true,
  zoom = 15,
}: EventMapViewProps) {
  const [showInfo, setShowInfo] = useState(showInfoWindow);

  const { isLoaded } = useJsApiLoader({
    id: 'event-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: mapLibraries,
  });

  const mapCenter = useMemo(() => {
    if (!event.location) {
      return { lat: 26.7145, lng: -80.0549 }; // Default to West Palm Beach
    }
    return {
      lat: event.location.lat,
      lng: event.location.lng,
    };
  }, [event.location]);

  const mapOptions = useMemo((): google.maps.MapOptions => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    clickableIcons: false,
    minZoom: 3,
    maxZoom: 20,
  }), []);

  const onLoad = useCallback(() => {
    // Optional: Fit bounds if you want to show surrounding area
  }, []);

  const onUnmount = useCallback(() => {
    // Cleanup if needed
  }, []);

  const handleDirections = () => {
    if (!event.location) return;
    
    const { lat, lng } = event.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenInMaps = () => {
    if (!event.location) return;
    
    const { lat, lng } = event.location;
    const query = event.location.address || `${lat},${lng}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isLoaded) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!event.location) {
    return (
      <div 
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <Marker
          position={mapCenter}
          title={event.title}
          onClick={() => setShowInfo(!showInfo)}
        />

        {showInfo && (
          <InfoWindow
            position={mapCenter}
            onCloseClick={() => setShowInfo(false)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold mb-1 text-sm">{event.title}</h3>
              {event.location.address && (
                <p className="text-xs text-gray-600 mb-2">{event.location.address}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDirections}
                  className="text-xs h-7"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Directions
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenInMaps}
                  className="text-xs h-7"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDirections}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <Navigation className="h-4 w-4 mr-1" />
          Directions
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleOpenInMaps}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Open in Maps
        </Button>
      </div>
    </div>
  );
}