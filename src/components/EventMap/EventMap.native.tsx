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
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pin } from './Pin';
import type { EventMapMarker, EventMapProps } from './EventMap.types';
import { tidepoolStyle } from './mapStyle.tidepool';
import { FONTS, useTheme } from '@/theme/ThemeProvider';
import { WEST_PALM_BEACH } from '@/lib/places';

const DEFAULT_CENTER = { lat: WEST_PALM_BEACH.lat, lng: WEST_PALM_BEACH.lng };
const DEFAULT_ZOOM = WEST_PALM_BEACH.zoom;

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
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    setMapFailed(false);
    if (accessToken) {
      void Mapbox.setAccessToken(accessToken);
    }
  }, [accessToken]);

  const styleJSON = useMemo(() => JSON.stringify(tidepoolStyle(palette)), [palette]);

  if (!accessToken || mapFailed) {
    return (
      <MapFallback
        markers={markers}
        selectedId={selectedId}
        onSelect={onSelect}
        reason={accessToken ? 'Map could not load.' : 'Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the live map.'}
      />
    );
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.mapBg }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        styleJSON={styleJSON}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onMapLoadingError={() => setMapFailed(true)}
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

function MapFallback({
  markers,
  selectedId,
  onSelect,
  reason,
}: {
  markers: EventMapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  reason: string;
}) {
  const { palette } = useTheme();
  const bounds = useMemo(() => {
    const lats = markers.map((marker) => marker.lat);
    const lngs = markers.map((marker) => marker.lng);
    return {
      minLat: Math.min(...lats, DEFAULT_CENTER.lat - 0.08),
      maxLat: Math.max(...lats, DEFAULT_CENTER.lat + 0.08),
      minLng: Math.min(...lngs, DEFAULT_CENTER.lng - 0.08),
      maxLng: Math.max(...lngs, DEFAULT_CENTER.lng + 0.08),
    };
  }, [markers]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: palette.mapBg }]}>
      <View style={[styles.fallbackWater, { backgroundColor: palette.mapWater }]} />
      <View style={[styles.fallbackPark, { backgroundColor: palette.mapPark }]} />
      <View style={[styles.fallbackRoad, { backgroundColor: palette.mapRoad }]} />
      <View style={[styles.fallbackRoadAlt, { backgroundColor: palette.mapRoadStroke }]} />

      {markers.map((marker) => {
        const left = project(marker.lng, bounds.minLng, bounds.maxLng);
        const top = 100 - project(marker.lat, bounds.minLat, bounds.maxLat);
        return (
          <Pressable
            key={marker.id}
            onPress={() => onSelect?.(marker.id)}
            style={[
              styles.fallbackPin,
              {
                left: `${left}%`,
                top: `${top}%`,
                transform: [{ scale: marker.id === selectedId ? 1.15 : 1 }],
              },
            ]}
          >
            <Pin catId={marker.category} selected={marker.id === selectedId} />
          </Pressable>
        );
      })}

      <View style={[styles.fallbackNotice, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={{ color: palette.ink2, fontFamily: FONTS.body, fontSize: 12, lineHeight: 17 }}>
          {reason}
        </Text>
      </View>
    </View>
  );
}

function project(value: number, min: number, max: number) {
  if (min === max) return 50;
  return Math.max(8, Math.min(92, ((value - min) / (max - min)) * 100));
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

const styles = StyleSheet.create({
  fallbackNotice: {
    borderRadius: 14,
    borderWidth: 1,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    right: 12,
    top: 120,
  },
  fallbackPark: {
    borderRadius: 999,
    height: '34%',
    left: '-8%',
    opacity: 0.8,
    position: 'absolute',
    top: '42%',
    transform: [{ rotate: '-12deg' }],
    width: '60%',
  },
  fallbackPin: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginLeft: -22,
    marginTop: -22,
    position: 'absolute',
    width: 44,
  },
  fallbackRoad: {
    height: 8,
    left: '-10%',
    opacity: 0.85,
    position: 'absolute',
    top: '52%',
    transform: [{ rotate: '-18deg' }],
    width: '130%',
  },
  fallbackRoadAlt: {
    height: 4,
    left: '12%',
    opacity: 0.7,
    position: 'absolute',
    top: '36%',
    transform: [{ rotate: '26deg' }],
    width: '92%',
  },
  fallbackWater: {
    borderRadius: 999,
    height: '38%',
    opacity: 0.9,
    position: 'absolute',
    right: '-20%',
    top: '4%',
    transform: [{ rotate: '-22deg' }],
    width: '70%',
  },
});
