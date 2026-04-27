// badges.ts — derived badge catalog + earned state for the current user.
//
// Mirrors BADGES in waves/project/components/data.jsx. Earned state is read
// from `badgeProgress`. The catalog itself is static.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { currentUser, requireUser } from './lib/authz';

export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  glyph: string;
};

const BADGE_CATALOG: readonly BadgeDef[] = [
  { id: 'b1', name: 'First Ripple', desc: 'Your first event', glyph: 'ripple1' },
  { id: 'b2', name: 'Second Wave', desc: '5 events completed', glyph: 'ripple2' },
  { id: 'b3', name: 'Lagoon Steward', desc: '5 waterfront cleanups', glyph: 'wave' },
  { id: 'b4', name: 'Native Planter', desc: '3 habitat events', glyph: 'sprout' },
  { id: 'b5', name: 'Sunrise Crew', desc: 'Before 8am, 3 times', glyph: 'sun' },
  { id: 'b6', name: 'Weekly Habit', desc: '4-week streak', glyph: 'flame' },
  { id: 'b7', name: 'Connector', desc: 'Brought 3 friends', glyph: 'link' },
  { id: 'b8', name: 'Deep Current', desc: '100 hours logged', glyph: 'anchor' },
  { id: 'b9', name: 'Year-rounder', desc: 'Every month, 12 months', glyph: 'circle' },
];

export const catalog = query({
  args: {},
  handler: async () => BADGE_CATALOG,
});

/** Returns BADGE_CATALOG joined with the user's earned state. */
export const listForMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUser(ctx);
    if (!userId) {
      return BADGE_CATALOG.map((b) => ({ ...b, earned: false }));
    }
    const progress = await ctx.db
      .query('badgeProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const earnedSet = new Set(progress.filter((p) => p.earned).map((p) => p.badgeId));
    return BADGE_CATALOG.map((b) => ({ ...b, earned: earnedSet.has(b.id) }));
  },
});

/** Internal: set earned state (used by seed + future auto-award rules). */
export const markEarned = mutation({
  args: { badgeId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('badgeProgress')
      .withIndex('by_user_badge', (q) => q.eq('userId', userId).eq('badgeId', args.badgeId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { earned: true, earnedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert('badgeProgress', {
      userId,
      badgeId: args.badgeId,
      earned: true,
      earnedAt: Date.now(),
    });
  },
});
