import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Region, type LatLng } from "react-native-maps";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import type { EventMapProps } from "@/src/modules/events/components/EventMap.types";

const defaultRegion: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.25,
  longitudeDelta: 0.2,
};

function getTargetRegion({
  events,
  selectedEventId,
  focusLocation,
}: Pick<EventMapProps, "events" | "selectedEventId" | "focusLocation">): Region {
  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);
  if (selectedEvent) {
    return {
      latitude: selectedEvent.latitude,
      longitude: selectedEvent.longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }

  if (focusLocation) {
    return {
      latitude: focusLocation.latitude,
      longitude: focusLocation.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  if (events.length > 0) {
    const first = events[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: defaultRegion.latitudeDelta,
      longitudeDelta: defaultRegion.longitudeDelta,
    };
  }

  return defaultRegion;
}

export function EventMap({ events, onSelectEvent, selectedEventId, focusLocation }: EventMapProps) {
  const targetRegion = useMemo(
    () => getTargetRegion({ events, selectedEventId, focusLocation }),
    [events, focusLocation, selectedEventId],
  );
  const [region, setRegion] = useState<Region>(targetRegion);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    setRegion(targetRegion);
  }, [targetRegion]);

  useEffect(() => {
    if (!mapRef.current || selectedEventId || focusLocation || events.length < 2) {
      return;
    }

    const coordinates: LatLng[] = events.map((eventItem) => ({
      latitude: eventItem.latitude,
      longitude: eventItem.longitude,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 34, right: 34, bottom: 34, left: 34 },
      animated: true,
    });
  }, [events, focusLocation, selectedEventId]);

  const isGlobeMode = region.latitudeDelta >= 90;
  const mapRegion = isGlobeMode
    ? {
        ...region,
        latitudeDelta: Math.min(180, region.latitudeDelta),
        longitudeDelta: Math.min(180, region.longitudeDelta),
      }
    : region;

  if (events.length === 0 && !focusLocation) {
    return (
      <View style={styles.emptyState}>
        <AppText variant="h3" color={theme.colors.heading}>
          No map points yet
        </AppText>
        <AppText>Try changing your filters or create a new event.</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.mapShell, isGlobeMode ? styles.mapShellGlobe : undefined]}>
      <View style={[styles.mapViewport, isGlobeMode ? styles.mapViewportGlobe : undefined]}>
        <MapView
          initialRegion={targetRegion}
          mapType={isGlobeMode ? "satellite" : "standard"}
          onRegionChangeComplete={setRegion}
          ref={mapRef}
          region={mapRegion}
          rotateEnabled
          style={StyleSheet.absoluteFillObject}>
          {events.map((eventItem) => (
            <Marker
              coordinate={{
                latitude: eventItem.latitude,
                longitude: eventItem.longitude,
              }}
              key={eventItem.id}
              pinColor={selectedEventId === eventItem.id ? theme.colors.danger : theme.colors.primary}
              title={eventItem.title}
              onPress={() => onSelectEvent(eventItem.id)}
            />
          ))}
          {focusLocation ? (
            <Marker
              coordinate={{
                latitude: focusLocation.latitude,
                longitude: focusLocation.longitude,
              }}
              pinColor={theme.colors.accent}
              title={focusLocation.label ?? "Searched location"}
            />
          ) : null}
        </MapView>
      </View>

      <View style={styles.legend}>
        <AppText variant="caption" color={theme.colors.primary} style={styles.legendTitle}>
          {isGlobeMode ? "Globe view" : "Map view"}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    height: 300,
    overflow: "hidden",
    padding: 2,
    position: "relative",
    ...theme.elevation.soft,
  },
  mapShellGlobe: {
    alignItems: "center",
    height: 340,
    paddingTop: theme.spacing.sm,
  },
  mapViewport: {
    flex: 1,
    overflow: "hidden",
  },
  mapViewportGlobe: {
    borderColor: theme.colors.borderStrong,
    borderRadius: 146,
    borderWidth: 2,
    height: 292,
    overflow: "hidden",
    width: 292,
  },
  legend: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    bottom: 10,
    left: 10,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    position: "absolute",
  },
  legendTitle: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.64)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
});
