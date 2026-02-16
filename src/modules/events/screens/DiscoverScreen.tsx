import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { EventCard } from "@/src/modules/events/components/EventCard";
import { EventMap } from "@/src/modules/events/components/EventMap";
import type { FocusLocation } from "@/src/modules/events/components/EventMap.types";
import { EVENT_CATEGORIES, type EventListItem } from "@/src/modules/events/domain/types";
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

  const onPressRsvp = async (eventId: string) => {
    if (!viewerProfileId) {
      return;
    }

    setRsvpPendingId(eventId);

    try {
      await rsvpToEvent({
        eventId: eventId as Id<"events">,
        status: "going",
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
      <Card innerStyle={styles.heroInner} style={styles.heroCard}>
        <LinearGradient
          colors={[theme.colors.overlayStart, theme.colors.overlayEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.heroGradient}>
          <AppText variant="overline" color={theme.colors.sky}>
            Make Waves
          </AppText>
          <AppText variant="hero" color={theme.colors.primaryText}>
            Discover local impact events around you
          </AppText>
          <AppText color={theme.colors.sky}>
            Find meaningful opportunities on the map, RSVP instantly, and build your personal impact calendar.
          </AppText>
        </LinearGradient>
      </Card>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setCategoryFilter(undefined)}
          style={[styles.filterChip, !categoryFilter ? styles.filterChipActive : undefined]}>
          <AppText
            color={!categoryFilter ? theme.colors.primaryText : theme.colors.primary}
            variant="caption"
            style={{ fontWeight: "700" }}>
            All
          </AppText>
        </Pressable>
        {EVENT_CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => setCategoryFilter(category)}
            style={[styles.filterChip, categoryFilter === category ? styles.filterChipActive : undefined]}>
            <AppText
              color={categoryFilter === category ? theme.colors.primaryText : theme.colors.primary}
              variant="caption"
              style={{ fontWeight: "700" }}>
              {category}
            </AppText>
          </Pressable>
        ))}
      </View>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Address lookup
        </AppText>
        <TextField
          label="Find an address or landmark"
          onChangeText={setLookupQuery}
          placeholder="1 Ferry Building, San Francisco"
          value={lookupQuery}
        />
        <View style={styles.lookupActionRow}>
          <View style={styles.lookupAction}>
            <Button
              label="Look Up Address"
              loading={lookupBusy}
              onPress={onLookupAddress}
              variant="secondary"
            />
          </View>
          <View style={styles.lookupAction}>
            <Button label="Clear" onPress={onClearLookup} variant="ghost" />
          </View>
        </View>
        {focusLocation?.label ? <Badge label={`Focused: ${focusLocation.label}`} /> : null}
        {focusLocation ? (
          <View style={styles.proximitySection}>
            <AppText variant="caption" color={theme.colors.muted}>
              Ranked by proximity
            </AppText>
            <View style={styles.filterRow}>
              <Pressable
                onPress={() => setDistanceRadiusMiles(null)}
                style={[
                  styles.filterChip,
                  distanceRadiusMiles === null ? styles.filterChipActive : undefined,
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
                  key={radiusMiles}
                  onPress={() => setDistanceRadiusMiles(radiusMiles)}
                  style={[
                    styles.filterChip,
                    distanceRadiusMiles === radiusMiles ? styles.filterChipActive : undefined,
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
            </View>
          </View>
        ) : null}
        {lookupError ? <AppText color={theme.colors.danger}>{lookupError}</AppText> : null}
        {lookupResults.length > 0 ? (
          <View style={styles.lookupResultList}>
            {lookupResults.map((resultItem) => (
              <Pressable
                key={`${resultItem.latitude}-${resultItem.longitude}`}
                onPress={() => onSelectLookupResult(resultItem)}
                style={styles.lookupResultItem}>
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

      <AppText variant="overline" color={theme.colors.muted}>
        Live map
      </AppText>
      <EventMap
        events={visibleEvents}
        focusLocation={focusLocation}
        onSelectEvent={setSelectedEventId}
        selectedEventId={selectedEvent?.id}
      />

      {selectedEvent ? (
        <EventCard
          distanceMiles={selectedEvent.distanceMiles}
          item={selectedEvent}
          onOpen={() => router.push(`/events/${selectedEvent.id}`)}
          onRsvp={() => onPressRsvp(selectedEvent.id)}
          rsvpBusy={rsvpPendingId === selectedEvent.id}
        />
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
          Nearby events
        </AppText>
        {focusLocation ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {distanceRadiusMiles === null
              ? "Sorted by nearest first."
              : `Filtered to ${distanceRadiusMiles} miles.`}
          </AppText>
        ) : null}
        {visibleEvents.map((eventItem) => (
          <EventCard
            distanceMiles={eventItem.distanceMiles}
            item={eventItem}
            key={eventItem.id}
            onOpen={() => router.push(`/events/${eventItem.id}`)}
            onRsvp={() => onPressRsvp(eventItem.id)}
            rsvpBusy={rsvpPendingId === eventItem.id}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    padding: 0,
  },
  heroInner: {
    gap: 0,
    padding: 0,
  },
  heroGradient: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  filterChip: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryDeep,
    borderColor: theme.colors.primaryDeep,
  },
  lookupActionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  lookupAction: {
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  proximitySection: {
    gap: theme.spacing.xs,
  },
  listSection: {
    gap: theme.spacing.md,
  },
});
