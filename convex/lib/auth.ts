import { ConvexError } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ConvexFunctionCtx = QueryCtx | MutationCtx;

export async function requireAuthenticatedIdentity(ctx: ConvexFunctionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to access this resource.",
    });
  }
  return identity;
}

export function resolveIdentityExternalId(identity: { subject?: string; tokenIdentifier: string }) {
  return identity.subject ?? identity.tokenIdentifier;
}

export async function requireAuthProfile(ctx: ConvexFunctionCtx): Promise<Doc<"profiles">> {
  const identity = await requireAuthenticatedIdentity(ctx);
  const externalId = resolveIdentityExternalId(identity);

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();

  if (!profile) {
    throw new ConvexError({
      code: "PROFILE_NOT_INITIALIZED",
      message: "Profile not initialized for authenticated user.",
    });
  }

  return profile;
}
