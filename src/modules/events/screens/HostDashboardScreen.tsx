import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import type { EventListItem } from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";

export function HostDashboardScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();
  const { signOut } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const myEventsResult = useQuery(
    api.events.listForViewer,
    viewerProfileId ? {} : "skip",
  );
  const selectedEventDetail = useQuery(
    api.events.getById,
    viewerProfileId && selectedEventId
      ? {
          eventId: selectedEventId as Id<"events">,
        }
      : "skip",
  );
  const sendEventMessage = useMutation(api.events.sendEventMessage);

  const hosting = (myEventsResult?.hosting ?? []) as EventListItem[];

  useEffect(() => {
    if (!selectedEventId && hosting[0]) {
      setSelectedEventId(hosting[0].id);
    }
  }, [hosting, selectedEventId]);

  const onSend = async () => {
    if (!viewerProfileId || !selectedEventId || !messageBody.trim()) {
      return;
    }

    setStatusNote(null);
    setIsSending(true);

    try {
      await sendEventMessage({
        eventId: selectedEventId as Id<"events">,
        body: messageBody,
        kind: "announcement",
      });

      setMessageBody("");
      setStatusNote("Message sent to attendees.");
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (viewerLoading || !myEventsResult) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading host dashboard...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <AppText variant="overline" color={theme.colors.primary}>
          Organizer Hub
        </AppText>
        <AppText variant="h1" color={theme.colors.heading}>
          Manage hosted events
        </AppText>
        <AppText>
          Track attendance at a glance and send updates directly to people who signed up.
        </AppText>
        <Button
          label="Sign Out"
          onPress={() => signOut()}
          variant="secondary"
        />
      </Card>

      {hosting.length === 0 ? (
        <Card>
          <AppText variant="h3" color={theme.colors.heading}>
            You are not hosting events yet
          </AppText>
          <AppText>Create your first event to unlock attendee messaging.</AppText>
          <Button label="Create Event" onPress={() => router.push("/(tabs)/create")} />
        </Card>
      ) : (
        <>
          <Card>
            <AppText variant="h2" color={theme.colors.heading}>
              Your events
            </AppText>
            <View style={styles.eventSelectorList}>
              {hosting.map((eventItem) => (
                <Pressable
                  key={eventItem.id}
                  onPress={() => setSelectedEventId(eventItem.id)}
                  style={[
                    styles.eventSelector,
                    selectedEventId === eventItem.id ? styles.eventSelectorActive : undefined,
                  ]}>
                  <View style={styles.eventSelectorText}>
                    <AppText
                      color={selectedEventId === eventItem.id ? theme.colors.primaryText : theme.colors.heading}
                      variant="h3">
                      {eventItem.title}
                    </AppText>
                    <AppText
                      color={selectedEventId === eventItem.id ? "#dff7ff" : theme.colors.body}
                      variant="caption">
                      {eventItem.city} • {eventItem.attendeeCount} attendees
                    </AppText>
                  </View>
                  <Badge label={eventItem.category} />
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <AppText variant="h2" color={theme.colors.heading}>
              Send attendee message
            </AppText>
            <TextField
              label="Announcement"
              multiline
              onChangeText={setMessageBody}
              placeholder="Parking update, what to bring, weather changes..."
              value={messageBody}
            />
            {statusNote ? (
              <AppText color={statusNote.includes("sent") ? theme.colors.success : theme.colors.danger}>
                {statusNote}
              </AppText>
            ) : null}
            <Button label="Send Message" loading={isSending} onPress={onSend} />
          </Card>

          <Card>
            <AppText variant="h2" color={theme.colors.heading}>
              Attendee tracking
            </AppText>
            {!selectedEventId || selectedEventDetail === undefined ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <AppText>Loading attendee activity...</AppText>
              </View>
            ) : selectedEventDetail === null ? (
              <AppText>This event could not be loaded.</AppText>
            ) : (
              <>
                <View style={styles.breakdownRow}>
                  <Badge label={`${selectedEventDetail.attendeeBreakdown.total} responses`} />
                  <Badge
                    label={`${selectedEventDetail.attendeeBreakdown.going} going`}
                    tone="success"
                  />
                  <Badge
                    label={`${selectedEventDetail.attendeeBreakdown.interested} interested`}
                    tone="warning"
                  />
                </View>
                <View style={styles.attendeeList}>
                  {selectedEventDetail.attendees.length === 0 ? (
                    <AppText>No RSVPs yet for this event.</AppText>
                  ) : (
                    selectedEventDetail.attendees.map((attendee) => (
                      <View key={attendee.profile.id} style={styles.attendeeRow}>
                        <View style={styles.attendeeIdentity}>
                          <AppText variant="caption" color={theme.colors.heading}>
                            {attendee.profile.displayName}
                          </AppText>
                          {attendee.profile.city ? (
                            <AppText variant="caption" color={theme.colors.muted}>
                              {attendee.profile.city}
                            </AppText>
                          ) : null}
                        </View>
                        <Badge
                          label={attendee.status}
                          tone={attendee.status === "going" ? "success" : "warning"}
                        />
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </Card>

          <Card>
            <AppText variant="h2" color={theme.colors.heading}>
              Recent organizer updates
            </AppText>
            {!selectedEventId || selectedEventDetail === undefined ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <AppText>Loading update history...</AppText>
              </View>
            ) : selectedEventDetail === null || selectedEventDetail.messages.length === 0 ? (
              <AppText>No updates sent for this event yet.</AppText>
            ) : (
              <View style={styles.messageList}>
                {selectedEventDetail.messages.slice(0, 6).map((message) => (
                  <View key={message.id} style={styles.messageItem}>
                    <View style={styles.messageHeader}>
                      <Badge label={message.kind} />
                      <AppText variant="caption" color={theme.colors.muted}>
                        {new Date(message.createdAt).toLocaleString()}
                      </AppText>
                    </View>
                    <AppText>{message.body}</AppText>
                  </View>
                ))}
              </View>
            )}
          </Card>
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
  eventSelectorList: {
    gap: theme.spacing.xs,
  },
  eventSelector: {
    alignItems: "center",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "space-between",
    padding: theme.spacing.sm,
  },
  eventSelectorActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eventSelectorText: {
    flex: 1,
    gap: 2,
  },
  inlineLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  attendeeList: {
    gap: theme.spacing.xs,
  },
  attendeeRow: {
    alignItems: "center",
    backgroundColor: "#f2fbff",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  attendeeIdentity: {
    gap: 2,
  },
  messageList: {
    gap: theme.spacing.xs,
  },
  messageItem: {
    backgroundColor: "#f7fcff",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  messageHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
