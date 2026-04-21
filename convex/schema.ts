// schema.ts — Make Waves data model.
//
// Mirrors the shape of waves/project/components/data.jsx. We layer the
// Convex Auth standard tables underneath via authTables and extend `users`
// with the Make Waves profile fields (tone, hours, streak…).
//
// Indexes are chosen for the queries in events.ts / comments.ts / notifications.ts
// (typical access pattern is by_event + by_user, ordered by createdAt).

import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const CATEGORY = v.union(
  v.literal('cleanup'),
  v.literal('food'),
  v.literal('garden'),
  v.literal('elders'),
  v.literal('tutor'),
  v.literal('animals'),
  v.literal('blood'),
  v.literal('outreach'),
  v.literal('repairs'),
);

const NOTIFICATION_KIND = v.union(
  v.literal('update'),
  v.literal('reply'),
  v.literal('reminder'),
  v.literal('badge'),
  v.literal('new'),
  v.literal('thanks'),
);

export default defineSchema({
  // ─── Convex Auth tables (users, accounts, sessions, verificationCodes) ──
  // We override `users` below to add Make Waves profile fields.
  ...authTables,

  users: defineTable({
    // Convex Auth standard fields (all optional — populated by the auth flow).
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Make Waves profile.
    initials: v.optional(v.string()),
    handle: v.optional(v.string()),
    bio: v.optional(v.string()),
    tone: v.optional(v.number()), // OKLCH hue used by Avatar
    hours: v.optional(v.number()),
    streak: v.optional(v.number()),
    badgeCount: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone']),

  // ─── Events ────────────────────────────────────────────────────────
  events: defineTable({
    title: v.string(),
    category: CATEGORY,
    hostId: v.id('users'),
    hostOrg: v.optional(v.string()),
    description: v.string(),
    meetingPoint: v.optional(v.string()),
    bring: v.array(v.string()),
    // Instants
    startsAt: v.number(),
    endsAt: v.number(),
    // Place
    location: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    // Capacity
    capacity: v.number(),
    attendees: v.number(), // denormalized going count
    hours: v.number(),
  })
    .index('by_startsAt', ['startsAt'])
    .index('by_category', ['category'])
    .index('by_host', ['hostId']),

  rsvps: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    status: v.union(v.literal('going'), v.literal('interested')),
  })
    .index('by_event', ['eventId'])
    .index('by_user', ['userId'])
    .index('by_event_user', ['eventId', 'userId']),

  comments: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    body: v.string(),
  })
    .index('by_event_createdAt', ['eventId'])
    .index('by_user', ['userId']),

  eventUpdates: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    body: v.string(),
  })
    .index('by_event', ['eventId']),

  notifications: defineTable({
    userId: v.id('users'),
    kind: NOTIFICATION_KIND,
    eventId: v.optional(v.id('events')),
    fromUserId: v.optional(v.id('users')),
    body: v.string(),
    unread: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_unread', ['userId', 'unread']),

  checkIns: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
  })
    .index('by_event', ['eventId'])
    .index('by_user', ['userId']),

  savedEvents: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
  })
    .index('by_user', ['userId'])
    .index('by_event_user', ['eventId', 'userId']),

  badgeProgress: defineTable({
    userId: v.id('users'),
    badgeId: v.string(),
    earned: v.boolean(),
    earnedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_badge', ['userId', 'badgeId']),
});
