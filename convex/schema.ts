import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    slug: v.string(),
    externalId: v.optional(v.string()),
    displayName: v.string(),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    city: v.optional(v.string()),
    expoPushToken: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_externalId", ["externalId"])
    .index("by_email", ["email"])
    .index("by_displayName", ["displayName"]),

  events: defineTable({
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
    organizerProfileId: v.id("profiles"),
    attendeeCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_and_startAt", ["status", "startAt"])
    .index("by_status_and_city_and_startAt", ["status", "city", "startAt"])
    .index("by_status_and_category_and_startAt", ["status", "category", "startAt"])
    .index("by_organizerProfileId_and_startAt", ["organizerProfileId", "startAt"]),

  eventMedia: defineTable({
    eventId: v.id("events"),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    caption: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
  }).index("by_eventId_and_sortOrder", ["eventId", "sortOrder"]),

  rsvps: defineTable({
    eventId: v.id("events"),
    attendeeProfileId: v.id("profiles"),
    status: v.union(v.literal("going"), v.literal("interested")),
    createdAt: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_eventId_and_attendeeProfileId", ["eventId", "attendeeProfileId"])
    .index("by_attendeeProfileId_and_createdAt", ["attendeeProfileId", "createdAt"])
    .index("by_eventId_and_createdAt", ["eventId", "createdAt"]),

  eventMessages: defineTable({
    eventId: v.id("events"),
    authorProfileId: v.id("profiles"),
    body: v.string(),
    kind: v.union(v.literal("announcement"), v.literal("update")),
    createdAt: v.number(),
  }).index("by_eventId_and_createdAt", ["eventId", "createdAt"]),

  notificationDeliveries: defineTable({
    eventId: v.id("events"),
    eventMessageId: v.id("eventMessages"),
    recipientProfileId: v.id("profiles"),
    channel: v.union(v.literal("email"), v.literal("push")),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
    attemptCount: v.number(),
    nextAttemptAt: v.number(),
    lastAttemptAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status_and_nextAttemptAt", ["status", "nextAttemptAt"])
    .index("by_recipientProfileId_and_createdAt", ["recipientProfileId", "createdAt"])
    .index("by_eventMessageId", ["eventMessageId"]),
});
