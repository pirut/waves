import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

async function ensureProfile(
  ctx: MutationCtx,
  slug: string,
  displayName: string,
  city: string,
  avatarUrl?: string,
): Promise<Id<"profiles">> {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing) {
    return existing._id;
  }

  return await ctx.db.insert("profiles", {
    slug,
    displayName,
    city,
    avatarUrl,
    createdAt: Date.now(),
  });
}

export const seedDemoData = internalMutation({
  args: {},
  returns: v.object({
    seeded: v.boolean(),
    viewerProfileId: v.id("profiles"),
  }),
  handler: async (ctx) => {
    const viewerProfileId = await ensureProfile(
      ctx,
      "make-waves-viewer",
      "You",
      "San Francisco",
    );

    const existingEvent = await ctx.db
      .query("events")
      .withIndex("by_status_and_startAt", (q) => q.eq("status", "published"))
      .take(1);

    if (existingEvent.length > 0) {
      return {
        seeded: false,
        viewerProfileId,
      };
    }

    const organizerA = await ensureProfile(
      ctx,
      "coastline-care",
      "Coastline Care Team",
      "San Francisco",
    );
    const organizerB = await ensureProfile(
      ctx,
      "sunrise-pantry",
      "Sunrise Pantry",
      "Oakland",
    );

    const now = Date.now();
    const twoDays = 1000 * 60 * 60 * 24 * 2;

    const beachEventId = await ctx.db.insert("events", {
      slug: "beach-restoration-day",
      title: "Beach Restoration Day",
      description:
        "Join local volunteers to remove plastics, restore dunes, and prepare educational kits for families.",
      category: "Community Cleanup",
      startAt: now + twoDays,
      endAt: now + twoDays + 1000 * 60 * 60 * 3,
      timezone: "America/Los_Angeles",
      latitude: 37.759,
      longitude: -122.510,
      addressLine1: "Ocean Beach Parking Lot C",
      city: "San Francisco",
      region: "CA",
      country: "USA",
      postalCode: "94121",
      impactSummary: "Target: remove 1,200 lbs of coastal waste.",
      capacity: 250,
      status: "published",
      organizerProfileId: organizerA,
      attendeeCount: 2,
      createdAt: now,
    });

    const pantryEventId = await ctx.db.insert("events", {
      slug: "community-food-packaging-night",
      title: "Community Food Packaging Night",
      description:
        "Help package shelf-stable meals, sort donated produce, and prep delivery routes for local families.",
      category: "Food Security",
      startAt: now + twoDays * 2,
      endAt: now + twoDays * 2 + 1000 * 60 * 60 * 2,
      timezone: "America/Los_Angeles",
      latitude: 37.803,
      longitude: -122.271,
      addressLine1: "Sunrise Pantry Warehouse",
      city: "Oakland",
      region: "CA",
      country: "USA",
      postalCode: "94607",
      impactSummary: "Target: package 6,000 meals.",
      capacity: 140,
      status: "published",
      organizerProfileId: organizerB,
      attendeeCount: 1,
      createdAt: now,
    });

    await ctx.db.insert("rsvps", {
      eventId: beachEventId,
      attendeeProfileId: viewerProfileId,
      status: "going",
      createdAt: now,
    });

    await ctx.db.insert("rsvps", {
      eventId: beachEventId,
      attendeeProfileId: organizerA,
      status: "going",
      createdAt: now,
    });

    await ctx.db.insert("rsvps", {
      eventId: pantryEventId,
      attendeeProfileId: viewerProfileId,
      status: "interested",
      createdAt: now,
    });

    await ctx.db.insert("rsvps", {
      eventId: pantryEventId,
      attendeeProfileId: organizerB,
      status: "going",
      createdAt: now,
    });

    await ctx.db.insert("eventMessages", {
      eventId: beachEventId,
      authorProfileId: organizerA,
      body: "Bring reusable gloves and a refillable water bottle.",
      kind: "announcement",
      createdAt: now,
    });

    return {
      seeded: true,
      viewerProfileId,
    };
  },
});
