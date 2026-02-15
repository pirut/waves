import { StyleSheet, View } from "react-native";
import { Map, Marker, ZoomControl } from "pigeon-maps";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import type { EventMapProps } from "@/src/modules/events/components/EventMap.types";

function toWebZoom(span: number) {
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

export function EventMap({ events, onSelectEvent, selectedEventId }: EventMapProps) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <AppText variant="h3" color={theme.colors.heading}>
          No map points yet
        </AppText>
        <AppText>Try changing your filters or create a new event.</AppText>
      </View>
    );
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

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);
  const centerLat = latSpan === 0 ? minLat : minLat + latSpan / 2;
  const centerLng = lngSpan === 0 ? minLng : minLng + lngSpan / 2;
  const center: [number, number] = selectedEvent
    ? [selectedEvent.latitude, selectedEvent.longitude]
    : [centerLat, centerLng];
  const zoom = toWebZoom(span || 0.2);
  const mapKey = `${selectedEventId ?? "all"}-${events.length}`;

  return (
    <View style={styles.mapShell}>
      <Map defaultCenter={center} defaultZoom={zoom} height={300} key={mapKey}>
        {events.map((eventItem) => (
          <Marker
            anchor={[eventItem.latitude, eventItem.longitude]}
            color={selectedEventId === eventItem.id ? theme.colors.danger : theme.colors.primaryDeep}
            key={eventItem.id}
            onClick={() => onSelectEvent(eventItem.id)}
            width={48}
          />
        ))}
        <ZoomControl />
      </Map>

      <View style={styles.legend}>
        <AppText variant="caption" color={theme.colors.primary} style={styles.legendTitle}>
          Interactive map
        </AppText>
        <AppText variant="caption" color={theme.colors.body}>Click any pin to focus an event.</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    backgroundColor: "rgba(255,255,255,0.66)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    height: 304,
    overflow: "hidden",
    position: "relative",
    ...theme.elevation.soft,
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
