import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import MapView, { Callout, Marker, Region, type LatLng } from "react-native-maps";
import { format } from "date-fns";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import {
  buildEventClusterIndex,
  getEventClusterItems,
} from "@/src/modules/events/components/eventMapClustering";
import type { EventListItem } from "@/src/modules/events/domain/types";
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
  followSelection,
}: Pick<EventMapProps, "events" | "selectedEventId" | "focusLocation" | "followSelection">): Region {
  const selectedEvent =
    followSelection && selectedEventId
      ? events.find((eventItem) => eventItem.id === selectedEventId)
      : undefined;
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

function buildEventDataSignature(events: EventMapProps["events"]) {
  return events
    .map(
      (eventItem) =>
        `${eventItem.id}:${eventItem.latitude.toFixed(5)}:${eventItem.longitude.toFixed(5)}:${eventItem.startAt}:${eventItem.attendeeCount}:${eventItem.title}:${eventItem.city}`,
    )
    .join("|");
}

function toZoomFromLongitudeDelta(longitudeDelta: number, mapWidth: number) {
  const safeDelta = Math.max(longitudeDelta, 0.000001);
  const safeWidth = Math.max(mapWidth, 256);
  return Math.log2((360 * (safeWidth / 256)) / safeDelta);
}

function formatEventTooltipDate(startAt: number) {
  return format(new Date(startAt), "EEE, MMM d • h:mm a");
}

function EventMarkerCallout({ eventItem }: { eventItem: EventListItem }) {
  return (
    <Callout tooltip>
      <View style={styles.calloutShell}>
        <View style={styles.calloutCard}>
          <AppText color={theme.colors.heading} numberOfLines={2} style={styles.calloutTitle} variant="body">
            {eventItem.title}
          </AppText>
          <AppText color={theme.colors.muted} numberOfLines={1} style={styles.calloutDateLabel} variant="overline">
            {formatEventTooltipDate(eventItem.startAt)}
          </AppText>
          <View style={styles.calloutMetaRow}>
            <AppText color={theme.colors.body} numberOfLines={1} variant="caption">
              {eventItem.city}
            </AppText>
            <AppText color={theme.colors.subtle} variant="caption">
              {" \u2022 "}
            </AppText>
            <AppText color={theme.colors.body} numberOfLines={1} variant="caption">
              {eventItem.attendeeCount} going
            </AppText>
          </View>
        </View>
        <View style={styles.calloutPointerFrame}>
          <View style={styles.calloutPointerInner} />
        </View>
      </View>
    </Callout>
  );
}

function getDeltaForZoom(zoom: number, mapWidth: number) {
  const safeWidth = Math.max(mapWidth, 256);
  return (360 * (safeWidth / 256)) / 2 ** zoom;
}

function areRegionsClose(a: Region, b: Region) {
  return (
    Math.abs(a.latitude - b.latitude) < 0.000001 &&
    Math.abs(a.longitude - b.longitude) < 0.000001 &&
    Math.abs(a.latitudeDelta - b.latitudeDelta) < 0.000001 &&
    Math.abs(a.longitudeDelta - b.longitudeDelta) < 0.000001
  );
}

const CLUSTERING_CUTOFF_ZOOM = 11;
const CLUSTERING_HYSTERESIS = 0.35;

export function EventMap({
  events,
  onSelectEvent,
  selectedEventId,
  focusLocation,
  height,
  variant = "embedded",
  markerLabelMode: _markerLabelMode = "compact",
  followSelection = false,
}: EventMapProps) {
  const selectionDependency = followSelection ? selectedEventId : undefined;
  const targetRegion = useMemo(
    () => getTargetRegion({ events, selectedEventId, focusLocation, followSelection }),
    [events, followSelection, focusLocation, selectionDependency],
  );
  const [viewportRegion, setViewportRegion] = useState<Region>(targetRegion);
  const [mapWidth, setMapWidth] = useState(390);
  const mapRef = useRef<MapView | null>(null);
  const eventsSignature = useMemo(() => buildEventDataSignature(events), [events]);
  const latestEventsSignature = useRef<string>("");
  const latestFocusKey = useRef<string>("");
  const latestSelectionKey = useRef<string>("");
  const latestSingleEventSignature = useRef<string>("");

  useEffect(() => {
    if (!mapRef.current || !followSelection || !selectedEventId) {
      return;
    }

    const selectionKey = `${selectedEventId}:${eventsSignature}`;
    if (latestSelectionKey.current === selectionKey) {
      return;
    }

    const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);
    if (!selectedEvent) {
      return;
    }

    latestSelectionKey.current = selectionKey;

    mapRef.current.animateToRegion(
      {
        latitude: selectedEvent.latitude,
        longitude: selectedEvent.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
      280,
    );
  }, [events, eventsSignature, followSelection, selectedEventId]);

  useEffect(() => {
    if (!mapRef.current || !focusLocation || (followSelection && selectedEventId)) {
      return;
    }

    const focusKey = `${focusLocation.latitude.toFixed(6)}:${focusLocation.longitude.toFixed(6)}`;
    if (latestFocusKey.current === focusKey) {
      return;
    }

    latestFocusKey.current = focusKey;

    mapRef.current.animateToRegion(
      {
        latitude: focusLocation.latitude,
        longitude: focusLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      280,
    );
  }, [focusLocation, followSelection, selectedEventId]);

  useEffect(() => {
    if (!mapRef.current || (followSelection && selectedEventId) || focusLocation || events.length < 2) {
      return;
    }

    if (latestEventsSignature.current === eventsSignature) {
      return;
    }

    latestEventsSignature.current = eventsSignature;

    const coordinates: LatLng[] = events.map((eventItem) => ({
      latitude: eventItem.latitude,
      longitude: eventItem.longitude,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding:
        variant === "fullscreen"
          ? { top: 124, right: 48, bottom: 168, left: 48 }
          : { top: 44, right: 36, bottom: 52, left: 36 },
      animated: true,
    });
  }, [events, eventsSignature, focusLocation, followSelection, selectedEventId, variant]);

  useEffect(() => {
    if (!mapRef.current || (followSelection && selectedEventId) || focusLocation || events.length !== 1) {
      return;
    }

    if (latestSingleEventSignature.current === eventsSignature) {
      return;
    }

    latestSingleEventSignature.current = eventsSignature;
    const onlyEvent = events[0];

    mapRef.current.animateToRegion(
      {
        latitude: onlyEvent.latitude,
        longitude: onlyEvent.longitude,
        latitudeDelta: defaultRegion.latitudeDelta,
        longitudeDelta: defaultRegion.longitudeDelta,
      },
      240,
    );
  }, [events, eventsSignature, focusLocation, followSelection, selectedEventId]);

  const mapShellStyle = [
    styles.mapShell,
    variant === "fullscreen" ? styles.mapShellFullscreen : styles.mapShellEmbedded,
    variant === "fullscreen" && !height ? styles.mapShellFullscreenFlex : undefined,
    height ? { height } : undefined,
  ];
  const clusterIndex = useMemo(() => buildEventClusterIndex(events), [eventsSignature]);
  const mapZoom = useMemo(
    () => toZoomFromLongitudeDelta(viewportRegion.longitudeDelta, mapWidth),
    [mapWidth, viewportRegion.longitudeDelta],
  );
  const [clusterModeEnabled, setClusterModeEnabled] = useState(() => mapZoom < CLUSTERING_CUTOFF_ZOOM);

  useEffect(() => {
    setClusterModeEnabled((currentMode) => {
      if (currentMode) {
        return mapZoom < CLUSTERING_CUTOFF_ZOOM + CLUSTERING_HYSTERESIS;
      }

      return mapZoom < CLUSTERING_CUTOFF_ZOOM - CLUSTERING_HYSTERESIS;
    });
  }, [mapZoom]);

  const clusterZoom = useMemo(() => Math.max(0, Math.min(18, Math.floor(mapZoom))), [mapZoom]);
  const shouldCluster = clusterModeEnabled;
  const clusteredItems = useMemo(
    () => {
      if (!shouldCluster) {
        return events.map((eventItem) => ({
          kind: "event" as const,
          event: eventItem,
          id: eventItem.id,
          latitude: eventItem.latitude,
          longitude: eventItem.longitude,
        }));
      }

      return getEventClusterItems({
        clusterIndex,
        west: -180,
        south: -85,
        east: 180,
        north: 85,
        zoom: clusterZoom,
      });
    },
    [
      clusterModeEnabled,
      clusterZoom,
      clusterIndex,
      events,
      shouldCluster,
    ],
  );

  const onPressCluster = (clusterId: number, latitude: number, longitude: number) => {
    if (!mapRef.current || !clusterIndex) {
      return;
    }

    let expansionZoom = clusterZoom + 1;
    try {
      expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
    } catch {
      expansionZoom = clusterZoom + 1;
    }

    const zoomWithPadding = expansionZoom + 0.45;
    const targetLongitudeDelta = Math.max(getDeltaForZoom(zoomWithPadding, mapWidth), 0.0035);
    const currentAspect =
      viewportRegion.longitudeDelta > 0
        ? viewportRegion.latitudeDelta / viewportRegion.longitudeDelta
        : 0.9;
    const targetLatitudeDelta = Math.max(targetLongitudeDelta * currentAspect, 0.0035);

    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: targetLatitudeDelta,
        longitudeDelta: targetLongitudeDelta,
      },
      280,
    );
  };

  const onMapLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const nextWidth = Math.round(nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== mapWidth) {
      setMapWidth(nextWidth);
    }
  };
  const onRegionChangeComplete = (nextRegion: Region) => {
    if (nextRegion.latitudeDelta <= 0 || nextRegion.longitudeDelta <= 0) {
      return;
    }

    setViewportRegion((previousRegion) =>
      areRegionsClose(previousRegion, nextRegion) ? previousRegion : nextRegion,
    );
  };

  if (events.length === 0 && !focusLocation) {
    return (
      <View
        style={[
          styles.emptyState,
          variant === "fullscreen" ? styles.emptyStateFullscreen : undefined,
          variant === "fullscreen" && !height ? styles.emptyStateFullscreenFlex : undefined,
          variant === "fullscreen" && height ? { height } : undefined,
        ]}>
        <AppText variant="h3" color={theme.colors.heading}>
          No map points yet
        </AppText>
        <AppText>Try changing your filters or create a new event.</AppText>
      </View>
    );
  }

  return (
    <View onLayout={onMapLayout} style={mapShellStyle}>
      <MapView
        initialRegion={targetRegion}
        mapType="standard"
        moveOnMarkerPress={false}
        onRegionChangeComplete={onRegionChangeComplete}
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        style={StyleSheet.absoluteFillObject}>
        {clusteredItems.map((clusterItem) => {
          if (clusterItem.kind === "cluster") {
            return (
              <Marker
                anchor={{ x: 0.5, y: 0.5 }}
                coordinate={{
                  latitude: clusterItem.latitude,
                  longitude: clusterItem.longitude,
                }}
                key={clusterItem.id}
                tracksViewChanges={false}
                zIndex={8}
                onPress={() =>
                  onPressCluster(clusterItem.clusterId, clusterItem.latitude, clusterItem.longitude)
                }>
                <View style={styles.clusterBubble}>
                  <AppText
                    color={theme.colors.primaryText}
                    numberOfLines={1}
                    variant="caption"
                    style={styles.clusterBubbleLabel}>
                    {clusterItem.count}
                  </AppText>
                </View>
              </Marker>
            );
          }

          const eventItem = clusterItem.event;

          return (
            <Marker
              coordinate={{
                latitude: eventItem.latitude,
                longitude: eventItem.longitude,
              }}
              calloutAnchor={{ x: 0.5, y: 0.02 }}
              key={eventItem.id}
              pinColor={theme.colors.primary}
              zIndex={12}
              onPress={() => onSelectEvent(eventItem.id)}>
              <EventMarkerCallout eventItem={eventItem} />
            </Marker>
          );
        })}
        {focusLocation ? (
          <Marker
            coordinate={{
              latitude: focusLocation.latitude,
              longitude: focusLocation.longitude,
            }}
            pinColor={theme.colors.accent}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...theme.elevation.soft,
  },
  mapShellEmbedded: {
    height: 268,
  },
  mapShellFullscreen: {
    borderRadius: 0,
    borderWidth: 0,
  },
  mapShellFullscreenFlex: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceGlassStrong,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyStateFullscreen: {
    borderRadius: 0,
    borderWidth: 0,
    justifyContent: "center",
  },
  emptyStateFullscreenFlex: {
    flex: 1,
  },
  calloutShell: {
    alignItems: "center",
    marginBottom: 18,
    maxWidth: 280,
  },
  calloutCard: {
    backgroundColor: theme.mode === "dark" ? "rgba(23, 34, 49, 0.95)" : "rgba(255, 255, 255, 0.94)",
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    maxWidth: 260,
    minWidth: 186,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.mode === "dark" ? 0.34 : 0.18,
    shadowRadius: 16,
    elevation: 7,
  },
  calloutTitle: {
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 21,
    marginBottom: 3,
  },
  calloutDateLabel: {
    letterSpacing: 0.2,
  },
  calloutMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4,
  },
  calloutPointerFrame: {
    borderLeftColor: "transparent",
    borderLeftWidth: 10,
    borderRightColor: "transparent",
    borderRightWidth: 10,
    borderTopColor: theme.colors.glassBorderStrong,
    borderTopWidth: 12,
    marginTop: -1,
  },
  calloutPointerInner: {
    borderLeftColor: "transparent",
    borderLeftWidth: 9,
    borderRightColor: "transparent",
    borderRightWidth: 9,
    borderTopColor: theme.mode === "dark" ? "rgba(23, 34, 49, 0.95)" : "rgba(255, 255, 255, 0.94)",
    borderTopWidth: 11,
    marginLeft: -9,
    marginTop: -12,
  },
  clusterBubble: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryDeep,
    borderColor: theme.colors.surfaceGlassStrong,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.xs,
    ...theme.elevation.soft,
  },
  clusterBubbleLabel: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
