// checkIns.ts — day-of attendance check-in. One per (user, event).

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { requireUser } from './lib/authz';

export const checkInToEvent = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // Idempotent: check first.
    const existing = await ctx.db
      .query('checkIns')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    if (existing.some((c) => c.eventId === args.eventId)) {
      return { already: true };
    }
    await ctx.db.insert('checkIns', { eventId: args.eventId, userId });
    return { already: false };
  },
});
