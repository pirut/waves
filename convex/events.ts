import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAuthenticatedIdentity, requireAuthProfile } from "./lib/auth";

const rsvpStatusValidator = v.union(v.literal("going"), v.literal("interested"));
const messageKindValidator = v.union(v.literal("announcement"), v.literal("update"));

const profilePreviewValidator = v.object({
  id: v.id("profiles"),
  displayName: v.string(),
  avatarUrl: v.optional(v.string()),
  city: v.optional(v.string()),
});

const eventListItemValidator = v.object({
  id: v.id("events"),
  slug: v.string(),
  title: v.string(),
  category: v.string(),
  startAt: v.number(),
  endAt: v.number(),
  city: v.string(),
  country: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  coverImageUrl: v.optional(v.string()),
  impactSummary: v.optional(v.string()),
  attendeeCount: v.number(),
  organizer: profilePreviewValidator,
  viewerRsvp: v.optional(rsvpStatusValidator),
});

const eventMediaValidator = v.object({
  id: v.id("eventMedia"),
  url: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  caption: v.optional(v.string()),
  sortOrder: v.number(),
});

const eventAttendeeValidator = v.object({
  profile: profilePreviewValidator,
  status: rsvpStatusValidator,
  respondedAt: v.number(),
});

const eventMessageValidator = v.object({
  id: v.id("eventMessages"),
  body: v.string(),
  kind: messageKindValidator,
  createdAt: v.number(),
  author: profilePreviewValidator,
});

const eventDetailValidator = v.object({
  event: v.object({
    id: v.id("events"),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    addressLine1: v.string(),
    city: v.string(),
    region: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    impactSummary: v.optional(v.string()),
    capacity: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published")),
    attendeeCount: v.number(),
  }),
  organizer: profilePreviewValidator,
  viewerRsvp: v.optional(rsvpStatusValidator),
  attendeeBreakdown: v.object({
    going: v.number(),
    interested: v.number(),
    total: v.number(),
  }),
  attendees: v.array(eventAttendeeValidator),
  media: v.array(eventMediaValidator),
  messages: v.array(eventMessageValidator),
});

