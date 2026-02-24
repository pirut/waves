import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, usePaginatedQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { theme } from "@/src/core/theme/tokens";
import { AppText } from "@/src/core/ui/AppText";
import { Badge } from "@/src/core/ui/Badge";
import { Button } from "@/src/core/ui/Button";
import { Card } from "@/src/core/ui/Card";
import { Screen } from "@/src/core/ui/Screen";
import { TextField } from "@/src/core/ui/TextField";
import type { EventFeedComment, EventFeedUpdate } from "@/src/modules/events/domain/types";
import { useViewerProfile } from "@/src/modules/events/hooks/useViewerProfile";
import {
  formatDateTimeWithClock,
  formatEventDateLabel,
  formatRelativeTime,
} from "@/src/modules/events/utils/formatters";

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

type FeedActionChipProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
  accessibilityLabel: string;
};

function FeedActionChip({
  label,
  icon,
  onPress,
  active = false,
  loading = false,
  accessibilityLabel,
}: FeedActionChipProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading, selected: active }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        active ? styles.actionChipActive : undefined,
        pressed ? styles.touchPressed : undefined,
      ]}>
      {loading ? (
        <ActivityIndicator color={active ? theme.colors.primaryText : theme.colors.primary} size="small" />
      ) : (
        <Ionicons
          color={active ? theme.colors.primaryText : theme.colors.primary}
          name={icon}
          size={16}
        />
      )}
      <AppText
        color={active ? theme.colors.primaryText : theme.colors.heading}
        numberOfLines={1}
        style={styles.actionChipLabel}
        variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

