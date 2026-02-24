import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { StyleSheet, View } from "react-native";
import { Bounds, Map, Marker, ZoomControl } from "pigeon-maps";
import { format } from "date-fns";

import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import {
  buildEventClusterIndex,
  getEventClusterItems,
} from "@/src/modules/events/components/eventMapClustering";
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
  bounds?: Bounds;
};

function buildEventDataSignature(events: EventMapProps["events"]) {
  return events
    .map(
      (eventItem) =>
        `${eventItem.id}:${eventItem.latitude.toFixed(5)}:${eventItem.longitude.toFixed(5)}:${eventItem.startAt}:${eventItem.attendeeCount}:${eventItem.title}:${eventItem.city}`,
    )
    .join("|");
}

function arePointsEqual(a: [number, number], b: [number, number]) {
  return Math.abs(a[0] - b[0]) < 0.000001 && Math.abs(a[1] - b[1]) < 0.000001;
}

function areBoundsEqual(a?: Bounds, b?: Bounds) {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }

  return arePointsEqual(a.ne, b.ne) && arePointsEqual(a.sw, b.sw);
}

function getFallbackBounds(center: [number, number], zoom: number): Bounds {
  const span = 360 / 2 ** zoom;
  const halfSpan = span / 2;
  return {
    ne: [center[0] + halfSpan, center[1] + halfSpan],
    sw: [center[0] - halfSpan, center[1] - halfSpan],
  };
}

const CLUSTERING_CUTOFF_ZOOM = 11;

