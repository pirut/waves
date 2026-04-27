// authz.ts — authorization helper used by mutations and queries.

import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

async function findUserIdByTokenIdentifier(
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string,
): Promise<Id<'users'> | null> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
    .unique();
  return user?._id ?? null;
}

/**
 * Fetch the logged-in user's _id, or throw if the request is anonymous.
 * Mirrors the common "requireUser" pattern.
 */
export async function requireUser(ctx: MutationCtx): Promise<Id<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
  }

  const existingUserId = await findUserIdByTokenIdentifier(ctx, identity.tokenIdentifier);
  if (existingUserId) {
    return existingUserId;
  }

  return await ctx.db.insert('users', {
    tokenIdentifier: identity.tokenIdentifier,
    name: identity.name,
    email: identity.email,
    image: identity.pictureUrl,
  });
}

/** Non-throwing variant: returns `null` for anonymous callers. */
export async function currentUser(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await findUserIdByTokenIdentifier(ctx, identity.tokenIdentifier);
}