const paginatedEventAttendeesValidator = v.object({
  page: v.array(eventAttendeeValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

const paginatedEventMessagesValidator = v.object({
  page: v.array(eventMessageValidator),
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

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

async function resolveStorageUrl(
  ctx: QueryCtx | MutationCtx,
  storageId?: Id<"_storage">,
) {
  if (!storageId) {
    return undefined;
  }

  const resolvedUrl = await ctx.storage.getUrl(storageId);
  return resolvedUrl ?? undefined;
}

async function getViewerRsvpStatus(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
  viewerProfileId: Id<"profiles">,
) {
  const viewerRsvp = await ctx.db
    .query("rsvps")
    .withIndex("by_eventId_and_attendeeProfileId", (q) =>
      q.eq("eventId", eventId).eq("attendeeProfileId", viewerProfileId),
    )
    .unique();

  return viewerRsvp?.status;
}

async function toEventListItem(
  ctx: QueryCtx | MutationCtx,
  eventDoc: Doc<"events">,
  viewerProfileId: Id<"profiles">,
  explicitViewerRsvp?: "going" | "interested",
) {
  const organizer = await ctx.db.get(eventDoc.organizerProfileId);
  if (!organizer) {
    return null;
  }

  const viewerRsvp =
    explicitViewerRsvp ?? (await getViewerRsvpStatus(ctx, eventDoc._id, viewerProfileId));
  const coverImageUrl = await resolveStorageUrl(ctx, eventDoc.coverStorageId);

  return {
    id: eventDoc._id,
    slug: eventDoc.slug,
    title: eventDoc.title,
    category: eventDoc.category,
    startAt: eventDoc.startAt,
    endAt: eventDoc.endAt,
    city: eventDoc.city,
    country: eventDoc.country,
    latitude: eventDoc.latitude,
    longitude: eventDoc.longitude,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(eventDoc.impactSummary ? { impactSummary: eventDoc.impactSummary } : {}),
    attendeeCount: eventDoc.attendeeCount,
    organizer: toProfilePreview(organizer),
    ...(viewerRsvp ? { viewerRsvp } : {}),
  };
}

export const listPublished = query({
  args: {
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(eventListItemValidator),
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    const limit = args.limit ?? 50;

    const events = args.city
      ? await ctx.db
          .query("events")
          .withIndex("by_status_and_city_and_startAt", (q) =>
            q.eq("status", "published").eq("city", args.city!),
          )
          .order("asc")
          .take(limit)
      : args.category
        ? await ctx.db
            .query("events")
            .withIndex("by_status_and_category_and_startAt", (q) =>
              q.eq("status", "published").eq("category", args.category!),
            )
            .order("asc")
            .take(limit)
        : await ctx.db
            .query("events")
            .withIndex("by_status_and_startAt", (q) => q.eq("status", "published"))
            .order("asc")
            .take(limit);

    const items = await Promise.all(
      events.map((eventDoc) => toEventListItem(ctx, eventDoc, viewerProfile._id)),
    );

    return items.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

export const getById = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.union(v.null(), eventDetailValidator),
  handler: async (ctx, args) => {
    const viewerProfile = await requireAuthProfile(ctx);
    const eventDoc = await ctx.db.get(args.eventId);

    if (!eventDoc) {
      return null;
    }

    const organizer = await ctx.db.get(eventDoc.organizerProfileId);
    if (!organizer) {
      return null;
    }

    const mediaDocs = await ctx.db
      .query("eventMedia")
      .withIndex("by_eventId_and_sortOrder", (q) => q.eq("eventId", eventDoc._id))
      .order("asc")
      .collect();
    const coverImageUrl = await resolveStorageUrl(ctx, eventDoc.coverStorageId);

    const rsvpDocs = await ctx.db
      .query("rsvps")
      .withIndex("by_eventId_and_createdAt", (q) => q.eq("eventId", eventDoc._id))
      .order("desc")
      .take(20);

    const latestRsvpByProfile = new Map<Id<"profiles">, Doc<"rsvps">>();
    for (const rsvp of rsvpDocs) {
      if (!latestRsvpByProfile.has(rsvp.attendeeProfileId)) {
        latestRsvpByProfile.set(rsvp.attendeeProfileId, rsvp);
      }
    }

    const attendees = (
      await Promise.all(
        Array.from(latestRsvpByProfile.values()).map(async (rsvpDoc) => {
          const profile = await ctx.db.get(rsvpDoc.attendeeProfileId);
          if (!profile) {
            return null;
          }

          return {
            profile: toProfilePreview(profile),
            status: rsvpDoc.status,
            respondedAt: rsvpDoc.createdAt,
          };
        }),
      )
    )
      .filter((attendee): attendee is NonNullable<typeof attendee> => attendee !== null)
      .sort((a, b) => b.respondedAt - a.respondedAt);

    const goingCount = attendees.filter((attendee) => attendee.status === "going").length;
    const interestedCount = attendees.length - goingCount;

    const messageDocs = await ctx.db
      .query("eventMessages")
      .withIndex("by_eventId_and_createdAt", (q) => q.eq("eventId", eventDoc._id))
      .order("desc")
      .take(20);

    const messages = await Promise.all(
      messageDocs.map(async (messageDoc) => {
        const author = await ctx.db.get(messageDoc.authorProfileId);
        if (!author) {
          return null;
        }

        return {
          id: messageDoc._id,
          body: messageDoc.body,
          kind: messageDoc.kind,
          createdAt: messageDoc.createdAt,
          author: toProfilePreview(author),
        };
      }),
    );

    const viewerRsvp = await getViewerRsvpStatus(ctx, eventDoc._id, viewerProfile._id);

    return {
      event: {
        id: eventDoc._id,
        slug: eventDoc.slug,
        title: eventDoc.title,
        description: eventDoc.description,
        category: eventDoc.category,
        startAt: eventDoc.startAt,
        endAt: eventDoc.endAt,
        timezone: eventDoc.timezone,
        latitude: eventDoc.latitude,
        longitude: eventDoc.longitude,
        addressLine1: eventDoc.addressLine1,
        city: eventDoc.city,
        ...(eventDoc.region ? { region: eventDoc.region } : {}),
        country: eventDoc.country,
        ...(eventDoc.postalCode ? { postalCode: eventDoc.postalCode } : {}),
        ...(coverImageUrl ? { coverImageUrl } : {}),
        ...(eventDoc.coverStorageId ? { coverStorageId: eventDoc.coverStorageId } : {}),
        ...(eventDoc.impactSummary ? { impactSummary: eventDoc.impactSummary } : {}),
        ...(eventDoc.capacity ? { capacity: eventDoc.capacity } : {}),
        status: eventDoc.status,
        attendeeCount: eventDoc.attendeeCount,
      },
      organizer: toProfilePreview(organizer),
      ...(viewerRsvp ? { viewerRsvp } : {}),
      attendeeBreakdown: {
        going: goingCount,
        interested: interestedCount,
        total: attendees.length,
      },
      attendees,
      media: (
        await Promise.all(
          mediaDocs.map(async (mediaDoc) => {
            const mediaUrl = await resolveStorageUrl(ctx, mediaDoc.storageId);
            if (!mediaUrl) {
              return null;
            }

            return {
              id: mediaDoc._id,
              url: mediaUrl,
              ...(mediaDoc.storageId ? { storageId: mediaDoc.storageId } : {}),
              ...(mediaDoc.caption ? { caption: mediaDoc.caption } : {}),
              sortOrder: mediaDoc.sortOrder,
            };
          }),
        )
      ).filter((media): media is NonNullable<typeof media> => media !== null),
      messages: messages.filter(
        (message): message is NonNullable<typeof message> => message !== null,
      ),
    };
  },
});

export const listAttendeesPaginated = query({
  args: {
    eventId: v.id("events"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedEventAttendeesValidator,
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);

    const paginatedRsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_eventId_and_createdAt", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .paginate(args.paginationOpts);

    const attendees = (
      await Promise.all(
        paginatedRsvps.page.map(async (rsvpDoc) => {
          const profile = await ctx.db.get(rsvpDoc.attendeeProfileId);
          if (!profile) {
            return null;
          }

          return {
            profile: toProfilePreview(profile),
            status: rsvpDoc.status,
            respondedAt: rsvpDoc.createdAt,
          };
        }),
      )
    ).filter((attendee): attendee is NonNullable<typeof attendee> => attendee !== null);

    return {
      page: attendees,
      isDone: paginatedRsvps.isDone,
      continueCursor: paginatedRsvps.continueCursor,
    };
  },
});

export const listMessagesPaginated = query({
  args: {
    eventId: v.id("events"),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginatedEventMessagesValidator,
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);

    const paginatedMessages = await ctx.db
      .query("eventMessages")
      .withIndex("by_eventId_and_createdAt", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .paginate(args.paginationOpts);

    const messages = (
      await Promise.all(
        paginatedMessages.page.map(async (messageDoc) => {
          const author = await ctx.db.get(messageDoc.authorProfileId);
          if (!author) {
            return null;
          }

          return {
            id: messageDoc._id,
            body: messageDoc.body,
            kind: messageDoc.kind,
            createdAt: messageDoc.createdAt,
            author: toProfilePreview(author),
          };
        }),
      )
    ).filter((message): message is NonNullable<typeof message> => message !== null);

    return {
      page: messages,
      isDone: paginatedMessages.isDone,
      continueCursor: paginatedMessages.continueCursor,
    };
  },
});

export const listForViewer = query({
  args: {},
  returns: v.object({
    attending: v.array(eventListItemValidator),
    hosting: v.array(eventListItemValidator),
  }),
  handler: async (ctx) => {
    const viewerProfile = await requireAuthProfile(ctx);

    const hostingDocs = await ctx.db
      .query("events")
      .withIndex("by_organizerProfileId_and_startAt", (q) =>
        q.eq("organizerProfileId", viewerProfile._id),
      )
      .order("asc")
      .take(200);

    const attendingRsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_attendeeProfileId_and_createdAt", (q) =>
        q.eq("attendeeProfileId", viewerProfile._id),
      )
      .order("desc")
      .take(400);

    const attendingEventById = new Map<Id<"events">, { event: Doc<"events">; status: "going" | "interested" }>();

    for (const rsvp of attendingRsvps) {
      if (attendingEventById.has(rsvp.eventId)) {
        continue;
      }
      const eventDoc = await ctx.db.get(rsvp.eventId);
      if (eventDoc) {
        attendingEventById.set(eventDoc._id, { event: eventDoc, status: rsvp.status });
      }
    }

    const hostingItems = await Promise.all(
      hostingDocs.map((eventDoc) => toEventListItem(ctx, eventDoc, viewerProfile._id)),
    );

    const attendingItems = await Promise.all(
      Array.from(attendingEventById.values()).map(({ event, status }) =>
        toEventListItem(ctx, event, viewerProfile._id, status),
      ),
    );

    return {
      attending: attendingItems
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.startAt - b.startAt),
      hosting: hostingItems
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.startAt - b.startAt),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    addressLine1: v.string(),
    city: v.string(),
    region: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    impactSummary: v.optional(v.string()),
    capacity: v.optional(v.number()),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const organizer = await requireAuthProfile(ctx);

    if (args.endAt <= args.startAt) {
      throw new ConvexError({
        code: "INVALID_EVENT_WINDOW",
        message: "End time must be after start time.",
      });
    }

    const baseSlug = createSlug(args.title) || `event-${Date.now()}`;
    const existingWithSlug = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
      .unique();

    const slug = existingWithSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    const eventId = await ctx.db.insert("events", {
      slug,
      title: args.title,
      description: args.description,
      category: args.category,
      startAt: args.startAt,
      endAt: args.endAt,
      timezone: args.timezone,
      latitude: args.latitude,
      longitude: args.longitude,
      addressLine1: args.addressLine1,
      city: args.city,
      region: args.region,
      country: args.country,
      postalCode: args.postalCode,
      coverStorageId: args.coverStorageId,
      impactSummary: args.impactSummary,
      capacity: args.capacity,
      status: "published",
      organizerProfileId: organizer._id,
      attendeeCount: 0,
      createdAt: Date.now(),
    });

    let nextSortOrder = 0;

    for (const storageId of args.galleryStorageIds ?? []) {
      await ctx.db.insert("eventMedia", {
        eventId,
        storageId,
        sortOrder: nextSortOrder,
        createdAt: Date.now(),
      });
      nextSortOrder += 1;
    }

    return eventId;
  },
});

export const rsvpToEvent = mutation({
  args: {
    eventId: v.id("events"),
    status: rsvpStatusValidator,
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const attendeeProfile = await requireAuthProfile(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      });
    }

    const existing = await ctx.db
      .query("rsvps")
      .withIndex("by_eventId_and_attendeeProfileId", (q) =>
        q.eq("eventId", args.eventId).eq("attendeeProfileId", attendeeProfile._id),
      )
      .unique();

    const nextStatus = args.status;
    const previousStatus = existing?.status;
    const movingToGoing = nextStatus === "going" && previousStatus !== "going";
    const leavingGoing = previousStatus === "going" && nextStatus !== "going";
    let nextAttendeeCount = event.attendeeCount;

    if (movingToGoing) {
      if (event.capacity !== undefined && nextAttendeeCount >= event.capacity) {
        throw new ConvexError({
          code: "EVENT_FULL",
          message: "This event is at capacity.",
        });
      }
      nextAttendeeCount += 1;
    }

    if (leavingGoing) {
      nextAttendeeCount = Math.max(0, nextAttendeeCount - 1);
    }

    if (existing) {
      if (existing.status === args.status && existing.note === args.note) {
        return null;
      }

      await ctx.db.patch(existing._id, {
        status: args.status,
        note: args.note,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("rsvps", {
        eventId: args.eventId,
        attendeeProfileId: attendeeProfile._id,
        status: args.status,
        note: args.note,
        createdAt: Date.now(),
      });
    }

    if (nextAttendeeCount !== event.attendeeCount) {
      await ctx.db.patch(args.eventId, {
        attendeeCount: nextAttendeeCount,
      });
    }

    return null;
  },
});

export const sendEventMessage = mutation({
  args: {
    eventId: v.id("events"),
    body: v.string(),
    kind: v.optional(messageKindValidator),
  },
  returns: v.id("eventMessages"),
  handler: async (ctx, args) => {
    const authorProfile = await requireAuthProfile(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      });
    }

    if (event.organizerProfileId !== authorProfile._id) {
      throw new ConvexError({
        code: "NOT_EVENT_ORGANIZER",
        message: "Only the event organizer can send event-wide messages.",
      });
    }

    const trimmedBody = args.body.trim();
    if (!trimmedBody) {
      throw new ConvexError({
        code: "EMPTY_MESSAGE",
        message: "Message body is required.",
      });
    }

    const messageId = await ctx.db.insert("eventMessages", {
      eventId: args.eventId,
      authorProfileId: authorProfile._id,
      body: trimmedBody,
      kind: args.kind ?? "announcement",
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.notifications.enqueueForMessage, {
      eventId: args.eventId,
      eventMessageId: messageId,
    });

    await ctx.scheduler.runAfter(0, internal.notificationsActions.dispatchPending, {
      limit: 100,
    });

    return messageId;
  },
});
