import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { EventMap } from "@/src/modules/events/components/EventMap";
import type { FocusLocation } from "@/src/modules/events/components/EventMap.types";
import {
  EVENT_CATEGORIES,
  type EventListItem,
} from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

type EventWithDistance = EventListItem & {
  distanceMiles?: number;
};

type DiscoverMapParams = {
  category?: string | string[];
  eventId?: string | string[];
  focusLatitude?: string | string[];
  focusLongitude?: string | string[];
  focusLabel?: string | string[];
  radiusMiles?: string | string[];
  source?: string | string[];
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(
  sourceLatitude: number,
  sourceLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(targetLatitude - sourceLatitude);
  const deltaLon = toRadians(targetLongitude - sourceLongitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(sourceLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function readParam(param: string | string[] | undefined) {
  if (Array.isArray(param)) {
    return param[0];
  }

  return param;
}

function readNumberParam(param: string | string[] | undefined) {
  const rawValue = readParam(param);
  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    return undefined;
  }

  return parsedValue;
}

function readCategoryParam(param: string | string[] | undefined) {
  const rawValue = readParam(param);
  if (!rawValue) {
    return undefined;
  }

  return EVENT_CATEGORIES.includes(rawValue as (typeof EVENT_CATEGORIES)[number])
    ? rawValue
    : undefined;
}

export function DiscoverMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<DiscoverMapParams>();
  const insets = useSafeAreaInsets();
  const { viewerProfileId, viewerLoading, viewerError } = useViewerProfile();

  const initialCategory = readCategoryParam(params.category);
  const initialSelectedEventId = readParam(params.eventId);
  const focusLatitude = readNumberParam(params.focusLatitude);
  const focusLongitude = readNumberParam(params.focusLongitude);
  const distanceRadiusMiles = readNumberParam(params.radiusMiles);
  const focusLabel = readParam(params.focusLabel);
  const source = readParam(params.source);

  const focusLocation: FocusLocation | undefined = useMemo(() => {
    if (focusLatitude === undefined || focusLongitude === undefined) {
      return undefined;
    }

    return {
      latitude: focusLatitude,
      longitude: focusLongitude,
      label: focusLabel,
    };
  }, [focusLabel, focusLatitude, focusLongitude]);

  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(initialSelectedEventId);

  useEffect(() => {
    if (initialSelectedEventId) {
      setSelectedEventId(initialSelectedEventId);
    }
  }, [initialSelectedEventId]);

  const eventsResult = useQuery(
    api.events.listPublished,
    viewerProfileId
      ? {
          category: initialCategory,
          limit: 80,
        }
      : "skip",
  );

  const events = useMemo(() => (eventsResult ?? []) as EventListItem[], [eventsResult]);

  const eventsWithDistance = useMemo(() => {
    if (!focusLocation) {
      return events as EventWithDistance[];
    }

    return events
      .map((eventItem) => ({
        ...eventItem,
        distanceMiles: haversineMiles(
          focusLocation.latitude,
          focusLocation.longitude,
          eventItem.latitude,
          eventItem.longitude,
        ),
      }))
      .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
  }, [events, focusLocation]);

  const visibleEvents = useMemo(() => {
    if (!focusLocation || distanceRadiusMiles === undefined) {
      return eventsWithDistance;
    }

    return eventsWithDistance.filter(
      (eventItem) =>
        eventItem.distanceMiles !== undefined && eventItem.distanceMiles <= distanceRadiusMiles,
    );
  }, [distanceRadiusMiles, eventsWithDistance, focusLocation]);

  useEffect(() => {
    setSelectedEventId((currentSelectedId) => {
      if (visibleEvents.length === 0) {
        return undefined;
      }

      if (currentSelectedId && visibleEvents.some((eventItem) => eventItem.id === currentSelectedId)) {
        return currentSelectedId;
      }

      if (
        initialSelectedEventId &&
        visibleEvents.some((eventItem) => eventItem.id === initialSelectedEventId)
      ) {
        return initialSelectedEventId;
      }

      return visibleEvents[0].id;
    });
  }, [initialSelectedEventId, visibleEvents]);

  const selectedEvent =
    visibleEvents.find((eventItem) => eventItem.id === selectedEventId) ?? visibleEvents[0];

  const onBack = () => {
    router.back();
  };

  const onOpenDiscoverList = () => {
    router.replace("/(tabs)");
  };

  const onOpenSelectedEvent = () => {
    if (!selectedEvent) {
      return;
    }

    router.push(`/events/${selectedEvent.id}?origin=map`);
  };

  const backLabel = source === "event" ? "Event" : "Discover";

  if (viewerLoading || (viewerProfileId && eventsResult === undefined)) {
    return (
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.centeredState}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText>Loading map...</AppText>
      </SafeAreaView>
    );
  }

  if (viewerError) {
    return (
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.centeredState}>
        <AppText color={theme.colors.danger} variant="h3">
          Could not load map
        </AppText>
        <AppText>{viewerError}</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenDiscoverList}
          style={({ pressed }) => [
            styles.overlayAction,
            pressed ? styles.touchPressed : undefined,
          ]}>
          <AppText color={theme.colors.primary} style={styles.overlayActionLabel} variant="caption">
            Back to Discover
          </AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <View style={styles.mapLayer}>
        <EventMap
          events={visibleEvents}
          focusLocation={focusLocation}
          followSelection={false}
          markerLabelMode="detailed"
          onSelectEvent={setSelectedEventId}
          selectedEventId={selectedEventId}
          variant="fullscreen"
        />
      </View>

      <View style={[styles.topOverlayRow, { top: insets.top + theme.spacing.sm }]}>
        <Pressable
          accessibilityLabel={`Back to ${backLabel}`}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.overlayAction,
            pressed ? styles.touchPressed : undefined,
          ]}>
          <Ionicons color={theme.colors.primary} name="chevron-back" size={20} />
          <AppText color={theme.colors.primary} style={styles.overlayActionLabel} variant="caption">
            {backLabel}
          </AppText>
        </Pressable>
        <View style={styles.topOverlayRightActions}>
          {selectedEvent ? (
            <Pressable
              accessibilityLabel={`Open ${selectedEvent.title}`}
              accessibilityRole="button"
              onPress={onOpenSelectedEvent}
              style={({ pressed }) => [
                styles.overlayAction,
                pressed ? styles.touchPressed : undefined,
              ]}>
              <Ionicons color={theme.colors.primary} name="open-outline" size={16} />
              <AppText color={theme.colors.primary} style={styles.overlayActionLabel} variant="caption">
                Open
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  centeredState: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  mapLayer: {
    flex: 1,
  },
  topOverlayRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: theme.spacing.md,
    position: "absolute",
    right: theme.spacing.md,
  },
  topOverlayRightActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  overlayAction: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceGlassStrong,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize + 2,
    minWidth: 82,
    paddingHorizontal: theme.spacing.sm,
    ...theme.elevation.soft,
  },
  overlayActionLabel: {
    fontWeight: "600",
  },
  touchPressed: {
    opacity: 0.8,
  },
});
