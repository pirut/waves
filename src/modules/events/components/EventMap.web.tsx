import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Map, Marker, ZoomControl } from "pigeon-maps";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import type { EventMapProps } from "@/src/modules/events/components/EventMap.types";

function toWebZoom(span: number) {
  if (span > 90) {
    return 2;
  }
  if (span > 45) {
    return 3;
  }
  if (span > 20) {
    return 4;
  }
  if (span > 10) {
    return 5;
  }
  if (span > 5) {
    return 6;
  }
  if (span > 2) {
    return 8;
  }
  if (span > 1) {
    return 9;
  }
  if (span > 0.5) {
    return 10;
  }
  if (span > 0.2) {
    return 11;
  }
  return 12;
}

type MapViewState = {
  center: [number, number];
  zoom: number;
};

function getTargetView({
  events,
  selectedEventId,
  focusLocation,
}: Pick<EventMapProps, "events" | "selectedEventId" | "focusLocation">): MapViewState {
  if (events.length === 0 && !focusLocation) {
    return {
      center: [20, 0],
      zoom: 2,
    };
  }

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);
  if (selectedEvent) {
    return {
      center: [selectedEvent.latitude, selectedEvent.longitude],
      zoom: 12,
    };
  }

  if (focusLocation) {
    return {
      center: [focusLocation.latitude, focusLocation.longitude],
      zoom: 12,
    };
  }

  const lats = events.map((eventItem) => eventItem.latitude);
  const lngs = events.map((eventItem) => eventItem.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const span = Math.max(latSpan, lngSpan);
  const centerLat = latSpan === 0 ? minLat : minLat + latSpan / 2;
  const centerLng = lngSpan === 0 ? minLng : minLng + lngSpan / 2;

  return {
    center: [centerLat, centerLng],
    zoom: toWebZoom(span || 0.2),
  };
}

export function EventMap({ events, onSelectEvent, selectedEventId, focusLocation }: EventMapProps) {
  const targetView = useMemo(
    () => getTargetView({ events, selectedEventId, focusLocation }),
    [events, focusLocation, selectedEventId],
  );

  const [viewState, setViewState] = useState<MapViewState>(targetView);

  useEffect(() => {
    setViewState(targetView);
  }, [targetView]);

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

  const isGlobeMode = viewState.zoom <= 2.5;
  const mapHeight = isGlobeMode ? 292 : 300;

  return (
    <View style={[styles.mapShell, isGlobeMode ? styles.mapShellGlobe : undefined]}>
      <View style={[styles.mapViewport, isGlobeMode ? styles.mapViewportGlobe : undefined]}>
        <Map
          center={viewState.center}
          height={mapHeight}
          onBoundsChanged={({ center, zoom }) => {
            setViewState({
              center,
              zoom,
            });
          }}
          zoom={viewState.zoom}>
          {events.map((eventItem) => (
            <Marker
              anchor={[eventItem.latitude, eventItem.longitude]}
              color={selectedEventId === eventItem.id ? theme.colors.danger : theme.colors.primaryDeep}
              key={eventItem.id}
              onClick={() => onSelectEvent(eventItem.id)}
              width={48}
            />
          ))}
          {focusLocation ? (
            <Marker
              anchor={[focusLocation.latitude, focusLocation.longitude]}
              color={theme.colors.accent}
              width={42}
            />
          ) : null}
          <ZoomControl />
        </Map>
      </View>

      <View style={styles.legend}>
        <AppText variant="caption" color={theme.colors.primary} style={styles.legendTitle}>
          {isGlobeMode ? "Globe view" : "Interactive map"}
        </AppText>
        <AppText variant="caption" color={theme.colors.body}>
          {isGlobeMode ? "Zoom in to switch from globe to street-level map." : "Click any pin to focus an event."}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.66)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    minHeight: 304,
    overflow: "hidden",
    paddingVertical: 2,
    position: "relative",
    ...theme.elevation.soft,
  },
  mapShellGlobe: {
    alignItems: "center",
    minHeight: 340,
    paddingTop: theme.spacing.sm,
  },
  mapViewport: {
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
    gap: 2,
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
    ...theme.elevation.soft,
  },
});
