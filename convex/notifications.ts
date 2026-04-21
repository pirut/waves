// notifications.ts — list for me (paginated) + mark-read.

import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireUser } from './lib/authz';

const NOTIFICATION_KIND = v.union(
  v.literal('update'),
  v.literal('reply'),
  v.literal('reminder'),
  v.literal('badge'),
  v.literal('new'),
  v.literal('thanks'),
);

/** Lists notifications for the current user, newest first. */
export const listForMe = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const page = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate(args.paginationOpts);

    const withEnrichment = await Promise.all(
      page.page.map(async (n) => {
        const from = n.fromUserId ? await ctx.db.get(n.fromUserId) : null;
        const event = n.eventId ? await ctx.db.get(n.eventId) : null;
        return {
          ...n,
          from: from
            ? { _id: from._id, name: from.name ?? 'Anon', initials: from.initials ?? '?', tone: from.tone ?? 200 }
            : null,
          event: event ? { _id: event._id, title: event.title } : null,
        };
      }),
    );
    return { ...page, page: withEnrichment };
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_unread', (q) => q.eq('userId', userId).eq('unread', true))
      .collect();
    return unread.length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_unread', (q) => q.eq('userId', userId).eq('unread', true))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { unread: false });
    }
  },
});

/** Internal: called by other mutations (rsvp, comment, etc.) to create a notification. */
export const createNotification = internalMutation({
  args: {
    userId: v.id('users'),
    kind: NOTIFICATION_KIND,
    body: v.string(),
    eventId: v.optional(v.id('events')),
    fromUserId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notifications', {
      userId: args.userId,
      kind: args.kind,
      eventId: args.eventId,
      fromUserId: args.fromUserId,
      body: args.body,
      unread: true,
    });
  },
});
