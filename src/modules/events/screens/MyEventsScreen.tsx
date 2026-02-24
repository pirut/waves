import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { EventCalendar } from "@/src/modules/events/components/EventCalendar";
import { EventCard } from "@/src/modules/events/components/EventCard";
import {
  getRsvpStatusLabel,
  getRsvpStatusTone,
  type EventListItem,
} from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";
import { formatDateTimeWithClock } from "@/src/modules/events/utils/formatters";

export function MyEventsScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();
  const { width } = useWindowDimensions();
  const isWideLayout = (Platform.OS === "ios" && Platform.isPad) || width >= 1024;

  const myEventsResult = useQuery(
    api.events.listForViewer,
    viewerProfileId ? {} : "skip",
  );

  const attending = (myEventsResult?.attending ?? []) as EventListItem[];
  const hosting = (myEventsResult?.hosting ?? []) as EventListItem[];
  const upcomingAttending = [...attending]
    .filter((eventItem) => eventItem.endAt >= Date.now())
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, 4);

  if (viewerLoading || !myEventsResult) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading your event schedule...</AppText>
        </View>
      </Screen>
    );
  }

  const calendarSection = (
    <View style={styles.section}>
      <AppText variant="h2" color={theme.colors.heading}>
        Calendar view
      </AppText>
      {attending.length === 0 ? (
        <Card>
          <AppText variant="h3" color={theme.colors.heading}>
            No RSVP history yet
          </AppText>
          <AppText>Head to Discover and join your first event.</AppText>
        </Card>
      ) : (
        <EventCalendar
          events={attending}
          onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
        />
      )}
      <Card>
        <View style={styles.commitmentsHeader}>
          <AppText variant="h3" color={theme.colors.heading}>
            Upcoming commitments
          </AppText>
          <Badge
            label={`${upcomingAttending.length} next`}
            tone={upcomingAttending.length > 0 ? "success" : "default"}
          />
        </View>
        {upcomingAttending.length === 0 ? (
          <AppText>No upcoming events yet. Join events from Discover.</AppText>
        ) : (
          <View style={styles.commitmentsList}>
            {upcomingAttending.map((eventItem) => (
              <Pressable
                accessibilityLabel={`Open ${eventItem.title}`}
                accessibilityRole="button"
                key={eventItem.id}
                onPress={() => router.push(`/events/${eventItem.id}`)}
                style={({ pressed }) => [
                  styles.commitmentItem,
                  pressed ? styles.commitmentPressed : undefined,
                ]}>
                <View style={styles.commitmentMeta}>
                  <AppText color={theme.colors.heading} variant="caption" style={styles.commitmentTitle}>
                    {eventItem.title}
                  </AppText>
                  <AppText color={theme.colors.muted} variant="caption">
                    {eventItem.city}
                  </AppText>
                  <AppText color={theme.colors.muted} variant="caption">
                    {formatDateTimeWithClock(eventItem.startAt)}
                  </AppText>
                </View>
                {eventItem.viewerRsvp ? (
                  <Badge
                    label={getRsvpStatusLabel(eventItem.viewerRsvp)}
                    tone={getRsvpStatusTone(eventItem.viewerRsvp)}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </Card>
    </View>
  );

  const hostingSection = (
    <View style={styles.section}>
      <AppText variant="h2" color={theme.colors.heading}>
        Events you host
      </AppText>
      {hosting.length === 0 ? (
        <Card>
          <AppText>No hosted events yet. Create one from the Create tab.</AppText>
        </Card>
      ) : (
        hosting.map((eventItem) => (
          <EventCard
            item={eventItem}
            key={eventItem.id}
            onOpen={() => router.push(`/events/${eventItem.id}`)}
          />
        ))
      )}
    </View>
  );

  if (isWideLayout) {
    return (
      <Screen scroll={false}>
        <View style={styles.headerSection}>
          <AppText variant="h2" color={theme.colors.heading}>
            My Events
          </AppText>
          <AppText color={theme.colors.body}>
            Review upcoming commitments and events you host.
          </AppText>
        </View>

        <View style={styles.columnsSticky}>
          <View style={styles.stickyCalendarColumn}>{calendarSection}</View>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.eventsScrollContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.eventsScroll}>
            {hostingSection}
          </ScrollView>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText variant="h2" color={theme.colors.heading}>
          My Events
        </AppText>
        <AppText color={theme.colors.body}>
          Review upcoming commitments and events you host.
        </AppText>
      </View>
      {calendarSection}
      {hostingSection}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  section: {
    gap: theme.spacing.sm,
  },
  headerSection: {
    gap: theme.spacing.xs,
  },
  columnsSticky: {
    alignItems: "flex-start",
    flexDirection: "row",
    flex: 1,
    gap: theme.spacing.md,
    minHeight: 0,
  },
  stickyCalendarColumn: {
    flex: 1.15,
    minWidth: 0,
  },
  eventsScroll: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  eventsScrollContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  commitmentsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commitmentsList: {
    gap: theme.spacing.xs,
  },
  commitmentItem: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "space-between",
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  commitmentMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  commitmentTitle: {
    fontWeight: "700",
  },
  commitmentPressed: {
    opacity: 0.8,
  },
});
