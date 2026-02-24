import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { EventCard } from "@/src/modules/events/components/EventCard";
import { EventMap } from "@/src/modules/events/components/EventMap";
import type { FocusLocation } from "@/src/modules/events/components/EventMap.types";
import {
  EVENT_CATEGORIES,
  type EventListItem,
  type RSVPStatus,
} from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
  city?: string;
  region?: string;
  country: string;
  postalCode?: string;
};

type EventWithDistance = EventListItem & {
  distanceMiles?: number;
};

const DISTANCE_RADIUS_OPTIONS = [5, 10, 25, 50] as const;

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

export function DiscoverScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading, viewerError } = useViewerProfile();

  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [rsvpPendingId, setRsvpPendingId] = useState<string | null>(null);

  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResults, setLookupResults] = useState<GeocodeResult[]>([]);
  const [focusLocation, setFocusLocation] = useState<FocusLocation | undefined>(undefined);
  const [distanceRadiusMiles, setDistanceRadiusMiles] = useState<number | null>(null);

  const lookupAddress = useAction(api.geocoding.search);
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  const eventsResult = useQuery(
    api.events.listPublished,
    viewerProfileId
      ? {
          category: categoryFilter,
          limit: 80,
        }
      : "skip",
  );

  const [eventsCache, setEventsCache] = useState<EventListItem[]>([]);
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);

  useEffect(() => {
    if (!eventsResult) {
      return;
    }

    setEventsCache(eventsResult as EventListItem[]);
    setHasLoadedEvents(true);
  }, [eventsResult]);

  const events = useMemo(
    () => ((eventsResult ?? eventsCache) as EventListItem[]),
    [eventsCache, eventsResult],
  );

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
    if (!focusLocation || distanceRadiusMiles === null) {
      return eventsWithDistance;
    }

    return eventsWithDistance.filter(
      (eventItem) =>
        eventItem.distanceMiles !== undefined && eventItem.distanceMiles <= distanceRadiusMiles,
    );
  }, [distanceRadiusMiles, eventsWithDistance, focusLocation]);

  const selectedEvent =
    visibleEvents.find((eventItem) => eventItem.id === selectedEventId) ?? visibleEvents[0];
  const listEvents = useMemo(
    () =>
      selectedEvent
        ? visibleEvents.filter((eventItem) => eventItem.id !== selectedEvent.id)
        : visibleEvents,
    [selectedEvent, visibleEvents],
  );

  const onPressRsvp = async (eventId: string, status: RSVPStatus) => {
    if (!viewerProfileId) {
      return;
    }

    setRsvpPendingId(eventId);

    try {
      await rsvpToEvent({
        eventId: eventId as Id<"events">,
        status,
      });
    } finally {
      setRsvpPendingId(null);
    }
  };

  const onLookupAddress = async () => {
    const normalizedQuery = lookupQuery.trim();
    if (normalizedQuery.length < 3) {
      setLookupError("Enter at least 3 characters to look up an address.");
      setLookupResults([]);
      return;
    }

    setLookupBusy(true);
    setLookupError(null);

    try {
      const results = (await lookupAddress({
        query: normalizedQuery,
        limit: 5,
      })) as GeocodeResult[];

      setLookupResults(results);

      if (results[0]) {
        setFocusLocation({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          label: results[0].displayName,
        });
        setDistanceRadiusMiles(null);
      }

      if (results.length === 0) {
        setLookupError("No matching addresses were found.");
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Could not look up this address");
      setLookupResults([]);
    } finally {
      setLookupBusy(false);
    }
  };

  const onSelectLookupResult = (result: GeocodeResult) => {
    setFocusLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      label: result.displayName,
    });
    setLookupQuery(result.displayName);
    setLookupResults([]);
    setDistanceRadiusMiles(null);
  };

  const onClearLookup = () => {
    setLookupQuery("");
    setLookupError(null);
    setLookupResults([]);
    setFocusLocation(undefined);
    setDistanceRadiusMiles(null);
  };

  const onOpenFullScreenMap = () => {
    const params: Record<string, string> = {};

    if (categoryFilter) {
      params.category = categoryFilter;
    }

    if (selectedEvent?.id) {
      params.eventId = selectedEvent.id;
    }

    if (focusLocation) {
      params.focusLatitude = `${focusLocation.latitude}`;
      params.focusLongitude = `${focusLocation.longitude}`;
      if (focusLocation.label) {
        params.focusLabel = focusLocation.label;
      }
    }

    if (distanceRadiusMiles !== null) {
      params.radiusMiles = `${distanceRadiusMiles}`;
    }

    params.source = "discover";

    router.push({
      pathname: "/discover-map",
      params,
    });
  };

  if (viewerLoading || (viewerProfileId && eventsResult === undefined && !hasLoadedEvents)) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Preparing your event feed...</AppText>
        </View>
      </Screen>
    );
  }

  if (viewerError) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <AppText variant="h2" color={theme.colors.danger}>
            Could not initialize profile
          </AppText>
          <AppText>{viewerError}</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText variant="h2" color={theme.colors.heading}>
          Discover
        </AppText>
        <AppText color={theme.colors.body}>
          Find local impact events, RSVP quickly, and build your volunteer calendar.
        </AppText>
      </View>

      <View style={styles.filterGroup}>
        <AppText variant="caption" color={theme.colors.muted}>
          Filter by type
        </AppText>
        <ScrollView
          contentContainerStyle={styles.filterScrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCategoryFilter(undefined)}
            style={({ pressed }) => [
              styles.filterChip,
              !categoryFilter ? styles.filterChipActive : undefined,
              pressed ? styles.touchPressed : undefined,
            ]}>
            <AppText
              color={!categoryFilter ? theme.colors.primaryText : theme.colors.primary}
              variant="caption"
              style={{ fontWeight: "700" }}>
              All
            </AppText>
          </Pressable>
          {EVENT_CATEGORIES.map((category) => (
            <Pressable
              accessibilityRole="button"
              key={category}
              onPress={() => setCategoryFilter(category)}
              style={({ pressed }) => [
                styles.filterChip,
                categoryFilter === category ? styles.filterChipActive : undefined,
                pressed ? styles.touchPressed : undefined,
              ]}>
              <AppText
                color={categoryFilter === category ? theme.colors.primaryText : theme.colors.primary}
                variant="caption"
                style={{ fontWeight: "700" }}>
                {category}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Find near an address
        </AppText>
        <TextField
          label="Address or landmark"
          onChangeText={setLookupQuery}
          placeholder="1 Ferry Building, San Francisco"
          value={lookupQuery}
        />
        <View style={styles.lookupActionRow}>
          <View style={styles.lookupPrimaryAction}>
            <Button
              label="Look Up Address"
              loading={lookupBusy}
              onPress={onLookupAddress}
              variant="secondary"
            />
          </View>
          {(lookupQuery.length > 0 || focusLocation) && (
            <Button fullWidth={false} label="Clear" onPress={onClearLookup} variant="ghost" />
          )}
        </View>

        {focusLocation?.label ? (
          <AppText variant="caption" color={theme.colors.muted}>
            Showing events nearest to {focusLocation.label}
          </AppText>
        ) : null}

        {focusLocation ? (
          <View style={styles.proximitySection}>
            <AppText variant="caption" color={theme.colors.muted}>
              Distance
            </AppText>
            <ScrollView
              contentContainerStyle={styles.filterScrollContent}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDistanceRadiusMiles(null)}
                style={({ pressed }) => [
                  styles.filterChip,
                  distanceRadiusMiles === null ? styles.filterChipActive : undefined,
                  pressed ? styles.touchPressed : undefined,
                ]}>
                <AppText
                  color={distanceRadiusMiles === null ? theme.colors.primaryText : theme.colors.primary}
                  variant="caption"
                  style={{ fontWeight: "700" }}>
                  Any distance
                </AppText>
              </Pressable>

              {DISTANCE_RADIUS_OPTIONS.map((radiusMiles) => (
                <Pressable
                  accessibilityRole="button"
                  key={radiusMiles}
                  onPress={() => setDistanceRadiusMiles(radiusMiles)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    distanceRadiusMiles === radiusMiles ? styles.filterChipActive : undefined,
                    pressed ? styles.touchPressed : undefined,
                  ]}>
                  <AppText
                    color={
                      distanceRadiusMiles === radiusMiles
                        ? theme.colors.primaryText
                        : theme.colors.primary
                    }
                    variant="caption"
                    style={{ fontWeight: "700" }}>
                    {radiusMiles} mi
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {lookupError ? <AppText color={theme.colors.danger}>{lookupError}</AppText> : null}

        {lookupResults.length > 0 ? (
          <View style={styles.lookupResultList}>
            {lookupResults.map((resultItem) => (
              <Pressable
                accessibilityRole="button"
                key={`${resultItem.latitude}-${resultItem.longitude}`}
                onPress={() => onSelectLookupResult(resultItem)}
                style={({ pressed }) => [
                  styles.lookupResultItem,
                  pressed ? styles.touchPressed : undefined,
                ]}>
                <AppText color={theme.colors.heading} variant="caption" style={{ fontWeight: "700" }}>
                  {resultItem.addressLine1}
                </AppText>
                <AppText variant="caption" color={theme.colors.body}>
                  {resultItem.displayName}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>

      <View style={styles.sectionHeaderRow}>
        <AppText variant="h3" color={theme.colors.heading}>
          Live map
        </AppText>
        <Button
          fullWidth={false}
          label="Full Screen"
          onPress={onOpenFullScreenMap}
          variant="secondary"
        />
      </View>
      <EventMap
        events={visibleEvents}
        focusLocation={focusLocation}
        markerLabelMode="compact"
        onSelectEvent={setSelectedEventId}
        selectedEventId={selectedEventId}
      />

      {selectedEvent ? (
        <View style={styles.listSection}>
          <AppText variant="h3" color={theme.colors.heading}>
            Selected event
          </AppText>
          <EventCard
            distanceMiles={selectedEvent.distanceMiles}
            item={selectedEvent}
            onOpen={() => router.push(`/events/${selectedEvent.id}`)}
            onRsvp={(status) => onPressRsvp(selectedEvent.id, status)}
            rsvpBusy={rsvpPendingId === selectedEvent.id}
          />
        </View>
      ) : (
        <Card>
          <AppText variant="h3" color={theme.colors.heading}>
            No events match your filters
          </AppText>
          <AppText>
            {distanceRadiusMiles !== null && focusLocation
              ? `Try expanding beyond ${distanceRadiusMiles} miles.`
              : "Try removing filters or create a new event."}
          </AppText>
          <Button label="Create Event" onPress={() => router.push("/(tabs)/create")} />
        </Card>
      )}

      <View style={styles.listSection}>
        <AppText variant="h2" color={theme.colors.heading}>
          {selectedEvent ? "More nearby events" : "Nearby events"}
        </AppText>
        {focusLocation ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {distanceRadiusMiles === null
              ? "Sorted by nearest first."
              : `Filtered to ${distanceRadiusMiles} miles.`}
          </AppText>
        ) : null}
        {listEvents.length === 0 ? (
          <Card>
            <AppText variant="caption" color={theme.colors.muted}>
              No additional events in this area yet.
            </AppText>
          </Card>
        ) : (
          listEvents.map((eventItem) => (
            <EventCard
              distanceMiles={eventItem.distanceMiles}
              item={eventItem}
              key={eventItem.id}
              onOpen={() => router.push(`/events/${eventItem.id}`)}
              onRsvp={(status) => onPressRsvp(eventItem.id, status)}
              rsvpBusy={rsvpPendingId === eventItem.id}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    gap: theme.spacing.xs,
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  filterGroup: {
    gap: theme.spacing.xs,
  },
  filterScrollContent: {
    gap: theme.spacing.xs,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: 44,
    paddingHorizontal: theme.spacing.md,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  lookupActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  lookupPrimaryAction: {
    flex: 1,
  },
  lookupResultList: {
    gap: theme.spacing.xs,
  },
  lookupResultItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    minHeight: theme.control.minTouchSize,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  touchPressed: {
    opacity: 0.8,
  },
  proximitySection: {
    gap: theme.spacing.xs,
  },
  listSection: {
    gap: theme.spacing.md,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
