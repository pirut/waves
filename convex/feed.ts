import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAuthProfile } from "./lib/auth";

const messageKindValidator = v.union(v.literal("announcement"), v.literal("update"));

const profilePreviewValidator = v.object({
  id: v.id("profiles"),
  displayName: v.string(),
  avatarUrl: v.optional(v.string()),
  city: v.optional(v.string()),
});

const feedUpdateValidator = v.object({
  id: v.id("eventMessages"),
  eventId: v.id("events"),
  eventTitle: v.string(),
  eventSlug: v.string(),
  eventStartAt: v.number(),
  body: v.string(),
  kind: messageKindValidator,
  createdAt: v.number(),
  author: profilePreviewValidator,
  likeCount: v.number(),
  commentCount: v.number(),
  viewerHasLiked: v.boolean(),
});

const feedCommentValidator = v.object({
  id: v.id("eventMessageComments"),
  eventMessageId: v.id("eventMessages"),
  body: v.string(),
  createdAt: v.number(),
  author: profilePreviewValidator,
});

const paginatedFeedUpdatesValidator = v.object({
  page: v.array(feedUpdateValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

const paginatedFeedCommentsValidator = v.object({
  page: v.array(feedCommentValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

function toProfilePreview(profile: Doc<"profiles">) {
  return {
    id: profile._id,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.city ? { city: profile.city } : {}),
  };
}

type DbContext = QueryCtx | MutationCtx;

async function resolveAccessibleEventIds(
  ctx: DbContext,
  viewerProfileId: Id<"profiles">,
): Promise<Set<Id<"events">>> {
  const hostedEvents = await ctx.db
    .query("events")
    .withIndex("by_organizerProfileId_and_startAt", (q) =>
      q.eq("organizerProfileId", viewerProfileId),
    )
    .order("desc")
    .take(200);

  const rsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_attendeeProfileId_and_createdAt", (q) =>
      q.eq("attendeeProfileId", viewerProfileId),
    )
    .order("desc")
    .take(600);

  const accessibleEventIds = new Set<Id<"events">>();

  for (const hosted of hostedEvents) {
    accessibleEventIds.add(hosted._id);
  }

  for (const rsvp of rsvps) {
    if (rsvp.status !== "not_going") {
      accessibleEventIds.add(rsvp.eventId);
    }
  }

  return accessibleEventIds;
}

async function assertViewerCanAccessEventMessage(
  ctx: DbContext,
  eventMessageId: Id<"eventMessages">,
  viewerProfileId: Id<"profiles">,
) {
  const messageDoc = await ctx.db.get(eventMessageId);
  if (!messageDoc) {
    throw new ConvexError({
      code: "UPDATE_NOT_FOUND",
      message: "Update not found.",
    });
  }

  const eventDoc = await ctx.db.get(messageDoc.eventId);
  if (!eventDoc) {
    throw new ConvexError({
      code: "EVENT_NOT_FOUND",
      message: "Event not found.",
    });
  }

  if (eventDoc.organizerProfileId === viewerProfileId) {
    return messageDoc;
  }

  const viewerRsvp = await ctx.db
    .query("rsvps")
    .withIndex("by_eventId_and_attendeeProfileId", (q) =>
      q.eq("eventId", eventDoc._id).eq("attendeeProfileId", viewerProfileId),
    )
    .unique();

  if (!viewerRsvp || viewerRsvp.status === "not_going") {
    throw new ConvexError({
      code: "NOT_AUTHORIZED_FOR_EVENT",
      message: "You can only engage with updates for events you are attending.",
    });
  }

  return messageDoc;
}

export const listUpdatesPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedFeedUpdatesValidator,
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    const accessibleEventIds = await resolveAccessibleEventIds(ctx, viewerProfile._id);

    if (accessibleEventIds.size === 0) {
      return {
        page: [],
        isDone: true,
        continueCursor: typeof args.paginationOpts.cursor === "string" ? args.paginationOpts.cursor : "",
      };
    }

    const paginatedMessages = await ctx.db
      .query("eventMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .paginate(args.paginationOpts);

    const feedUpdates = (
      await Promise.all(
        paginatedMessages.page.map(async (messageDoc) => {
          if (!accessibleEventIds.has(messageDoc.eventId)) {
            return null;
          }

          const [eventDoc, authorDoc, viewerLike] = await Promise.all([
            ctx.db.get(messageDoc.eventId),
            ctx.db.get(messageDoc.authorProfileId),
            ctx.db
              .query("eventMessageLikes")
              .withIndex("by_eventMessageId_and_likerProfileId", (q) =>
                q
                  .eq("eventMessageId", messageDoc._id)
                  .eq("likerProfileId", viewerProfile._id),
              )
              .unique(),
          ]);

          if (!eventDoc || !authorDoc) {
            return null;
          }

          return {
            id: messageDoc._id,
            eventId: eventDoc._id,
            eventTitle: eventDoc.title,
            eventSlug: eventDoc.slug,
            eventStartAt: eventDoc.startAt,
            body: messageDoc.body,
            kind: messageDoc.kind,
            createdAt: messageDoc.createdAt,
            author: toProfilePreview(authorDoc),
            likeCount: messageDoc.likeCount ?? 0,
            commentCount: messageDoc.commentCount ?? 0,
            viewerHasLiked: viewerLike !== null,
          };
        }),
      )
    ).filter((update): update is NonNullable<typeof update> => update !== null);

    return {
      page: feedUpdates,
      isDone: paginatedMessages.isDone,
      continueCursor: paginatedMessages.continueCursor,
    };
  },
});

export const listCommentsPaginated = query({
  args: {
    eventMessageId: v.id("eventMessages"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedFeedCommentsValidator,
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    await assertViewerCanAccessEventMessage(ctx, args.eventMessageId, viewerProfile._id);

    const paginatedComments = await ctx.db
      .query("eventMessageComments")
      .withIndex("by_eventMessageId_and_createdAt", (q) =>
        q.eq("eventMessageId", args.eventMessageId),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    const comments = (
      await Promise.all(
        paginatedComments.page.map(async (commentDoc) => {
          const authorDoc = await ctx.db.get(commentDoc.authorProfileId);
          if (!authorDoc) {
            return null;
          }

          return {
            id: commentDoc._id,
            eventMessageId: commentDoc.eventMessageId,
            body: commentDoc.body,
            createdAt: commentDoc.createdAt,
            author: toProfilePreview(authorDoc),
          };
        }),
      )
    ).filter((comment): comment is NonNullable<typeof comment> => comment !== null);

    return {
      page: comments,
      isDone: paginatedComments.isDone,
      continueCursor: paginatedComments.continueCursor,
    };
  },
});

export const toggleLikeOnUpdate = mutation({
  args: {
    eventMessageId: v.id("eventMessages"),
  },
  returns: v.object({
    liked: v.boolean(),
    likeCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    const messageDoc = await assertViewerCanAccessEventMessage(
      ctx,
      args.eventMessageId,
      viewerProfile._id,
    );

    const existingLike = await ctx.db
      .query("eventMessageLikes")
      .withIndex("by_eventMessageId_and_likerProfileId", (q) =>
        q.eq("eventMessageId", messageDoc._id).eq("likerProfileId", viewerProfile._id),
      )
      .unique();

    const currentLikeCount = messageDoc.likeCount ?? 0;

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      const nextLikeCount = Math.max(0, currentLikeCount - 1);
      await ctx.db.patch(messageDoc._id, { likeCount: nextLikeCount });

      return {
        liked: false,
        likeCount: nextLikeCount,
      };
    }

    await ctx.db.insert("eventMessageLikes", {
      eventId: messageDoc.eventId,
      eventMessageId: messageDoc._id,
      likerProfileId: viewerProfile._id,
      createdAt: Date.now(),
    });

    const nextLikeCount = currentLikeCount + 1;
    await ctx.db.patch(messageDoc._id, { likeCount: nextLikeCount });

    return {
      liked: true,
      likeCount: nextLikeCount,
    };
  },
});

export const addCommentToUpdate = mutation({
  args: {
    eventMessageId: v.id("eventMessages"),
    body: v.string(),
  },
  returns: v.id("eventMessageComments"),
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    const messageDoc = await assertViewerCanAccessEventMessage(
      ctx,
      args.eventMessageId,
      viewerProfile._id,
    );

    const trimmedBody = args.body.trim();
    if (!trimmedBody) {
      throw new ConvexError({
        code: "EMPTY_COMMENT",
        message: "Comment body is required.",
      });
    }

    if (trimmedBody.length > 800) {
      throw new ConvexError({
        code: "COMMENT_TOO_LONG",
        message: "Comment is too long. Keep it to 800 characters or less.",
      });
    }

    const commentId = await ctx.db.insert("eventMessageComments", {
      eventId: messageDoc.eventId,
      eventMessageId: messageDoc._id,
      authorProfileId: viewerProfile._id,
      body: trimmedBody,
      createdAt: Date.now(),
    });

    await ctx.db.patch(messageDoc._id, {
      commentCount: (messageDoc.commentCount ?? 0) + 1,
    });

    return commentId;
  },
});