function getTargetView({
  events,
  selectedEventId,
  focusLocation,
  followSelection,
}: Pick<EventMapProps, "events" | "selectedEventId" | "focusLocation" | "followSelection">): MapViewState {
  if (events.length === 0 && !focusLocation) {
    return {
      center: [20, 0],
      zoom: 2,
    };
  }

  const selectedEvent =
    followSelection && selectedEventId
      ? events.find((eventItem) => eventItem.id === selectedEventId)
      : undefined;
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

function formatMarkerMeta(startAt: number, city: string, attendeeCount: number) {
  return `${format(new Date(startAt), "MMM d")} • ${city} • ${attendeeCount}`;
}

function EventMapMarkerLabel({
  title,
  meta,
  selected,
  showBubble,
  showMeta,
}: {
  title: string;
  meta: string;
  selected: boolean;
  showBubble: boolean;
  showMeta: boolean;
}) {
  const shellStyle: CSSProperties = {
    pointerEvents: "auto",
    transform: showBubble ? "translate(-50%, -100%)" : "translate(-50%, -50%)",
    alignItems: "center",
    display: "flex",
    maxWidth: showBubble ? 214 : 20,
    minWidth: showBubble ? 88 : 14,
    position: "relative",
  };

  const bubbleStyle: CSSProperties = {
    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceGlassStrong,
    border: `1px solid ${selected ? theme.colors.primaryDeep : theme.colors.glassBorderStrong}`,
    borderRadius: 999,
    boxShadow: selected ? "0 8px 20px rgba(10, 132, 255, 0.24)" : "0 4px 12px rgba(0, 0, 0, 0.12)",
    color: selected ? theme.colors.primaryText : theme.colors.heading,
    display: "flex",
    flexDirection: "column",
    gap: showMeta ? 2 : 0,
    maxWidth: 214,
    minWidth: 88,
    padding: showMeta ? "6px 10px 5px 10px" : "6px 10px",
  };

  const titleStyle: CSSProperties = {
    color: selected ? theme.colors.primaryText : theme.colors.heading,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.caption,
    fontWeight: 700,
    letterSpacing: -0.1,
    lineHeight: 18,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const metaStyle: CSSProperties = {
    color: selected ? theme.colors.sky : theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.overline,
    fontWeight: 600,
    letterSpacing: 0.1,
    lineHeight: 15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const tailStyle: CSSProperties = {
    borderLeft: "6px solid transparent",
    borderRight: "6px solid transparent",
    borderTop: `9px solid ${selected ? theme.colors.primary : theme.colors.surfaceGlassStrong}`,
    marginTop: -1,
  };

  const dotStyle: CSSProperties = {
    backgroundColor: selected ? theme.colors.primaryDeep : theme.colors.primary,
    border: `1px solid ${theme.colors.background}`,
    borderRadius: 999,
    height: showBubble ? 11 : 14,
    marginTop: showBubble ? -1 : 0,
    width: showBubble ? 11 : 14,
  };

  return (
    <div style={shellStyle}>
      {showBubble ? (
        <div style={bubbleStyle}>
          <div style={titleStyle}>{title}</div>
          {showMeta ? <div style={metaStyle}>{meta}</div> : null}
        </div>
      ) : null}
      {showBubble ? <div style={tailStyle} /> : null}
      <div style={dotStyle} />
    </div>
  );
}

function EventMapClusterBubble({ count }: { count: number }) {
  const bubbleStyle: CSSProperties = {
    alignItems: "center",
    backgroundColor: theme.colors.primaryDeep,
    border: `2px solid ${theme.colors.background}`,
    borderRadius: 999,
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.18)",
    color: theme.colors.primaryText,
    display: "flex",
    fontFamily: theme.fonts.body,
    fontSize: theme.typography.caption,
    fontWeight: 700,
    justifyContent: "center",
    letterSpacing: 0.1,
    minHeight: theme.control.minTouchSize,
    minWidth: theme.control.minTouchSize,
    padding: "0 8px",
    pointerEvents: "auto",
    transform: "translate(-50%, -50%)",
  };

  return <div style={bubbleStyle}>{count}</div>;
}

export function EventMap({
  events,
  onSelectEvent,
  selectedEventId,
  focusLocation,
  height,
  variant = "embedded",
  markerLabelMode = "compact",
  followSelection = false,
}: EventMapProps) {
  const targetView = useMemo(
    () => getTargetView({ events, selectedEventId, focusLocation, followSelection }),
    [events, followSelection, focusLocation, selectedEventId],
  );

  const [viewState, setViewState] = useState<MapViewState>(targetView);
  const eventsSignature = useMemo(() => buildEventDataSignature(events), [events]);
  const mapHeight = height ?? (variant === "fullscreen" ? 520 : 264);
  const clusterIndex = useMemo(() => buildEventClusterIndex(events), [eventsSignature]);
  const clusterBounds = viewState.bounds ?? getFallbackBounds(viewState.center, viewState.zoom);
  const clusterZoom = useMemo(() => Math.max(0, Math.min(18, Math.floor(viewState.zoom))), [viewState.zoom]);
  const shouldCluster = clusterZoom < CLUSTERING_CUTOFF_ZOOM;
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
        west: clusterBounds.sw[1],
        south: clusterBounds.sw[0],
        east: clusterBounds.ne[1],
        north: clusterBounds.ne[0],
        zoom: clusterZoom,
      });
    },
    [clusterBounds.ne, clusterBounds.sw, clusterIndex, clusterZoom, events, shouldCluster],
  );
  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((eventItem) => eventItem.id === selectedEventId) : undefined),
    [events, selectedEventId],
  );
  const selectedEventRenderedInItems = useMemo(() => {
    if (!selectedEventId) {
      return false;
    }

    return clusteredItems.some(
      (clusterItem) =>
        clusterItem.kind === "event" && clusterItem.event.id === selectedEventId,
    );
  }, [clusteredItems, selectedEventId]);
  const mapShellStyle = [
    styles.mapShell,
    variant === "fullscreen" ? styles.mapShellFullscreen : styles.mapShellEmbedded,
    variant === "fullscreen" && !height ? styles.mapShellFullscreenFlex : undefined,
    height ? { height } : undefined,
  ];

  useEffect(() => {
    if (followSelection && selectedEventId) {
      const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);
      if (!selectedEvent) {
        return;
      }

      const nextCenter: [number, number] = [selectedEvent.latitude, selectedEvent.longitude];
      setViewState((current) =>
        arePointsEqual(current.center, nextCenter)
          ? current
          : {
              ...current,
              bounds: undefined,
              center: nextCenter,
              zoom: Math.max(current.zoom, 12),
            },
      );
      return;
    }

    if (focusLocation) {
      const nextCenter: [number, number] = [focusLocation.latitude, focusLocation.longitude];
      setViewState((current) =>
        arePointsEqual(current.center, nextCenter)
          ? current
          : {
              ...current,
              bounds: undefined,
              center: nextCenter,
              zoom: Math.max(current.zoom, 12),
            },
      );
      return;
    }

    if (!viewState.bounds) {
      setViewState((current) =>
        arePointsEqual(current.center, targetView.center) && current.zoom === targetView.zoom
          ? current
          : {
              ...current,
              center: targetView.center,
              zoom: targetView.zoom,
            },
      );
    }
  }, [
    events,
    focusLocation,
    followSelection,
    selectedEventId,
    targetView.center,
    targetView.zoom,
    viewState.bounds,
  ]);

  const onPressCluster = (clusterId: number, latitude: number, longitude: number) => {
    if (!clusterIndex) {
      return;
    }

    let expansionZoom = viewState.zoom + 1;
    try {
      expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
    } catch {
      expansionZoom = viewState.zoom + 1;
    }

    setViewState((current) => ({
      ...current,
      bounds: undefined,
      center: [latitude, longitude],
      zoom: Math.min(expansionZoom + 0.6, 18),
    }));
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
    <View style={mapShellStyle}>
      <Map
        center={viewState.center}
        height={mapHeight}
        onBoundsChanged={({ bounds, center, zoom }) => {
          setViewState((current) => {
            if (
              current.zoom === zoom &&
              arePointsEqual(current.center, center) &&
              areBoundsEqual(current.bounds, bounds)
            ) {
              return current;
            }

            return {
              bounds,
              center,
              zoom,
            };
          });
        }}
        zoom={viewState.zoom}>
        {clusteredItems.map((clusterItem) => {
          if (clusterItem.kind === "cluster") {
            return (
              <Marker
                anchor={[clusterItem.latitude, clusterItem.longitude]}
                key={clusterItem.id}
                onClick={() =>
                  onPressCluster(clusterItem.clusterId, clusterItem.latitude, clusterItem.longitude)
                }
                width={1}>
                <EventMapClusterBubble count={clusterItem.count} />
              </Marker>
            );
          }

          const eventItem = clusterItem.event;

          const markerSelected = selectedEventId === eventItem.id;
          const showBubble = markerLabelMode !== "detailed" || markerSelected;
          const showMeta = markerLabelMode === "detailed" && markerSelected;
          const markerMeta = formatMarkerMeta(
            eventItem.startAt,
            eventItem.city,
            eventItem.attendeeCount,
          );

          return (
            <Marker
              anchor={[eventItem.latitude, eventItem.longitude]}
              key={eventItem.id}
              onClick={() => onSelectEvent(eventItem.id)}
              width={1}>
              <EventMapMarkerLabel
                meta={markerMeta}
                selected={markerSelected}
                showBubble={showBubble}
                showMeta={showMeta}
                title={eventItem.title}
              />
            </Marker>
          );
        })}
        {selectedEvent && !selectedEventRenderedInItems ? (
          <Marker
            anchor={[selectedEvent.latitude, selectedEvent.longitude]}
            key={`selected:${selectedEvent.id}`}
            onClick={() => onSelectEvent(selectedEvent.id)}
            width={1}>
            <EventMapMarkerLabel
              meta={formatMarkerMeta(
                selectedEvent.startAt,
                selectedEvent.city,
                selectedEvent.attendeeCount,
              )}
              selected
              showBubble
              showMeta={markerLabelMode === "detailed"}
              title={selectedEvent.title}
            />
          </Marker>
        ) : null}
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
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.glassBorderStrong,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    ...theme.elevation.soft,
  },
  mapShellEmbedded: {
    height: 264,
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
    ...theme.elevation.soft,
  },
  emptyStateFullscreen: {
    borderRadius: 0,
    borderWidth: 0,
    justifyContent: "center",
  },
  emptyStateFullscreenFlex: {
    flex: 1,
  },
});
