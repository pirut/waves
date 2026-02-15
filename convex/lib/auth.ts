import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ConvexFunctionCtx = QueryCtx | MutationCtx;
const LOCAL_AUTH_BYPASS_ENABLED = process.env.LOCAL_AUTH_BYPASS === "true";
const LOCAL_AUTH_BYPASS_EXTERNAL_ID =
  process.env.LOCAL_AUTH_BYPASS_EXTERNAL_ID?.trim() || "local-design-viewer";
const CONVEX_DEPLOYMENT = process.env.CONVEX_DEPLOYMENT ?? "";
const RUNNING_IN_PROD_DEPLOYMENT = CONVEX_DEPLOYMENT.startsWith("prod:");

function getBypassIdentity(): UserIdentity {
  const subject = LOCAL_AUTH_BYPASS_EXTERNAL_ID;
  const issuer = "local://make-waves/auth-bypass";

  return {
    tokenIdentifier: `${issuer}|${subject}`,
    subject,
    issuer,
    name: "Local Design Tester",
    email: "local-design@makewaves.test",
    emailVerified: true,
  };
}

function shouldUseBypassIdentity() {
  return LOCAL_AUTH_BYPASS_ENABLED && !RUNNING_IN_PROD_DEPLOYMENT;
}

export async function requireAuthenticatedIdentity(ctx: ConvexFunctionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    if (shouldUseBypassIdentity()) {
      return getBypassIdentity();
    }

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
