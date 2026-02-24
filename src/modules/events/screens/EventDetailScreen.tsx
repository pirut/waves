import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useRouter } from "expo-router";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { IconActionButton } from "@/src/core/ui/IconActionButton";
import { animateLayoutTransition } from "@/src/core/ui/layoutMotion";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import { UpdateActionBar } from "@/src/modules/events/components/UpdateActionBar";
import { EventMap } from "@/src/modules/events/components/EventMap";
import {
  RSVP_STATUS_OPTIONS,
  type EventFeedComment,
  getRsvpStatusLabel,
  getRsvpStatusTone,
  type EventListItem,
  type EventMessage,
  type EventQuestion,
  type RSVPStatus,
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

const RSVP_PANEL_HEIGHT = 228;

function getToneColor(status: RSVPStatus) {
  const tone = getRsvpStatusTone(status);

  if (tone === "success") {
    return theme.colors.success;
  }

  if (tone === "warning") {
    return theme.colors.warning;
  }

  return theme.colors.subtle;
}

function getInitials(displayName: string) {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

type EventMessageCardProps = {
  message: EventMessage;
  viewerProfileId: string | null;
  isEditingMessage: boolean;
  editingMessageBody: string;
  editingMessageBusy: boolean;
  isDeletingMessage: boolean;
  messageActionFeedback?: string;
  onStartEditingMessage: (messageId: string, body: string) => void;
  onCancelEditingMessage: () => void;
  onChangeEditingMessageBody: (next: string) => void;
  onSaveEditedMessage: () => void;
  onDeleteMessage: (messageId: string) => void;
};

function EventMessageCard({
  message,
  viewerProfileId,
  isEditingMessage,
  editingMessageBody,
  editingMessageBusy,
  isDeletingMessage,
  messageActionFeedback,
  onStartEditingMessage,
  onCancelEditingMessage,
  onChangeEditingMessageBody,
  onSaveEditedMessage,
  onDeleteMessage,
}: EventMessageCardProps) {
  const toggleLike = useMutation(api.feed.toggleLikeOnUpdate);
  const addComment = useMutation(api.feed.addCommentToUpdate);
  const editComment = useMutation(api.feed.editCommentOnUpdate);
  const deleteComment = useMutation(api.feed.deleteCommentOnUpdate);

  const [likeBusy, setLikeBusy] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [editingCommentBusy, setEditingCommentBusy] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentActionFeedbackById, setCommentActionFeedbackById] = useState<
    Record<string, string>
  >({});

  const commentsFeed = usePaginatedQuery(
    api.feed.listCommentsPaginated,
    commentsVisible
      ? {
          eventMessageId: message.id as Id<"eventMessages">,
        }
      : "skip",
    { initialNumItems: 8 },
  );

  const comments = commentsFeed.results as EventFeedComment[];
  const isMessageOwner = viewerProfileId === message.author.id;
  const commentCountLabel = `${message.commentCount} ${
    message.commentCount === 1 ? "comment" : "comments"
  }`;

  const onToggleLike = async () => {
    setLikeBusy(true);

    try {
      await toggleLike({
        eventMessageId: message.id as Id<"eventMessages">,
      });
    } finally {
      setLikeBusy(false);
    }
  };

  const onSubmitComment = async () => {
    if (!commentBody.trim()) {
      setCommentFeedback("Write a short comment before posting.");
      return;
    }

    setCommentBusy(true);
    setCommentFeedback(null);

    try {
      await addComment({
        eventMessageId: message.id as Id<"eventMessages">,
        body: commentBody,
      });

      setCommentBody("");
      animateLayoutTransition(170);
      setCommentsVisible(true);
      setCommentFeedback("Comment posted.");
    } catch (error) {
      setCommentFeedback(error instanceof Error ? error.message : "Unable to post comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const onStartEditingComment = (commentId: string, body: string) => {
    animateLayoutTransition();
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
    setCommentActionFeedbackById((current) => ({ ...current, [commentId]: "" }));
  };

  const onCancelEditingComment = () => {
    animateLayoutTransition();
    setEditingCommentId(null);
    setEditingCommentBody("");
  };

  const onSaveEditedComment = async () => {
    if (!editingCommentId) {
      return;
    }

    if (!editingCommentBody.trim()) {
      setCommentActionFeedbackById((current) => ({
        ...current,
        [editingCommentId]: "Comment body is required.",
      }));
      return;
    }

    setEditingCommentBusy(true);
    setCommentActionFeedbackById((current) => ({ ...current, [editingCommentId]: "" }));

    try {
      await editComment({
        commentId: editingCommentId as Id<"eventMessageComments">,
        body: editingCommentBody,
      });

      setCommentActionFeedbackById((current) => ({
        ...current,
        [editingCommentId]: "Comment updated.",
      }));
      setEditingCommentId(null);
      setEditingCommentBody("");
    } catch (error) {
      setCommentActionFeedbackById((current) => ({
        ...current,
        [editingCommentId]: error instanceof Error ? error.message : "Unable to update comment",
      }));
    } finally {
      setEditingCommentBusy(false);
    }
  };

  const onDeleteComment = (commentId: string) => {
    Alert.alert(
      "Delete comment?",
      "This comment will be removed permanently.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingCommentId(commentId);
              setCommentActionFeedbackById((current) => ({ ...current, [commentId]: "" }));

              try {
                await deleteComment({
                  commentId: commentId as Id<"eventMessageComments">,
                });
              } catch (error) {
                setCommentActionFeedbackById((current) => ({
                  ...current,
                  [commentId]:
                    error instanceof Error ? error.message : "Unable to delete comment",
                }));
              } finally {
                setDeletingCommentId((current) => (current === commentId ? null : current));
                setEditingCommentId((current) => (current === commentId ? null : current));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <View style={styles.messageAuthorMeta}>
          <AppText variant="caption" color={theme.colors.heading}>
            {message.author.displayName}
          </AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {formatRelativeTime(message.createdAt)}
          </AppText>
        </View>
        <Badge label={message.kind === "announcement" ? "Announcement" : "Update"} />
      </View>
      <View style={styles.messageDivider} />

      {isEditingMessage ? (
        <View style={styles.itemEditor}>
          <TextField
            label="Edit post"
            multiline
            onChangeText={onChangeEditingMessageBody}
            value={editingMessageBody}
          />
          <View style={styles.itemEditorActions}>
            <Button
              fullWidth={false}
              label="Cancel"
              onPress={onCancelEditingMessage}
              variant="ghost"
            />
            <Button
              fullWidth={false}
              label="Save"
              loading={editingMessageBusy}
              onPress={onSaveEditedMessage}
              variant="secondary"
            />
          </View>
        </View>
      ) : (
        <AppText>{message.body}</AppText>
      )}
      <View style={styles.postedMetaRow}>
        <Ionicons color={theme.colors.muted} name="time-outline" size={14} />
        <AppText color={theme.colors.muted} style={styles.postedMetaText} variant="caption">
          Posted {formatRelativeTime(message.createdAt)}
        </AppText>
      </View>

      {messageActionFeedback ? (
        <AppText
          color={
            messageActionFeedback.toLowerCase().includes("updated")
              ? theme.colors.success
              : theme.colors.danger
          }>
          {messageActionFeedback}
        </AppText>
      ) : null}

      {isMessageOwner && !isEditingMessage ? (
        <View style={styles.itemActionRow}>
          <IconActionButton
            accessibilityLabel="Edit this update"
            icon="create-outline"
            onPress={() => onStartEditingMessage(message.id, message.body)}
            tone="primary"
          />
          <IconActionButton
            accessibilityLabel="Delete this update"
            icon="trash-outline"
            loading={isDeletingMessage}
            onPress={() => onDeleteMessage(message.id)}
            tone="danger"
          />
        </View>
      ) : null}

      <UpdateActionBar
        items={[
          {
            key: "like",
            accessibilityLabel: `${message.viewerHasLiked ? "Unlike" : "Like"} update. ${message.likeCount} likes.`,
            active: message.viewerHasLiked,
            count: message.likeCount,
            icon: message.viewerHasLiked ? "heart" : "heart-outline",
            loading: likeBusy,
            onPress: onToggleLike,
          },
          {
            key: "comments",
            accessibilityLabel: `${commentsVisible ? "Hide comments" : "Show comments"}. ${message.commentCount} comments.`,
            active: commentsVisible,
            count: message.commentCount,
            icon: commentsVisible ? "chatbubble-ellipses" : "chatbubble-ellipses-outline",
            onPress: () => {
              animateLayoutTransition();
              setCommentsVisible((current) => !current);
            },
          },
        ]}
        style={styles.messageActionBar}
      />

      {commentsVisible ? (
        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <View style={styles.commentsSectionMeta}>
              <Ionicons color={theme.colors.primary} name="chatbubble-ellipses-outline" size={14} />
              <AppText color={theme.colors.muted} style={styles.commentsSectionTitle} variant="caption">
                {commentCountLabel}
              </AppText>
            </View>
          </View>

          {commentsFeed.status === "LoadingFirstPage" ? (
            <AppText>Loading comments...</AppText>
          ) : comments.length === 0 ? (
            <AppText>No comments yet. Be the first to respond.</AppText>
          ) : (
            comments.map((comment) => {
              const isCommentOwner = viewerProfileId === comment.author.id;
              const isEditingComment = editingCommentId === comment.id;
              const isDeletingComment = deletingCommentId === comment.id;
              const commentActionFeedback = commentActionFeedbackById[comment.id];

              return (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <AppText color={theme.colors.primary} style={styles.commentAvatarLabel} variant="caption">
                      {getInitials(comment.author.displayName)}
                    </AppText>
                  </View>
                  <View style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <AppText
                        color={theme.colors.heading}
                        numberOfLines={1}
                        style={styles.commentAuthorName}
                        variant="caption">
                        {comment.author.displayName}
                      </AppText>
                      <AppText color={theme.colors.muted} style={styles.commentTimeLabel} variant="caption">
                        {formatRelativeTime(comment.createdAt)}
                      </AppText>
                    </View>

                    {isEditingComment ? (
                      <View style={styles.itemEditor}>
                        <TextField
                          label="Edit comment"
                          multiline
                          onChangeText={setEditingCommentBody}
                          value={editingCommentBody}
                        />
                        <View style={styles.itemEditorActions}>
                          <Button
                            fullWidth={false}
                            label="Cancel"
                            onPress={onCancelEditingComment}
                            variant="ghost"
                          />
                          <Button
                            fullWidth={false}
                            label="Save"
                            loading={editingCommentBusy}
                            onPress={() => void onSaveEditedComment()}
                            variant="secondary"
                          />
                        </View>
                      </View>
                    ) : (
                      <AppText>{comment.body}</AppText>
                    )}

                    {commentActionFeedback ? (
                      <AppText
                        color={
                          commentActionFeedback.toLowerCase().includes("updated")
                            ? theme.colors.success
                            : theme.colors.danger
                        }>
                        {commentActionFeedback}
                      </AppText>
                    ) : null}

                    {isCommentOwner && !isEditingComment ? (
                      <View style={styles.itemActionRow}>
                        <IconActionButton
                          accessibilityLabel="Edit this comment"
                          icon="create-outline"
                          onPress={() => onStartEditingComment(comment.id, comment.body)}
                          tone="primary"
                        />
                        <IconActionButton
                          accessibilityLabel="Delete this comment"
                          icon="trash-outline"
                          loading={isDeletingComment}
                          onPress={() => onDeleteComment(comment.id)}
                          tone="danger"
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.sectionComposer}>
            <TextField
              label="Add a comment"
              onChangeText={setCommentBody}
              placeholder="Add a comment to this update"
              value={commentBody}
            />
            <View style={styles.sectionComposerButtonRow}>
              <Button
                fullWidth={false}
                label="Post comment"
                loading={commentBusy}
                onPress={onSubmitComment}
                variant="secondary"
              />
            </View>
            {commentFeedback ? (
              <AppText
                color={
                  commentFeedback.toLowerCase().includes("posted")
                    ? theme.colors.success
                    : theme.colors.danger
                }>
                {commentFeedback}
              </AppText>
            ) : null}
          </View>

          {commentsFeed.status === "CanLoadMore" || commentsFeed.status === "LoadingMore" ? (
            <Button
              fullWidth={false}
              label={commentsFeed.status === "LoadingMore" ? "Loading..." : "Load more comments"}
              loading={commentsFeed.status === "LoadingMore"}
              onPress={() => commentsFeed.loadMore(8)}
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function EventDetailScreen({ eventId }: Props) {
  const router = useRouter();
  const { viewerProfileId, viewerLoading } = useViewerProfile();
  const { width } = useWindowDimensions();
  const isWideLayout = (Platform.OS === "ios" && Platform.isPad) || width >= 1024;

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
  const editEventMessage = useMutation(api.events.editEventMessage);
  const deleteEventMessage = useMutation(api.events.deleteEventMessage);
  const answerEventQuestion = useMutation(api.events.answerEventQuestion);
  const editEventQuestion = useMutation(api.events.editEventQuestion);
  const deleteEventQuestion = useMutation(api.events.deleteEventQuestion);

  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpMenuOpen, setRsvpMenuOpen] = useState(false);
  const rsvpMenuProgress = useRef(new Animated.Value(0)).current;
  const [messageBody, setMessageBody] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageBody, setEditingMessageBody] = useState("");
  const [editingMessageBusy, setEditingMessageBusy] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [messageActionFeedbackById, setMessageActionFeedbackById] = useState<
    Record<string, string>
  >({});
  const [answerDraftByQuestionId, setAnswerDraftByQuestionId] = useState<Record<string, string>>(
    {},
  );
  const [answerBusyQuestionId, setAnswerBusyQuestionId] = useState<string | null>(null);
  const [editingAnswerQuestionId, setEditingAnswerQuestionId] = useState<string | null>(null);
  const [answerFeedbackByQuestionId, setAnswerFeedbackByQuestionId] = useState<
    Record<string, string>
  >({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionBody, setEditingQuestionBody] = useState("");
  const [editingQuestionBusy, setEditingQuestionBusy] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [questionActionFeedbackById, setQuestionActionFeedbackById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    Animated.timing(rsvpMenuProgress, {
      toValue: rsvpMenuOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [rsvpMenuOpen, rsvpMenuProgress]);

  useEffect(() => {
    if (rsvpBusy) {
      setRsvpMenuOpen(false);
    }
  }, [rsvpBusy]);

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

  const onOpenFullScreenMap = () => {
    if (!eventResult) {
      return;
    }

    router.push({
      pathname: "/discover-map",
      params: {
        category: eventResult.event.category,
        eventId: eventResult.event.id,
        focusLabel: `${eventResult.event.addressLine1}, ${eventResult.event.city}`,
        focusLatitude: `${eventResult.event.latitude}`,
        focusLongitude: `${eventResult.event.longitude}`,
        source: "event",
      },
    });
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

  const onRsvp = async (status: RSVPStatus) => {
    if (!viewerProfileId || !eventResult) {
      return;
    }

    if (eventResult.viewerRsvp === status) {
      setRsvpMenuOpen(false);
      return;
    }

    setRsvpBusy(true);
    setRsvpMenuOpen(false);

    try {
      await rsvpToEvent({
        eventId: eventResult.event.id,
        status,
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

  const onStartEditingMessage = (messageId: string, body: string) => {
    animateLayoutTransition();
    setEditingMessageId(messageId);
    setEditingMessageBody(body);
    setMessageActionFeedbackById((current) => ({ ...current, [messageId]: "" }));
  };

  const onCancelEditingMessage = () => {
    animateLayoutTransition();
    setEditingMessageId(null);
    setEditingMessageBody("");
  };

  const onSaveEditedMessage = async () => {
    if (!editingMessageId) {
      return;
    }

    if (!editingMessageBody.trim()) {
      setMessageActionFeedbackById((current) => ({
        ...current,
        [editingMessageId]: "Message body is required.",
      }));
      return;
    }

    setEditingMessageBusy(true);
    setMessageActionFeedbackById((current) => ({ ...current, [editingMessageId]: "" }));

    try {
      await editEventMessage({
        messageId: editingMessageId as Id<"eventMessages">,
        body: editingMessageBody,
      });

      setMessageActionFeedbackById((current) => ({
        ...current,
        [editingMessageId]: "Post updated.",
      }));
      animateLayoutTransition();
      setEditingMessageId(null);
      setEditingMessageBody("");
    } catch (error) {
      setMessageActionFeedbackById((current) => ({
        ...current,
        [editingMessageId]: error instanceof Error ? error.message : "Unable to update post",
      }));
    } finally {
      setEditingMessageBusy(false);
    }
  };

  const onDeleteMessage = (messageId: string) => {
    Alert.alert(
      "Delete post?",
      "This will remove the post and all likes/comments on it.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingMessageId(messageId);
              setMessageActionFeedbackById((current) => ({ ...current, [messageId]: "" }));
              try {
                await deleteEventMessage({
                  messageId: messageId as Id<"eventMessages">,
                });
              } catch (error) {
                setMessageActionFeedbackById((current) => ({
                  ...current,
                  [messageId]: error instanceof Error ? error.message : "Unable to delete post",
                }));
              } finally {
                setDeletingMessageId((current) => (current === messageId ? null : current));
                setEditingMessageId((current) => (current === messageId ? null : current));
              }
            })();
          },
        },
      ],
    );
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
      animateLayoutTransition();
      setEditingAnswerQuestionId(null);
    } catch (error) {
      setAnswerFeedbackByQuestionId((current) => ({
        ...current,
        [questionId]: error instanceof Error ? error.message : "Unable to send answer",
      }));
    } finally {
      setAnswerBusyQuestionId(null);
    }
  };

  const onStartEditingQuestion = (questionId: string, questionBody: string) => {
    animateLayoutTransition();
    setEditingQuestionId(questionId);
    setEditingQuestionBody(questionBody);
    setQuestionActionFeedbackById((current) => ({ ...current, [questionId]: "" }));
  };

  const onCancelEditingQuestion = () => {
    animateLayoutTransition();
    setEditingQuestionId(null);
    setEditingQuestionBody("");
  };

  const onSaveEditedQuestion = async () => {
    if (!editingQuestionId) {
      return;
    }

    if (!editingQuestionBody.trim()) {
      setQuestionActionFeedbackById((current) => ({
        ...current,
        [editingQuestionId]: "Question is required.",
      }));
      return;
    }

    setEditingQuestionBusy(true);
    setQuestionActionFeedbackById((current) => ({ ...current, [editingQuestionId]: "" }));

    try {
      await editEventQuestion({
        questionId: editingQuestionId as Id<"eventQuestions">,
        questionBody: editingQuestionBody,
      });

      setQuestionActionFeedbackById((current) => ({
        ...current,
        [editingQuestionId]: "Question updated.",
      }));
      animateLayoutTransition();
      setEditingQuestionId(null);
      setEditingQuestionBody("");
    } catch (error) {
      setQuestionActionFeedbackById((current) => ({
        ...current,
        [editingQuestionId]:
          error instanceof Error ? error.message : "Unable to update question",
      }));
    } finally {
      setEditingQuestionBusy(false);
    }
  };

  const onDeleteQuestion = (questionId: string) => {
    Alert.alert(
      "Delete question?",
      "This will remove the question and any host answer.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingQuestionId(questionId);
              setQuestionActionFeedbackById((current) => ({ ...current, [questionId]: "" }));
              try {
                await deleteEventQuestion({
                  questionId: questionId as Id<"eventQuestions">,
                });
              } catch (error) {
                setQuestionActionFeedbackById((current) => ({
                  ...current,
                  [questionId]:
                    error instanceof Error ? error.message : "Unable to delete question",
                }));
              } finally {
                setDeletingQuestionId((current) => (current === questionId ? null : current));
                setEditingQuestionId((current) => (current === questionId ? null : current));
                setEditingAnswerQuestionId((current) =>
                  current === questionId ? null : current,
                );
              }
            })();
          },
        },
      ],
    );
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
  const rsvpLabel = eventResult.viewerRsvp ? getRsvpStatusLabel(eventResult.viewerRsvp) : "RSVP";
  const menuMaxHeight = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RSVP_PANEL_HEIGHT],
  });
  const menuOpacity = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const menuTranslateY = rsvpMenuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  const summaryCard = (
    <Card style={styles.summaryCard}>
      {eventResult.event.coverImageUrl ? (
        <View style={styles.summaryCoverShell}>
          <Image contentFit="cover" source={eventResult.event.coverImageUrl} style={styles.summaryCoverImage} />
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Badge label={eventResult.event.category} />
        <Badge label={`${eventResult.attendeeBreakdown.going} going`} tone="success" />
        <Badge label={`${eventResult.attendeeBreakdown.interested} interested`} tone="warning" />
        {eventResult.attendeeBreakdown.notGoing > 0 ? (
          <Badge label={`${eventResult.attendeeBreakdown.notGoing} not going`} />
        ) : null}
      </View>

      <View style={styles.summaryHeaderBlock}>
        <AppText variant="h1" color={theme.colors.heading}>
          {eventResult.event.title}
        </AppText>
        {eventResult.event.impactSummary ? (
          <AppText color={theme.colors.body}>{eventResult.event.impactSummary}</AppText>
        ) : null}
      </View>

      <View style={styles.summaryInfoGrid}>
        <View style={styles.summaryInfoItem}>
          <MaterialIcons color={theme.colors.primary} name="event" size={18} />
          <View style={styles.summaryInfoText}>
            <AppText color={theme.colors.muted} variant="caption">
              Date
            </AppText>
            <AppText color={theme.colors.heading}>{formatEventDateLabel(eventResult.event.startAt)}</AppText>
            <AppText variant="caption">{formatEventWindow(eventResult.event.startAt, eventResult.event.endAt)}</AppText>
          </View>
        </View>
        <View style={styles.summaryInfoItem}>
          <MaterialIcons color={theme.colors.primary} name="place" size={18} />
          <View style={styles.summaryInfoText}>
            <AppText color={theme.colors.muted} variant="caption">
              Location
            </AppText>
            <AppText color={theme.colors.heading}>
              {eventResult.event.addressLine1}, {eventResult.event.city}
            </AppText>
            <AppText variant="caption">
              {eventResult.event.country} · {eventResult.event.timezone}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.summaryActionRow}>
        <View style={styles.summaryActionButton}>
          <Button label="Open in Maps" onPress={onOpenInMaps} variant="secondary" />
        </View>
        <View style={styles.summaryActionButton}>
          <Button
            disabled={rsvpBusy}
            label={`${rsvpLabel} ▾`}
            loading={rsvpBusy}
            onPress={() => setRsvpMenuOpen((current) => !current)}
          />
        </View>
      </View>

      <Animated.View
        pointerEvents={rsvpMenuOpen ? "auto" : "none"}
        style={[
          styles.rsvpMenuShell,
          {
            maxHeight: menuMaxHeight,
            opacity: menuOpacity,
            transform: [{ translateY: menuTranslateY }],
          },
        ]}>
        <View style={styles.rsvpMenu}>
          {RSVP_STATUS_OPTIONS.map((option) => {
            const active = eventResult.viewerRsvp === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => void onRsvp(option.value)}
                style={({ pressed }) => [
                  styles.rsvpOption,
                  active ? styles.rsvpOptionActive : undefined,
                  pressed ? styles.touchPressed : undefined,
                ]}>
                <View style={styles.rsvpOptionText}>
                  <View style={styles.rsvpOptionTitleRow}>
                    <View
                      style={[
                        styles.rsvpOptionDot,
                        { backgroundColor: getToneColor(option.value) },
                      ]}
                    />
                    <AppText
                      color={active ? theme.colors.primaryDeep : theme.colors.heading}
                      variant="caption"
                      style={styles.rsvpOptionTitle}>
                      {option.label}
                    </AppText>
                  </View>
                  <AppText
                    color={active ? theme.colors.primaryDeep : theme.colors.muted}
                    variant="caption">
                    {option.helper}
                  </AppText>
                </View>
                {active ? (
                  <MaterialIcons color={theme.colors.primary} name="check-circle" size={18} />
                ) : (
                  <MaterialIcons
                    color={theme.colors.subtle}
                    name="radio-button-unchecked"
                    size={18}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </Card>
  );

  const aboutCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        About this event
      </AppText>
      <AppText>{eventResult.event.description}</AppText>
    </Card>
  );

  const mediaCard =
    eventResult.media.length > 0 ? (
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
    ) : null;

  const organizerCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Organizer
      </AppText>
      <AppText color={theme.colors.heading}>{eventResult.organizer.displayName}</AppText>
      {eventResult.organizer.city ? <AppText>{eventResult.organizer.city}</AppText> : null}
    </Card>
  );

  const attendeesCard = (
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
  );

  const mapCard = (
    <Card>
      <AppText variant="h3" color={theme.colors.heading}>
        Location map
      </AppText>
      <View style={styles.mapShell}>
        <EventMap
          events={mapItem}
          followSelection
          markerLabelMode="detailed"
          onSelectEvent={() => undefined}
          selectedEventId={eventResult.event.id}
        />
      </View>
      <Button label="Open Full Screen Map" onPress={onOpenFullScreenMap} variant="secondary" />
    </Card>
  );

  const organizerUpdateComposer = isOrganizer ? (
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
  ) : null;

  const messagesCard = (
    <Card>
      <View style={styles.sectionHeadingBlock}>
        <View style={styles.sectionHeadingRow}>
          <Ionicons color={theme.colors.primary} name="newspaper-outline" size={16} />
          <AppText variant="h3" color={theme.colors.heading}>
            Latest messages
          </AppText>
        </View>
        <AppText color={theme.colors.muted} variant="caption">
          Like and comment on organizer updates.
        </AppText>
      </View>
      <View style={styles.messageList}>
        {(messagesFeed.results as EventMessage[]).map((message) => {
          const isEditingMessage = editingMessageId === message.id;
          const isDeletingMessage = deletingMessageId === message.id;
          const messageActionFeedback = messageActionFeedbackById[message.id];

          return (
            <EventMessageCard
              editingMessageBody={editingMessageBody}
              editingMessageBusy={editingMessageBusy}
              isDeletingMessage={isDeletingMessage}
              isEditingMessage={isEditingMessage}
              key={message.id}
              message={message}
              messageActionFeedback={messageActionFeedback}
              onCancelEditingMessage={onCancelEditingMessage}
              onChangeEditingMessageBody={setEditingMessageBody}
              onDeleteMessage={onDeleteMessage}
              onSaveEditedMessage={() => void onSaveEditedMessage()}
              onStartEditingMessage={onStartEditingMessage}
              viewerProfileId={viewerProfileId}
            />
          );
        })}
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
  );

  const questionsCard = (
    <Card>
      <View style={styles.sectionHeadingBlock}>
        <View style={styles.sectionHeadingRow}>
          <Ionicons color={theme.colors.primary} name="help-circle-outline" size={16} />
          <AppText variant="h3" color={theme.colors.heading}>
            Questions & answers
          </AppText>
        </View>
        <AppText color={theme.colors.muted} variant="caption">
          Community questions and host responses.
        </AppText>
      </View>
      <View style={styles.questionList}>
        {questionsFeed.status === "LoadingFirstPage" && questions.length === 0 ? (
          <AppText>Loading event questions...</AppText>
        ) : questions.length === 0 ? (
          <AppText>No questions yet. Ask one from the Feed tab.</AppText>
        ) : (
          questions.map((question) => {
            const hasAnswer = Boolean(question.answer);
            const isEditingAnswer = editingAnswerQuestionId === question.id;
            const answerDraft =
              answerDraftByQuestionId[question.id] ??
              (hasAnswer && isEditingAnswer ? question.answer?.body ?? "" : "");
            const answerFeedback = answerFeedbackByQuestionId[question.id];
            const answerBusy = answerBusyQuestionId === question.id;
            const isQuestionOwner = viewerProfileId === question.asker.id;
            const isEditingQuestion = editingQuestionId === question.id;
            const isDeletingQuestion = deletingQuestionId === question.id;
            const questionActionFeedback = questionActionFeedbackById[question.id];
            const shouldShowAnswerComposer = isOrganizer && (!hasAnswer || isEditingAnswer);

            return (
              <View key={question.id} style={styles.questionItem}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionAskerCluster}>
                    <View style={styles.questionAskerAvatar}>
                      <AppText color={theme.colors.primary} style={styles.questionAskerAvatarLabel} variant="caption">
                        {getInitials(question.asker.displayName)}
                      </AppText>
                    </View>
                    <AppText color={theme.colors.heading} style={styles.questionAskerName} variant="caption">
                      {question.asker.displayName}
                    </AppText>
                  </View>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {formatRelativeTime(question.createdAt)}
                  </AppText>
                </View>

                {isEditingQuestion ? (
                  <View style={styles.itemEditor}>
                    <TextField
                      label="Edit question"
                      multiline
                      onChangeText={setEditingQuestionBody}
                      value={editingQuestionBody}
                    />
                    <View style={styles.itemEditorActions}>
                      <Button
                        fullWidth={false}
                        label="Cancel"
                        onPress={onCancelEditingQuestion}
                        variant="ghost"
                      />
                      <Button
                        fullWidth={false}
                        label="Save"
                        loading={editingQuestionBusy}
                        onPress={() => void onSaveEditedQuestion()}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ) : (
                  <AppText>{question.questionBody}</AppText>
                )}

                {questionActionFeedback ? (
                  <AppText
                    color={
                      questionActionFeedback.toLowerCase().includes("updated")
                        ? theme.colors.success
                        : theme.colors.danger
                    }>
                    {questionActionFeedback}
                  </AppText>
                ) : null}

                {isQuestionOwner && !isEditingQuestion ? (
                  <View style={styles.itemActionRow}>
                    <IconActionButton
                      accessibilityLabel="Edit this question"
                      icon="create-outline"
                      onPress={() => onStartEditingQuestion(question.id, question.questionBody)}
                      tone="primary"
                    />
                    <IconActionButton
                      accessibilityLabel="Delete this question"
                      icon="trash-outline"
                      loading={isDeletingQuestion}
                      onPress={() => onDeleteQuestion(question.id)}
                      tone="danger"
                    />
                  </View>
                ) : null}

                {hasAnswer ? (
                  <View style={styles.answerItem}>
                    <View style={styles.questionHeader}>
                      <AppText variant="caption" color={theme.colors.heading}>
                        {question.answer?.answeredBy.displayName}
                      </AppText>
                      <View style={styles.answerHeaderActions}>
                        <AppText variant="caption" color={theme.colors.muted}>
                          {formatRelativeTime(question.answer?.answeredAt ?? question.createdAt)}
                        </AppText>
                        {isOrganizer && !isEditingAnswer ? (
                          <IconActionButton
                            accessibilityLabel="Edit host answer"
                            icon="create-outline"
                            onPress={() => {
                              animateLayoutTransition();
                              setEditingAnswerQuestionId(question.id);
                              setAnswerDraftByQuestionId((current) => ({
                                ...current,
                                [question.id]: question.answer?.body ?? "",
                              }));
                              setAnswerFeedbackByQuestionId((current) => ({
                                ...current,
                                [question.id]: "",
                              }));
                            }}
                            tone="primary"
                          />
                        ) : null}
                      </View>
                    </View>
                    <AppText>{question.answer?.body}</AppText>
                  </View>
                ) : (
                  <View style={styles.answerPending}>
                    <Ionicons color={theme.colors.muted} name="time-outline" size={14} />
                    <AppText variant="caption" color={theme.colors.muted}>
                      Awaiting host response.
                    </AppText>
                  </View>
                )}

                {shouldShowAnswerComposer ? (
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
                    <View style={styles.answerComposerActions}>
                      {hasAnswer ? (
                        <Button
                          fullWidth={false}
                          label="Cancel"
                          onPress={() => {
                            animateLayoutTransition();
                            setEditingAnswerQuestionId(null);
                            setAnswerDraftByQuestionId((current) => ({
                              ...current,
                              [question.id]: "",
                            }));
                          }}
                          variant="ghost"
                        />
                      ) : null}
                      <Button
                        fullWidth={false}
                        label={hasAnswer ? "Update Answer" : "Send Answer"}
                        loading={answerBusy}
                        onPress={() => onAnswerQuestion(question.id)}
                        variant="secondary"
                      />
                    </View>
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
  );

  return (
    <Screen>
      <View style={styles.headerSection}>
        <Card style={styles.pageContextCard}>
          <View style={styles.pageContextRow}>
            <View style={styles.pageContextIcon}>
              <Ionicons color={theme.colors.primary} name="compass-outline" size={20} />
            </View>
            <View style={styles.pageContextCopy}>
              <AppText color={theme.colors.heading} style={styles.pageContextTitle} variant="h3">
                Event details
              </AppText>
              <AppText color={theme.colors.body}>
                Event summary, attendee updates, and organizer Q&A.
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      {summaryCard}

      {isWideLayout ? (
        <View style={styles.detailColumns}>
          <View style={styles.detailPrimaryColumn}>
            {aboutCard}
            {mediaCard}
            {mapCard}
            {organizerUpdateComposer}
            {messagesCard}
            {questionsCard}
          </View>
          <View style={styles.detailSecondaryColumn}>
            {organizerCard}
            {attendeesCard}
          </View>
        </View>
      ) : (
        <>
          {aboutCard}
          {mediaCard}
          {organizerCard}
          {attendeesCard}
          {mapCard}
          {organizerUpdateComposer}
          {messagesCard}
          {questionsCard}
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
  headerSection: {
    gap: theme.spacing.xs,
  },
  pageContextCard: {
    borderColor: theme.colors.borderStrong,
  },
  pageContextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  pageContextIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.sky,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: theme.control.minTouchSize,
    justifyContent: "center",
    width: theme.control.minTouchSize,
  },
  pageContextCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  pageContextTitle: {
    letterSpacing: -0.2,
  },
  summaryCard: {
    gap: theme.spacing.sm,
  },
  summaryCoverShell: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  summaryCoverImage: {
    height: 220,
    width: "100%",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  summaryHeaderBlock: {
    gap: theme.spacing.xs,
  },
  summaryInfoGrid: {
    gap: theme.spacing.xs,
  },
  summaryInfoItem: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  summaryInfoText: {
    flex: 1,
    gap: 1,
  },
  summaryActionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  summaryActionButton: {
    flex: 1,
  },
  detailColumns: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  detailPrimaryColumn: {
    flex: 1.18,
    gap: theme.spacing.lg,
    minWidth: 0,
  },
  detailSecondaryColumn: {
    flex: 1,
    gap: theme.spacing.lg,
    minWidth: 0,
  },
  mapShell: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
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
  rsvpMenuShell: {
    overflow: "hidden",
  },
  rsvpMenu: {
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    padding: 6,
  },
  rsvpOption: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  rsvpOptionActive: {
    backgroundColor: theme.colors.sky,
    borderColor: theme.colors.primary,
  },
  rsvpOptionText: {
    flex: 1,
    gap: 2,
  },
  rsvpOptionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  rsvpOptionDot: {
    borderRadius: theme.radius.pill,
    height: 8,
    width: 8,
  },
  rsvpOptionTitle: {
    fontWeight: "700",
  },
  messageList: {
    gap: theme.spacing.sm,
  },
  messageItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  messageAuthorMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  itemActionRow: {
    alignItems: "center",
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 2,
  },
  itemEditor: {
    gap: theme.spacing.xs,
  },
  itemEditorActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "flex-end",
  },
  messageHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "space-between",
  },
  messageDivider: {
    backgroundColor: theme.colors.border,
    height: StyleSheet.hairlineWidth,
  },
  postedMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  postedMetaText: {
    fontWeight: "500",
  },
  messageActionBar: {
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    marginBottom: -theme.spacing.md,
    marginHorizontal: -theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  commentsSection: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  commentsSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commentsSectionMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  commentsSectionTitle: {
    fontWeight: "600",
  },
  commentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  commentAvatar: {
    alignItems: "center",
    backgroundColor: theme.colors.sky,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: "center",
    marginTop: 4,
    width: 28,
  },
  commentAvatarLabel: {
    fontWeight: "700",
  },
  commentItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "space-between",
  },
  commentAuthorName: {
    flex: 1,
  },
  commentTimeLabel: {
    flexShrink: 0,
  },
  sectionComposer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  sectionComposerButtonRow: {
    alignItems: "flex-end",
  },
  questionList: {
    gap: theme.spacing.sm,
  },
  sectionHeadingBlock: {
    gap: 4,
  },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
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
    gap: theme.spacing.xs,
    justifyContent: "space-between",
  },
  questionAskerCluster: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  questionAskerAvatar: {
    alignItems: "center",
    backgroundColor: theme.colors.sky,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  questionAskerAvatarLabel: {
    fontWeight: "700",
  },
  questionAskerName: {
    flex: 1,
  },
  answerItem: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 3,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  answerPending: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: theme.spacing.sm,
  },
  answerHeaderActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  answerComposer: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  answerComposerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "flex-end",
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
  touchPressed: {
    opacity: 0.82,
  },
});
