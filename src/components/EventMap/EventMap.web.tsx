// EventMap.web.tsx — react-map-gl + mapbox-gl wrapper for the browser.

import 'mapbox-gl/dist/mapbox-gl.css';
import { useMemo } from 'react';
import Map, { Marker } from 'react-map-gl';
import { View } from 'react-native';
import { Pin } from './Pin';
import type { EventMapProps } from './EventMap.types';
import { tidepoolStyle } from './mapStyle.tidepool';
import { useTheme } from '@/theme/ThemeProvider';

const DEFAULT_CENTER = { lat: 37.76, lng: -122.43 };
const DEFAULT_ZOOM = 11.5;

export function EventMap({
  markers,
  selectedId,
  onSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}: EventMapProps) {
  const { palette } = useTheme();
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapStyle = useMemo(() => tidepoolStyle(palette), [palette]);

  if (!accessToken) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.mapBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.mapBg }}>
      <Map
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: initialCenter.lng,
          latitude: initialCenter.lat,
          zoom: initialZoom,
        }}
        style={{ width: '100%', height: '100%' }}
        // react-map-gl accepts GL JSON directly as mapStyle.
        mapStyle={mapStyle as unknown as string}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            longitude={m.lng}
            latitude={m.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect?.(m.id);
            }}
          >
            <Pin catId={m.category} selected={m.id === selectedId} />
          </Marker>
        ))}
      </Map>
    </View>
  );
}
