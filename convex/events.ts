// events.ts — list / detail / create.

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { currentUser, requireUser } from './lib/authz';

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

/**
 * Map / list discovery. `cats` filters by category; omitted = all.
 * `now` is the client's current time for relative time strings; server just
 * echoes it back with events for hint purposes (real impl would use it to
 * hide past events).
 */
export const discover = query({
  args: {
    cats: v.optional(v.array(CATEGORY)),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cats = args.cats ?? [];
    const limit = args.limit ?? 100;

    // Convex can't do "category in {set}" natively; either filter in memory
    // or paginate by index. With seed size ~10 events, filter in memory.
    const all = await ctx.db.query('events').withIndex('by_startsAt').collect();
    const filtered = cats.length === 0 ? all : all.filter((e) => cats.includes(e.category));
    return filtered.slice(0, limit);
  },
});

/** Detail page payload — event + host + rsvp list + current user's rsvp status. */
export const detail = query({
  args: { id: v.id('events') },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;
    const host = await ctx.db.get(event.hostId);
    const rsvps = await ctx.db
      .query('rsvps')
      .withIndex('by_event', (q) => q.eq('eventId', event._id))
      .collect();

    const userId = await currentUser(ctx);
    const myRsvp = userId
      ? await ctx.db
          .query('rsvps')
          .withIndex('by_event_user', (q) => q.eq('eventId', event._id).eq('userId', userId))
          .unique()
      : null;

    const going = await Promise.all(
      rsvps
        .filter((r) => r.status === 'going')
        .map(async (r) => {
          const u = await ctx.db.get(r.userId);
          return u
            ? {
                _id: u._id,
                name: u.name ?? 'Anon',
                initials: u.initials ?? '?',
                tone: u.tone ?? 200,
              }
            : null;
        }),
    );

    return {
      event,
      host: host
        ? { _id: host._id, name: host.name ?? '', initials: host.initials ?? '?', tone: host.tone ?? 200 }
        : null,
      going: going.filter((x): x is NonNullable<typeof x> => x != null),
      myRsvp: myRsvp ? { status: myRsvp.status } : null,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    category: CATEGORY,
    description: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    location: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    capacity: v.number(),
    hours: v.number(),
    hostOrg: v.optional(v.string()),
    meetingPoint: v.optional(v.string()),
    bring: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<Id<'events'>> => {
    const hostId = await requireUser(ctx);
    const id = await ctx.db.insert('events', {
      title: args.title,
      category: args.category,
      hostId,
      hostOrg: args.hostOrg,
      description: args.description,
      meetingPoint: args.meetingPoint,
      bring: args.bring ?? [],
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      location: args.location,
      address: args.address,
      lat: args.lat,
      lng: args.lng,
      capacity: args.capacity,
      attendees: 0,
      hours: args.hours,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('events') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const event = await ctx.db.get(args.id);
    if (!event) return;
    if (event.hostId !== userId) {
      throw new Error('Only the host can delete this event.');
    }
    await ctx.db.delete(args.id);
  },
});

/** Utility for seed.ts: look up an event by host + title, avoiding duplicates on re-seed. */
export const _findByTitle = query({
  args: { title: v.string() },
  handler: async (ctx, args): Promise<Doc<'events'> | null> => {
    const all = await ctx.db.query('events').collect();
    return all.find((e) => e.title === args.title) ?? null;
  },
});

/**
 * Events the current user has RSVPed "going" to, starting in the future.
 * Used by Hub → Upcoming.
 */
export const myUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) return [];
    const now = Date.now();
    const rsvps = await ctx.db
      .query('rsvps')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const eventIds = rsvps
      .filter((r) => r.status === 'going')
      .map((r) => r.eventId);
    const events = await Promise.all(eventIds.map((id) => ctx.db.get(id)));
    return events
      .filter((e): e is Doc<'events'> => e != null && e.startsAt >= now)
      .sort((a, b) => a.startsAt - b.startsAt);
  },
});

/** Events the current user has saved. */
export const mySaved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) return [];
    const saved = await ctx.db
      .query('savedEvents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const events = await Promise.all(saved.map((s) => ctx.db.get(s.eventId)));
    return events.filter((e): e is Doc<'events'> => e != null);
  },
});

/** Past events the current user attended (RSVP + past startsAt). */
export const myPast = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) return [];
    const now = Date.now();
    const rsvps = await ctx.db
      .query('rsvps')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const eventIds = rsvps.map((r) => r.eventId);
    const events = await Promise.all(eventIds.map((id) => ctx.db.get(id)));
    return events
      .filter((e): e is Doc<'events'> => e != null && e.startsAt < now)
      .sort((a, b) => b.startsAt - a.startsAt);
  },
});
