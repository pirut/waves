// savedEvents.ts — "saved for later" toggle + my list.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { currentUser, requireUser } from './lib/authz';

export const toggleSave = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('savedEvents')
      .withIndex('by_event_user', (q) => q.eq('eventId', args.eventId).eq('userId', userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert('savedEvents', { eventId: args.eventId, userId });
    return { saved: true };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) {
      return [];
    }
    const saved = await ctx.db
      .query('savedEvents')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const events = await Promise.all(saved.map((s) => ctx.db.get(s.eventId)));
    return events.filter((e): e is NonNullable<typeof e> => e != null);
  },
});
