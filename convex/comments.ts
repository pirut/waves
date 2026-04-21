// comments.ts — post + list (paginated) comments on an event.

import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/authz';

export const postComment = mutation({
  args: {
    eventId: v.id('events'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const body = args.body.trim();
    if (!body) throw new Error('Comment is empty.');
    const id = await ctx.db.insert('comments', {
      eventId: args.eventId,
      userId,
      body,
    });
    return id;
  },
});

/** Paginated list, oldest → newest (matches the prototype's visual order). */
export const listByEvent = query({
  args: {
    eventId: v.id('events'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('comments')
      .withIndex('by_event_createdAt', (q) => q.eq('eventId', args.eventId))
      .order('asc')
      .paginate(args.paginationOpts);

    // Enrich with author info for the UI.
    const withAuthors = await Promise.all(
      page.page.map(async (c) => {
        const u = await ctx.db.get(c.userId);
        return {
          ...c,
          author: u
            ? { _id: u._id, name: u.name ?? 'Anon', initials: u.initials ?? '?', tone: u.tone ?? 200 }
            : null,
        };
      }),
    );
    return { ...page, page: withAuthors };
  },
});
