import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { EventMap } from "@/src/modules/events/components/EventMap";
import {
  getRsvpStatusLabel,
  getRsvpStatusTone,
  type EventListItem,
  type EventQuestion,
} from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";
import {
  formatEventDateLabel,
  formatEventWindow,
  formatRelativeTime,
} from "@/src/modules/events/utils/formatters";

type Props = {
  eventId: string;
};

export function EventDetailScreen({ eventId }: Props) {
  const { viewerProfileId, viewerLoading } = useViewerProfile();

  const eventResult = useQuery(
    api.events.getById,
    viewerProfileId
      ? {
        eventId: eventId as Id<"events">,
      }
      : "skip",
  );
  const attendeesFeed = usePaginatedQuery(
    api.events.listAttendeesPaginated,
    { eventId: eventId as Id<"events"> },
    { initialNumItems: 20 },
  );
  const messagesFeed = usePaginatedQuery(
    api.events.listMessagesPaginated,
    { eventId: eventId as Id<"events"> },
    { initialNumItems: 20 },
  );
  const questionsFeed = usePaginatedQuery(
    api.events.listQuestionsPaginated,
    { eventId: eventId as Id<"events"> },
    { initialNumItems: 20 },
  );

  const rsvpToEvent = useMutation(api.events.rsvpToEvent);
  const sendEventMessage = useMutation(api.events.sendEventMessage);
  const answerEventQuestion = useMutation(api.events.answerEventQuestion);

  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [answerDraftByQuestionId, setAnswerDraftByQuestionId] = useState<Record<string, string>>(
    {},
  );
  const [answerBusyQuestionId, setAnswerBusyQuestionId] = useState<string | null>(null);
  const [answerFeedbackByQuestionId, setAnswerFeedbackByQuestionId] = useState<
    Record<string, string>
  >({});

  const onOpenInMaps = async () => {
    if (!eventResult) {
      return;
    }

    const addressLabel = encodeURIComponent(
      `${eventResult.event.addressLine1}, ${eventResult.event.city}, ${eventResult.event.country}`,
    );
    const { latitude, longitude } = eventResult.event;

    const mapsUrl =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${addressLabel}`
        : Platform.OS === "android"
          ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${addressLabel})`
          : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    await Linking.openURL(mapsUrl);
  };

  const mapItem = useMemo(() => {
    if (!eventResult) {
      return [] as EventListItem[];
    }

    return [
      {
        id: eventResult.event.id,
        slug: eventResult.event.slug,
        title: eventResult.event.title,
        category: eventResult.event.category,
        startAt: eventResult.event.startAt,
        endAt: eventResult.event.endAt,
        city: eventResult.event.city,
        country: eventResult.event.country,
        latitude: eventResult.event.latitude,
        longitude: eventResult.event.longitude,
        coverImageUrl: eventResult.event.coverImageUrl,
        impactSummary: eventResult.event.impactSummary,
        attendeeCount: eventResult.event.attendeeCount,
        organizer: eventResult.organizer,
        viewerRsvp: eventResult.viewerRsvp,
      },
    ];
  }, [eventResult]);

  const onRsvp = async () => {
    if (!viewerProfileId || !eventResult) {
      return;
    }

    setRsvpBusy(true);

    try {
      await rsvpToEvent({
        eventId: eventResult.event.id,
        status: eventResult.viewerRsvp === "going" ? "interested" : "going",
      });
    } finally {
      setRsvpBusy(false);
    }
  };

  const onSendMessage = async () => {
    if (!viewerProfileId || !eventResult || !messageBody.trim()) {
      return;
    }

    setMessageBusy(true);
    setMessageFeedback(null);

    try {
      await sendEventMessage({
        eventId: eventResult.event.id,
        body: messageBody,
        kind: "announcement",
      });

      setMessageBody("");
      setMessageFeedback("Announcement posted.");
    } catch (error) {
      setMessageFeedback(error instanceof Error ? error.message : "Unable to post message");
    } finally {
      setMessageBusy(false);
    }
  };

  const onAnswerQuestion = async (questionId: string) => {
    const draft = answerDraftByQuestionId[questionId]?.trim() ?? "";
    if (!draft) {
      setAnswerFeedbackByQuestionId((current) => ({
        ...current,
        [questionId]: "Write an answer before sending.",
      }));
      return;
    }

    setAnswerBusyQuestionId(questionId);
    setAnswerFeedbackByQuestionId((current) => ({
      ...current,
      [questionId]: "",
    }));

    try {
      await answerEventQuestion({
        questionId: questionId as Id<"eventQuestions">,
        answerBody: draft,
      });

      setAnswerDraftByQuestionId((current) => ({
        ...current,
        [questionId]: "",
      }));
      setAnswerFeedbackByQuestionId((current) => ({
        ...current,
        [questionId]: "Answer sent.",
      }));
    } catch (error) {
      setAnswerFeedbackByQuestionId((current) => ({
        ...current,
        [questionId]: error instanceof Error ? error.message : "Unable to send answer",
      }));
    } finally {
      setAnswerBusyQuestionId(null);
    }
  };

  if (viewerLoading || eventResult === undefined) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading event details...</AppText>
        </View>
      </Screen>
    );
  }

  if (eventResult === null) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <AppText variant="h2" color={theme.colors.heading}>
            Event not found
          </AppText>
          <AppText>The event may have been removed or is unavailable.</AppText>
        </View>
      </Screen>
    );
  }

  const isOrganizer = viewerProfileId === eventResult.organizer.id;
  const questions = questionsFeed.results as EventQuestion[];

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText variant="h1" color={theme.colors.heading}>
          {eventResult.event.title}
        </AppText>
        <View style={styles.badgeRow}>
          <Badge label={eventResult.event.category} />
          <Badge label={`${eventResult.attendeeBreakdown.going} going`} tone="success" />
          <Badge label={`${eventResult.attendeeBreakdown.interested} interested`} tone="warning" />
          {eventResult.attendeeBreakdown.notGoing > 0 ? (
            <Badge label={`${eventResult.attendeeBreakdown.notGoing} not going`} />
          ) : null}
        </View>
      </View>

      {eventResult.event.coverImageUrl ? (
        <Image contentFit="cover" source={eventResult.event.coverImageUrl} style={styles.coverImage} />
      ) : null}

      {eventResult.media.length > 0 ? (
        <Card>
          <AppText variant="h3" color={theme.colors.heading}>
            Event photos
          </AppText>
          <View style={styles.mediaGrid}>
            {eventResult.media.map((mediaItem) => (
              <Image
                contentFit="cover"
                key={mediaItem.id}
                source={mediaItem.url}
                style={styles.mediaImage}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          About
        </AppText>
        <AppText>{eventResult.event.description}</AppText>
        {eventResult.event.impactSummary ? <AppText>{eventResult.event.impactSummary}</AppText> : null}
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Time & location
        </AppText>
        <AppText>{formatEventDateLabel(eventResult.event.startAt)}</AppText>
        <AppText>{formatEventWindow(eventResult.event.startAt, eventResult.event.endAt)}</AppText>
        <AppText>
          {eventResult.event.addressLine1}, {eventResult.event.city}, {eventResult.event.country}
        </AppText>
        <AppText>Timezone: {eventResult.event.timezone}</AppText>
        <Button label="Open in Maps" onPress={onOpenInMaps} variant="secondary" />
      </Card>

      <AppText variant="caption" color={theme.colors.muted} style={styles.sectionLabel}>
        Location map
      </AppText>
      <EventMap
        events={mapItem}
        onSelectEvent={() => undefined}
        selectedEventId={eventResult.event.id}
      />

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Organizer
        </AppText>
        <AppText>{eventResult.organizer.displayName}</AppText>
        {eventResult.organizer.city ? <AppText>{eventResult.organizer.city}</AppText> : null}
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          RSVP
        </AppText>
        <Button
          label={eventResult.viewerRsvp === "going" ? "Switch to Interested" : "Join This Event"}
          loading={rsvpBusy}
          onPress={onRsvp}
        />
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Attendees
        </AppText>
        <View style={styles.attendeeStats}>
          <Badge label={`${eventResult.attendeeBreakdown.total} total responses`} />
          <Badge label={`${eventResult.attendeeBreakdown.going} going`} tone="success" />
          <Badge
            label={`${eventResult.attendeeBreakdown.interested} interested`}
            tone="warning"
          />
          {eventResult.attendeeBreakdown.notGoing > 0 ? (
            <Badge label={`${eventResult.attendeeBreakdown.notGoing} not going`} />
          ) : null}
        </View>
        <View style={styles.attendeeList}>
          {attendeesFeed.status === "LoadingFirstPage" ? (
            <AppText>Loading attendee responses...</AppText>
          ) : attendeesFeed.results.length === 0 ? (
            <AppText>No attendee responses yet.</AppText>
          ) : (
            attendeesFeed.results.map((attendee) => (
              <View key={attendee.profile.id} style={styles.attendeeItem}>
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
                  label={getRsvpStatusLabel(attendee.status)}
                  tone={getRsvpStatusTone(attendee.status)}
                />
              </View>
            ))
          )}
        </View>
        {attendeesFeed.status === "CanLoadMore" || attendeesFeed.status === "LoadingMore" ? (
          <Button
            label={attendeesFeed.status === "LoadingMore" ? "Loading..." : "Load More Attendees"}
            loading={attendeesFeed.status === "LoadingMore"}
            onPress={() => attendeesFeed.loadMore(20)}
            variant="secondary"
          />
        ) : null}
      </Card>

      {isOrganizer ? (
        <Card>
          <AppText variant="h3" color={theme.colors.heading}>
            Send organizer update
          </AppText>
          <TextField
            label="Announcement"
            multiline
            onChangeText={setMessageBody}
            placeholder="Send details to everyone who signed up"
            value={messageBody}
          />
          {messageFeedback ? (
            <AppText
              color={
                messageFeedback.toLowerCase().includes("posted")
                  ? theme.colors.success
                  : theme.colors.danger
              }>
              {messageFeedback}
            </AppText>
          ) : null}
          <Button label="Send Update" loading={messageBusy} onPress={onSendMessage} />
        </Card>
      ) : null}

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Latest messages
        </AppText>
        <View style={styles.messageList}>
          {messagesFeed.results.map((message) => (
            <View key={message.id} style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <AppText variant="caption" color={theme.colors.heading}>
                  {message.author.displayName}
                </AppText>
                <Badge label={message.kind} />
              </View>
              <AppText>{message.body}</AppText>
            </View>
          ))}
          {messagesFeed.results.length === 0 ? (
            <AppText>
              {messagesFeed.status === "LoadingFirstPage"
                ? "Loading organizer updates..."
                : "No organizer updates posted yet."}
            </AppText>
          ) : null}
        </View>
        {messagesFeed.status === "CanLoadMore" || messagesFeed.status === "LoadingMore" ? (
          <Button
            label={messagesFeed.status === "LoadingMore" ? "Loading..." : "Load More Messages"}
            loading={messagesFeed.status === "LoadingMore"}
            onPress={() => messagesFeed.loadMore(20)}
            variant="secondary"
          />
        ) : null}
      </Card>

      <Card>
        <AppText variant="h3" color={theme.colors.heading}>
          Questions & answers
        </AppText>
        <View style={styles.questionList}>
          {questionsFeed.status === "LoadingFirstPage" && questions.length === 0 ? (
            <AppText>Loading event questions...</AppText>
          ) : questions.length === 0 ? (
            <AppText>No questions yet. Ask one from the Feed tab.</AppText>
          ) : (
            questions.map((question) => {
              const answerDraft = answerDraftByQuestionId[question.id] ?? "";
              const answerFeedback = answerFeedbackByQuestionId[question.id];
              const answerBusy = answerBusyQuestionId === question.id;
              const hasAnswer = Boolean(question.answer);

              return (
                <View key={question.id} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <AppText variant="caption" color={theme.colors.heading}>
                      {question.asker.displayName}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.muted}>
                      {formatRelativeTime(question.createdAt)}
                    </AppText>
                  </View>
                  <AppText>{question.questionBody}</AppText>

                  {hasAnswer ? (
                    <View style={styles.answerItem}>
                      <View style={styles.questionHeader}>
                        <AppText variant="caption" color={theme.colors.heading}>
                          {question.answer?.answeredBy.displayName}
                        </AppText>
                        <AppText variant="caption" color={theme.colors.muted}>
                          {formatRelativeTime(question.answer?.answeredAt ?? question.createdAt)}
                        </AppText>
                      </View>
                      <AppText>{question.answer?.body}</AppText>
                    </View>
                  ) : (
                    <AppText variant="caption" color={theme.colors.muted}>
                      Awaiting host response.
                    </AppText>
                  )}

                  {isOrganizer ? (
                    <View style={styles.answerComposer}>
                      <TextField
                        label={hasAnswer ? "Update host answer" : "Host answer"}
                        multiline
                        onChangeText={(next) =>
                          setAnswerDraftByQuestionId((current) => ({
                            ...current,
                            [question.id]: next,
                          }))
                        }
                        placeholder="Post a clear response for attendees"
                        value={answerDraft}
                      />
                      {answerFeedback ? (
                        <AppText
                          color={
                            answerFeedback.toLowerCase().includes("sent")
                              ? theme.colors.success
                              : theme.colors.danger
                          }>
                          {answerFeedback}
                        </AppText>
                      ) : null}
                      <Button
                        fullWidth={false}
                        label={hasAnswer ? "Update Answer" : "Send Answer"}
                        loading={answerBusy}
                        onPress={() => onAnswerQuestion(question.id)}
                        variant="secondary"
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
        {questionsFeed.status === "CanLoadMore" || questionsFeed.status === "LoadingMore" ? (
          <Button
            label={questionsFeed.status === "LoadingMore" ? "Loading..." : "Load More Questions"}
            loading={questionsFeed.status === "LoadingMore"}
            onPress={() => questionsFeed.loadMore(20)}
            variant="secondary"
          />
        ) : null}
      </Card>
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
  badgeRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  headerSection: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  coverImage: {
    borderRadius: theme.radius.xl,
    height: 252,
    width: "100%",
    ...theme.elevation.soft,
  },
  attendeeList: {
    gap: theme.spacing.xs,
  },
  attendeeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  attendeeItem: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  attendeeIdentity: {
    gap: 2,
  },
  messageList: {
    gap: theme.spacing.sm,
  },
  messageItem: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  messageHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  questionList: {
    gap: theme.spacing.sm,
  },
  questionItem: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  questionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  answerItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  answerComposer: {
    gap: theme.spacing.xs,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  mediaImage: {
    borderRadius: theme.radius.lg,
    height: 108,
    width: 108,
  },
  sectionLabel: {
    fontWeight: "600",
  },
});
