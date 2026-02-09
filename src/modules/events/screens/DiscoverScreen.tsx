import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";

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
import { EVENT_CATEGORIES, type EventListItem } from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

export function DiscoverScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading, viewerError } = useViewerProfile();

  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [rsvpPendingId, setRsvpPendingId] = useState<string | null>(null);

  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  const eventsResult = useQuery(
    api.events.listPublished,
    viewerProfileId
      ? {
          city: cityFilter.trim() ? cityFilter.trim() : undefined,
          category: categoryFilter,
          limit: 80,
        }
      : "skip",
  );

  const events = useMemo(() => (eventsResult ?? []) as EventListItem[], [eventsResult]);

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId) ?? events[0];

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

  if (viewerLoading || !eventsResult) {
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
      <Card style={styles.heroCard}>
        <AppText variant="overline" color={theme.colors.primary}>
          Make Waves
        </AppText>
        <AppText variant="hero" color={theme.colors.heading}>
          Discover local impact events around you
        </AppText>
        <AppText>
          Find meaningful opportunities on the map, RSVP instantly, and build your personal impact calendar.
        </AppText>
      </Card>

      <TextField
        label="Filter by city"
        onChangeText={setCityFilter}
        placeholder="San Francisco"
        value={cityFilter}
      />

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

      <EventMap
        events={events}
        onSelectEvent={setSelectedEventId}
        selectedEventId={selectedEvent?.id}
      />

      {selectedEvent ? (
        <EventCard
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
          <AppText>Try removing filters or create a new event.</AppText>
          <Button label="Create Event" onPress={() => router.push("/(tabs)/create")} />
        </Card>
      )}

      <View style={styles.listSection}>
        <AppText variant="h2" color={theme.colors.heading}>
          Nearby events
        </AppText>
        {events.map((eventItem) => (
          <EventCard
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
    backgroundColor: "#ecfaff",
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
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  listSection: {
    gap: theme.spacing.sm,
  },
});
