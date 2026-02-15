import { StyleSheet, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import type { EventMapProps } from "@/src/modules/events/components/EventMap.types";

const defaultRegion: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.25,
  longitudeDelta: 0.2,
};

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

  const first = events[0];

  const region: Region = {
    latitude: first?.latitude ?? defaultRegion.latitude,
    longitude: first?.longitude ?? defaultRegion.longitude,
    latitudeDelta: defaultRegion.latitudeDelta,
    longitudeDelta: defaultRegion.longitudeDelta,
  };

  return (
    <View style={styles.mapShell}>
      <MapView initialRegion={region} style={StyleSheet.absoluteFillObject}>
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
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    height: 270,
    overflow: "hidden",
    ...theme.elevation.soft,
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
