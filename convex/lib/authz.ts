// authz.ts — authorization helper used by mutations and queries.

import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

/**
 * Fetch the logged-in user's _id, or throw if the request is anonymous.
 * Mirrors the common "requireUser" pattern.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: 'UNAUTHENTICATED', message: 'Sign in to continue.' });
  }
  return userId;
}

/** Non-throwing variant: returns `null` for anonymous callers. */
export async function currentUser(ctx: QueryCtx | MutationCtx): Promise<Id<'users'> | null> {
  return getAuthUserId(ctx);
}