function FeedUpdateCard({
  update,
  onOpenEvent,
}: {
  update: EventFeedUpdate;
  onOpenEvent: (eventId: string) => void;
}) {
  const toggleLike = useMutation(api.feed.toggleLikeOnUpdate);
  const addComment = useMutation(api.feed.addCommentToUpdate);
  const askQuestionForEvent = useMutation(api.events.askQuestionForEvent);

  const [likeBusy, setLikeBusy] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);

  const [questionBody, setQuestionBody] = useState("");
  const [questionBusy, setQuestionBusy] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [questionComposerVisible, setQuestionComposerVisible] = useState(false);

  const commentsFeed = usePaginatedQuery(
    api.feed.listCommentsPaginated,
    commentsVisible
      ? {
          eventMessageId: update.id as Id<"eventMessages">,
        }
      : "skip",
    { initialNumItems: 8 },
  );

  const comments = commentsFeed.results as EventFeedComment[];

  const onToggleLike = async () => {
    setLikeBusy(true);

    try {
      await toggleLike({
        eventMessageId: update.id as Id<"eventMessages">,
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
        eventMessageId: update.id as Id<"eventMessages">,
        body: commentBody,
      });

      setCommentBody("");
      setCommentsVisible(true);
      setCommentFeedback("Comment posted.");
    } catch (error) {
      setCommentFeedback(error instanceof Error ? error.message : "Unable to post comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const onSubmitQuestion = async () => {
    if (!questionBody.trim()) {
      setQuestionFeedback("Write your question before posting.");
      return;
    }

    setQuestionBusy(true);
    setQuestionFeedback(null);

    try {
      await askQuestionForEvent({
        eventId: update.eventId as Id<"events">,
        questionBody,
      });

      setQuestionBody("");
      setQuestionFeedback("Question sent to the event host.");
    } catch (error) {
      setQuestionFeedback(error instanceof Error ? error.message : "Unable to send question");
    } finally {
      setQuestionBusy(false);
    }
  };

  const commentCountLabel = `${update.commentCount} ${
    update.commentCount === 1 ? "comment" : "comments"
  }`;
  const authorInitials = getInitials(update.author.displayName);

  return (
    <Card innerStyle={styles.updateCardInner} style={styles.updateCard}>
      <View style={styles.updateTopRow}>
        <View style={styles.datePill}>
          <Ionicons color={theme.colors.primary} name="calendar-outline" size={14} />
          <AppText color={theme.colors.heading} style={styles.datePillText} variant="caption">
            {formatEventDateLabel(update.eventStartAt)}
          </AppText>
        </View>
        <Badge label={update.kind === "announcement" ? "Announcement" : "Update"} />
      </View>

      <Pressable
        accessibilityLabel={`Open ${update.eventTitle}`}
        accessibilityRole="button"
        onPress={() => onOpenEvent(update.eventId)}
        style={({ pressed }) => [styles.titleButton, pressed ? styles.touchPressed : undefined]}>
        <AppText color={theme.colors.heading} numberOfLines={2} variant="h3">
          {update.eventTitle}
        </AppText>
      </Pressable>

      <View style={styles.bylineRow}>
        <View style={styles.authorCluster}>
          <View style={styles.authorAvatar}>
            <AppText color={theme.colors.primary} style={styles.authorAvatarLabel} variant="caption">
              {authorInitials}
            </AppText>
          </View>
          <View style={styles.authorMeta}>
            <AppText color={theme.colors.heading} numberOfLines={1} variant="caption">
              {update.author.displayName}
            </AppText>
            <AppText color={theme.colors.muted} variant="caption">
              {formatRelativeTime(update.createdAt)}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityLabel={`Open ${update.eventTitle}`}
          accessibilityRole="button"
          onPress={() => onOpenEvent(update.eventId)}
          style={({ pressed }) => [styles.openEventButton, pressed ? styles.touchPressed : undefined]}>
          <AppText color={theme.colors.primary} style={styles.openEventLabel} variant="caption">
            Open event
          </AppText>
          <Ionicons color={theme.colors.primary} name="chevron-forward" size={16} />
        </Pressable>
      </View>

      <AppText color={theme.colors.heading} style={styles.updateBody}>
        {update.body}
      </AppText>

      <AppText color={theme.colors.muted} variant="caption">
        Posted {formatDateTimeWithClock(update.createdAt)}
      </AppText>

      {commentsVisible ? (
        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <AppText color={theme.colors.muted} style={styles.commentsSectionTitle} variant="caption">
              {commentCountLabel}
            </AppText>
          </View>

          {commentsFeed.status === "LoadingFirstPage" ? (
            <AppText>Loading comments...</AppText>
          ) : comments.length === 0 ? (
            <AppText>No comments yet. Ask the first question.</AppText>
          ) : (
            comments.map((comment) => (
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
                  <AppText>{comment.body}</AppText>
                </View>
              </View>
            ))
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

      {questionComposerVisible ? (
        <View style={styles.questionSection}>
          <AppText color={theme.colors.heading} style={styles.questionSectionTitle} variant="caption">
            Ask the event host a question
          </AppText>
          <TextField
            label="Question"
            onChangeText={setQuestionBody}
            placeholder="Ask something attendees need clarified"
            value={questionBody}
          />
          <View style={styles.sectionComposerButtonRow}>
            <Button
              fullWidth={false}
              label="Send question"
              loading={questionBusy}
              onPress={onSubmitQuestion}
              variant="secondary"
            />
          </View>
          {questionFeedback ? (
            <AppText
              color={
                questionFeedback.toLowerCase().includes("sent")
                  ? theme.colors.success
                  : theme.colors.danger
              }>
              {questionFeedback}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <FeedActionChip
          accessibilityLabel={`${update.viewerHasLiked ? "Unlike" : "Like"} update`}
          active={update.viewerHasLiked}
          icon={update.viewerHasLiked ? "heart" : "heart-outline"}
          label={`Like (${update.likeCount})`}
          loading={likeBusy}
          onPress={onToggleLike}
        />
        <FeedActionChip
          accessibilityLabel={commentsVisible ? "Hide comments" : "Show comments"}
          active={commentsVisible}
          icon={commentsVisible ? "chatbubble" : "chatbubble-outline"}
          label={`Comments (${update.commentCount})`}
          onPress={() => setCommentsVisible((current) => !current)}
        />
        <FeedActionChip
          accessibilityLabel={questionComposerVisible ? "Hide question form" : "Ask a question"}
          active={questionComposerVisible}
          icon={questionComposerVisible ? "help-circle" : "help-circle-outline"}
          label="Ask a question"
          onPress={() => setQuestionComposerVisible((current) => !current)}
        />
      </View>
    </Card>
  );
}

export function FeedScreen() {
  const router = useRouter();
  const { viewerProfileId, viewerLoading, viewerError } = useViewerProfile();

  const feed = usePaginatedQuery(
    api.feed.listUpdatesPaginated,
    viewerProfileId ? {} : "skip",
    { initialNumItems: 12 },
  );

  const updates = feed.results as EventFeedUpdate[];

  if (
    viewerLoading ||
    (viewerProfileId !== null &&
      (feed.status === "LoadingFirstPage" || feed.status === "LoadingMore") &&
      updates.length === 0)
  ) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText>Loading your event update feed...</AppText>
        </View>
      </Screen>
    );
  }

  if (viewerError) {
    return (
      <Screen scroll={false}>
        <View style={styles.centeredState}>
          <AppText color={theme.colors.danger} variant="h2">
            Feed unavailable
          </AppText>
          <AppText>{viewerError}</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerSection}>
        <AppText color={theme.colors.heading} variant="h2">
          Feed
        </AppText>
        <AppText color={theme.colors.body}>
          See every organizer update from your events and ask clarifying questions in one place.
        </AppText>
      </View>

      {updates.length === 0 ? (
        <Card>
          <AppText color={theme.colors.heading} variant="h3">
            No updates yet
          </AppText>
          <AppText>When organizers post updates, they will appear here.</AppText>
        </Card>
      ) : (
        updates.map((update) => (
          <FeedUpdateCard
            key={update.id}
            onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
            update={update}
          />
        ))
      )}

      {feed.status === "CanLoadMore" || feed.status === "LoadingMore" ? (
        <Button
          label={feed.status === "LoadingMore" ? "Loading..." : "Load More Updates"}
          loading={feed.status === "LoadingMore"}
          onPress={() => feed.loadMore(12)}
          variant="secondary"
        />
      ) : null}
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
    gap: 6,
  },
  updateCard: {
    borderColor: theme.colors.borderStrong,
  },
  updateCardInner: {
    gap: theme.spacing.sm,
  },
  updateTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
  datePill: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  datePillText: {
    fontWeight: "600",
  },
  titleButton: {
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
  },
  bylineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    minWidth: 0,
  },
  authorCluster: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  authorAvatar: {
    alignItems: "center",
    backgroundColor: theme.colors.sky,
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  authorAvatarLabel: {
    fontWeight: "700",
  },
  authorMeta: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  openEventButton: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 4,
    minHeight: theme.control.minTouchSize,
    paddingHorizontal: theme.spacing.xs,
  },
  openEventLabel: {
    fontWeight: "600",
  },
  updateBody: {
    color: theme.colors.heading,
  },
  commentsSection: {
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
    backgroundColor: theme.colors.elevatedMuted,
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
  questionSection: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  questionSectionTitle: {
    fontWeight: "600",
  },
  sectionComposerButtonRow: {
    alignItems: "flex-end",
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  actionChip: {
    alignItems: "center",
    backgroundColor: theme.colors.elevatedMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: theme.control.minTouchSize,
    minWidth: 0,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 8,
  },
  actionChipActive: {
    backgroundColor: theme.colors.primaryDeep,
    borderColor: theme.colors.primaryDeep,
  },
  actionChipLabel: {
    fontWeight: "600",
  },
  touchPressed: {
    opacity: 0.72,
  },
});
