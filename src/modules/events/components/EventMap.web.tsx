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

  return (
    <View style={styles.mapShell}>
      <Map
        center={viewState.center}
        height={264}
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
            width={44}
          />
        ))}
        {focusLocation ? (
          <Marker
            anchor={[focusLocation.latitude, focusLocation.longitude]}
            color={theme.colors.accent}
            width={40}
          />
        ) : null}
        <ZoomControl />
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    alignItems: "stretch",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    height: 264,
    overflow: "hidden",
    position: "relative",
    ...theme.elevation.soft,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
    ...theme.elevation.soft,
  },
});
