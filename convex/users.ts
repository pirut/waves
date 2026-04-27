// users.ts — profile queries for the current user.

import { query } from './_generated/server';
import { currentUser } from './lib/authz';

/**
 * Returns the current user's profile, or `null` if the caller is anonymous
 * or their app-level profile has not been bootstrapped yet.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name ?? 'You',
      email: user.email ?? null,
      image: user.image ?? null,
      initials: user.initials ?? 'YO',
      handle: user.handle ?? null,
      bio: user.bio ?? null,
      tone: user.tone ?? 200,
      hours: user.hours ?? 0,
      streak: user.streak ?? 0,
      badgeCount: user.badgeCount ?? 0,
    };
  },
});

/**
 * Stats strip for the Hub / Profile screens: hours, streak, badges earned.
 * Currently a view over the denormalized counters on `users`; real impl
 * will recompute from rsvps / checkIns on write.
 */
export const profileStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const earnedBadges = await ctx.db
      .query('badgeProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const earned = earnedBadges.filter((b) => b.earned).length;

    return {
      hours: user.hours ?? 0,
      streak: user.streak ?? 0,
      badges: earned,
    };
  },
});
