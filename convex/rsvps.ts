// rsvps.ts — toggleRsvp (sign up / cancel) and listGoingByEvent.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/authz';

export const toggleRsvp = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error('Event not found');

    const existing = await ctx.db
      .query('rsvps')
      .withIndex('by_event_user', (q) => q.eq('eventId', args.eventId).eq('userId', userId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.eventId, { attendees: Math.max(0, event.attendees - 1) });
      return { signedUp: false };
    }

    if (event.attendees >= event.capacity) {
      throw new Error('Event is at capacity');
    }
    await ctx.db.insert('rsvps', { eventId: args.eventId, userId, status: 'going' });
    await ctx.db.patch(args.eventId, { attendees: event.attendees + 1 });
    return { signedUp: true };
  },
});

export const listGoingByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('rsvps')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();
    return rsvps.filter((r) => r.status === 'going');
  },
});
