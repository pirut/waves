// updates.ts — host-posted event updates.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/authz';

export const postUpdate = mutation({
  args: {
    eventId: v.id('events'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const body = args.body.trim();
    if (!body) throw new Error('Update is empty.');
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error('Event not found');
    if (event.hostId !== userId) {
      throw new Error('Only the host can post updates for this event.');
    }
    return await ctx.db.insert('eventUpdates', {
      eventId: args.eventId,
      userId,
      body,
    });
  },
});

export const listByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query('eventUpdates')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .order('desc')
      .collect();

    return await Promise.all(
      updates.map(async (u) => {
        const author = await ctx.db.get(u.userId);
        return {
          ...u,
          author: author
            ? { _id: author._id, name: author.name ?? 'Anon', initials: author.initials ?? '?', tone: author.tone ?? 200 }
            : null,
        };
      }),
    );
  },
});
