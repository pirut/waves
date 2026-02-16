import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  requireAuthenticatedIdentity,
  resolveIdentityExternalId,
} from "./lib/auth";

const profileViewValidator = v.object({
  id: v.id("profiles"),
  handle: v.string(),
  slug: v.string(),
  displayName: v.string(),
  email: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  city: v.optional(v.string()),
});

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 24;
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

function toProfileView(profile: Doc<"profiles">) {
  return {
    id: profile._id,
    handle: profile.slug,
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

function normalizeHandleInput(handle: string) {
  return handle.trim().toLowerCase().replace(/^@+/, "");
}

function normalizeGeneratedHandle(value: string) {
  let candidate = value
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  if (candidate.length === 0) {
    candidate = "member";
  }

  if (candidate.length < HANDLE_MIN_LENGTH) {
    candidate = `${candidate}${"wave".slice(0, HANDLE_MIN_LENGTH - candidate.length)}`;
  }

  return candidate.slice(0, HANDLE_MAX_LENGTH);
}

function validateAndNormalizeHandle(handle: string) {
  const normalized = normalizeHandleInput(handle);

  if (!HANDLE_PATTERN.test(normalized)) {
    throw new ConvexError({
      code: "INVALID_HANDLE",
      message:
        "Handle must be 3-24 characters and use lowercase letters, numbers, underscores, or hyphens.",
    });
  }

  return normalized;
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
    return normalizeGeneratedHandle(fromName);
  }

  if (email) {
    const emailPrefix = slugify(email.split("@")[0] ?? "");
    if (emailPrefix) {
      return normalizeGeneratedHandle(emailPrefix);
    }
  }

  return "member";
}

async function findProfileBySlug(ctx: MutationCtx, slug: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

async function assertSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  currentProfileId?: Doc<"profiles">["_id"],
) {
  const existing = await findProfileBySlug(ctx, slug);
  if (!existing || (currentProfileId && existing._id === currentProfileId)) {
    return;
  }

  throw new ConvexError({
    code: "HANDLE_TAKEN",
    message: `@${slug} is already taken. Try another handle.`,
  });
}

async function ensureUniqueSlug(
  ctx: MutationCtx,
  baseSlug: string,
  externalId: string,
) {
  const firstCandidate = baseSlug.slice(0, HANDLE_MAX_LENGTH);
  const existing = await findProfileBySlug(ctx, firstCandidate);
  if (!existing) {
    return firstCandidate;
  }

  const suffixBase = externalId.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, "") || "mw";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? suffixBase : `${suffixBase}${attempt}`;
    const maxBaseLength = HANDLE_MAX_LENGTH - suffix.length - 1;
    const candidateBase = firstCandidate.slice(0, Math.max(HANDLE_MIN_LENGTH, maxBaseLength));
    const candidate = `${candidateBase}-${suffix}`.slice(0, HANDLE_MAX_LENGTH);
    const collision = await findProfileBySlug(ctx, candidate);
    if (!collision) {
      return candidate;
    }
  }

  const timestampSuffix = `${Date.now()}`.slice(-4);
  const fallback = `${firstCandidate.slice(0, HANDLE_MAX_LENGTH - 5)}-${timestampSuffix}`;
  const fallbackCollision = await findProfileBySlug(ctx, fallback);
  if (!fallbackCollision) {
    return fallback;
  }

  const emergency = `${firstCandidate.slice(0, HANDLE_MAX_LENGTH - 8)}-${timestampSuffix}x`;
  const emergencyCollision = await findProfileBySlug(ctx, emergency);
  if (!emergencyCollision) {
    return emergency;
  }

  throw new ConvexError({
    code: "HANDLE_GENERATION_FAILED",
    message: "Could not generate a unique handle. Please choose one manually.",
  });
}

export const syncCurrentUser = mutation({
  args: {
    displayName: v.optional(v.string()),
    handle: v.optional(v.string()),
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

    const requestedDisplayName = args.displayName?.trim();
    const requestedHandle = args.handle?.trim();
    const explicitHandle = requestedHandle ? validateAndNormalizeHandle(requestedHandle) : undefined;
    const displayName = resolveDisplayName(identity, requestedDisplayName);
    const email = args.email?.trim() || identity.email;
    const city = args.city?.trim() || undefined;
    const avatarUrl = args.avatarUrl?.trim() || undefined;

    if (existing) {
      const patch: Partial<Doc<"profiles">> = {};

      if (requestedDisplayName && requestedDisplayName !== existing.displayName) {
        patch.displayName = requestedDisplayName;
      }

      if (email && email !== existing.email) {
        patch.email = email;
      }

      if (args.city !== undefined && city !== existing.city) {
        patch.city = city;
      }

      if (args.avatarUrl !== undefined && avatarUrl !== existing.avatarUrl) {
        patch.avatarUrl = avatarUrl;
      }

      if (explicitHandle && explicitHandle !== existing.slug) {
        await assertSlugAvailable(ctx, explicitHandle, existing._id);
        patch.slug = explicitHandle;
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = Date.now();
        await ctx.db.patch(existing._id, patch);
      }

      return existing._id;
    }

    let slug: string;
    if (explicitHandle) {
      await assertSlugAvailable(ctx, explicitHandle);
      slug = explicitHandle;
    } else {
      slug = await ensureUniqueSlug(ctx, resolveBaseSlug(displayName, email), externalId);
    }

    return await ctx.db.insert("profiles", {
      slug,
      externalId,
      displayName,
      ...(email ? { email } : {}),
      ...(city ? { city } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
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
    handle: v.optional(v.string()),
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

    const patch: Partial<Doc<"profiles">> = {};

    if (args.displayName !== undefined) {
      const nextDisplayName = args.displayName.trim();
      if (nextDisplayName.length < 2) {
        throw new ConvexError({
          code: "INVALID_DISPLAY_NAME",
          message: "Display name must be at least 2 characters.",
        });
      }

      if (nextDisplayName !== profile.displayName) {
        patch.displayName = nextDisplayName;
      }
    }

    if (args.city !== undefined) {
      const nextCity = args.city.trim() || undefined;
      if (nextCity !== profile.city) {
        patch.city = nextCity;
      }
    }

    if (args.avatarUrl !== undefined) {
      const nextAvatarUrl = args.avatarUrl.trim() || undefined;
      if (nextAvatarUrl !== profile.avatarUrl) {
        patch.avatarUrl = nextAvatarUrl;
      }
    }

    if (args.handle !== undefined) {
      const nextHandle = validateAndNormalizeHandle(args.handle);
      if (nextHandle !== profile.slug) {
        await assertSlugAvailable(ctx, nextHandle, profile._id);
        patch.slug = nextHandle;
      }
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = Date.now();
      await ctx.db.patch(profile._id, patch);
    }

    return profile._id;
  },
});
