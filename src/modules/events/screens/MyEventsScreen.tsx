import { ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { EventCalendar } from "@/src/modules/events/components/EventCalendar";
import { EventCard } from "@/src/modules/events/components/EventCard";
import type { EventListItem } from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

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

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText color={theme.colors.body}>
          Review upcoming commitments and events you host.
        </AppText>
      </View>

      {isWideLayout ? (
        <View style={styles.columns}>
          <View style={styles.primaryColumn}>{calendarSection}</View>
          <View style={styles.secondaryColumn}>{hostingSection}</View>
        </View>
      ) : (
        <>
          {calendarSection}
          {hostingSection}
        </>
      )}
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
  columns: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  primaryColumn: {
    flex: 1.15,
    minWidth: 0,
  },
  secondaryColumn: {
    flex: 1,
    minWidth: 0,
  },
});
