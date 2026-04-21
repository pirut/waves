// EventMap.native.tsx — @rnmapbox/maps wrapper for iOS + Android.
//
// Renders a MapView using the Tidepool-palette style JSON, drops a PointAnnotation
// per marker, and bubbles taps through `onSelect`.

import Mapbox, {
  Camera,
  MapView,
  PointAnnotation,
  StyleImport,
} from '@rnmapbox/maps';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pin } from './Pin';
import type { EventMapMarker, EventMapProps } from './EventMap.types';
import { tidepoolStyle } from './mapStyle.tidepool';
import { useTheme } from '@/theme/ThemeProvider';

const DEFAULT_CENTER = { lat: 37.76, lng: -122.43 };
const DEFAULT_ZOOM = 11.5;

// Suppress a log warning about native modules running on release builds.
void StyleImport;

export function EventMap({
  markers,
  selectedId,
  onSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}: EventMapProps) {
  const { palette } = useTheme();
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (accessToken) {
      void Mapbox.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const styleJSON = useMemo(() => JSON.stringify(tidepoolStyle(palette)), [palette]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.mapBg }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        styleJSON={styleJSON}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          defaultSettings={{
            centerCoordinate: [initialCenter.lng, initialCenter.lat],
            zoomLevel: initialZoom,
          }}
        />
        {markers.map((m) => (
          <MarkerPin key={m.id} marker={m} selected={m.id === selectedId} onSelect={onSelect} />
        ))}
      </MapView>
    </View>
  );
}

function MarkerPin({
  marker,
  selected,
  onSelect,
}: {
  marker: EventMapMarker;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <PointAnnotation
      id={marker.id}
      coordinate={[marker.lng, marker.lat]}
      onSelected={() => onSelect?.(marker.id)}
    >
      <Pin catId={marker.category} selected={selected} />
    </PointAnnotation>
  );
}
