import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  requireAuthenticatedIdentity,
  resolveIdentityExternalId,
} from "./lib/auth";

const profileViewValidator = v.object({
  id: v.id("profiles"),
  slug: v.string(),
  displayName: v.string(),
  email: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  city: v.optional(v.string()),
});

function toProfileView(profile: Doc<"profiles">) {
  return {
    id: profile._id,
    slug: profile.slug,
    displayName: profile.displayName,
    ...(profile.email ? { email: profile.email } : {}),
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.city ? { city: profile.city } : {}),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

function resolveDisplayName(
  identity: { name?: string; givenName?: string; familyName?: string },
  explicitDisplayName?: string,
) {
  if (explicitDisplayName?.trim()) {
    return explicitDisplayName.trim();
  }

  if (identity.name?.trim()) {
    return identity.name.trim();
  }

  const joinedName = `${identity.givenName ?? ""} ${identity.familyName ?? ""}`.trim();
  if (joinedName) {
    return joinedName;
  }

  return "Make Waves Member";
}

function resolveBaseSlug(displayName: string, email?: string) {
  const fromName = slugify(displayName);
  if (fromName) {
    return fromName;
  }

  if (email) {
    const emailPrefix = slugify(email.split("@")[0] ?? "");
    if (emailPrefix) {
      return emailPrefix;
    }
  }

  return "make-waves-member";
}

async function ensureUniqueSlug(
  ctx: MutationCtx,
  baseSlug: string,
  externalId: string,
) {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
    .unique();

  if (!existing) {
    return baseSlug;
  }

  const suffix = externalId.slice(-6).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

export const syncCurrentUser = mutation({
  args: {
    displayName: v.optional(v.string()),
    city: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const identity = await requireAuthenticatedIdentity(ctx);
    const externalId = resolveIdentityExternalId(identity);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    const displayName = resolveDisplayName(identity, args.displayName);
    const email = args.email?.trim() || identity.email;

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName,
        email,
        city: args.city,
        avatarUrl: args.avatarUrl,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const baseSlug = resolveBaseSlug(displayName, email);
    const slug = await ensureUniqueSlug(ctx, baseSlug, externalId);

    return await ctx.db.insert("profiles", {
      slug,
      externalId,
      displayName,
      email,
      city: args.city,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getCurrent = query({
  args: {},
  returns: v.union(v.null(), profileViewValidator),
  handler: async (ctx) => {
    const identity = await requireAuthenticatedIdentity(ctx);
    const externalId = resolveIdentityExternalId(identity);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    return profile ? toProfileView(profile) : null;
  },
});

export const getById = query({
  args: {
    profileId: v.id("profiles"),
  },
  returns: v.union(v.null(), profileViewValidator),
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);

    const profile = await ctx.db.get(args.profileId);

    if (!profile) {
      return null;
    }

    return toProfileView(profile);
  },
});

export const updateCurrentProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    city: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const identity = await requireAuthenticatedIdentity(ctx);
    const externalId = resolveIdentityExternalId(identity);

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();

    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_NOT_FOUND",
        message: "Profile not found for current user.",
      });
    }

    await ctx.db.patch(profile._id, {
      ...(args.displayName ? { displayName: args.displayName.trim() } : {}),
      ...(args.city !== undefined ? { city: args.city } : {}),
      ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
      updatedAt: Date.now(),
    });

    return profile._id;
  },
});
