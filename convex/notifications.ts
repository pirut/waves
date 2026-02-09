import { ConvexError, v } from "convex/values";

import { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { requireAuthProfile } from "./lib/auth";

const notificationChannelValidator = v.union(v.literal("email"), v.literal("push"));

const pendingDeliveryValidator = v.object({
  deliveryId: v.id("notificationDeliveries"),
  channel: notificationChannelValidator,
  attemptCount: v.number(),
  recipientEmail: v.optional(v.string()),
  expoPushToken: v.optional(v.string()),
  recipientName: v.string(),
  eventTitle: v.string(),
  messageBody: v.string(),
});

function toPendingDeliveryView(
  delivery: Doc<"notificationDeliveries">,
  recipient: Doc<"profiles"> | null,
  eventDoc: Doc<"events"> | null,
  messageDoc: Doc<"eventMessages"> | null,
) {
  return {
    deliveryId: delivery._id,
    channel: delivery.channel,
    attemptCount: delivery.attemptCount,
    ...(recipient?.email ? { recipientEmail: recipient.email } : {}),
    ...(recipient?.expoPushToken ? { expoPushToken: recipient.expoPushToken } : {}),
    recipientName: recipient?.displayName ?? "Community member",
    eventTitle: eventDoc?.title ?? "Make Waves event",
    messageBody: messageDoc?.body ?? "You have a new event update.",
  };
}

export const registerPushToken = mutation({
  args: {
    expoPushToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireAuthProfile(ctx);

    await ctx.db.patch(profile._id, {
      expoPushToken: args.expoPushToken.trim(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const clearPushToken = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await requireAuthProfile(ctx);

    await ctx.db.patch(profile._id, {
      expoPushToken: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const enqueueForMessage = internalMutation({
  args: {
    eventId: v.id("events"),
    eventMessageId: v.id("eventMessages"),
  },
  returns: v.object({
    queued: v.number(),
  }),
  handler: async (ctx, args) => {
    const eventDoc = await ctx.db.get(args.eventId);
    if (!eventDoc) {
      throw new ConvexError({
        code: "EVENT_NOT_FOUND",
        message: "Cannot queue notifications because the event was not found.",
      });
    }

    const messageDoc = await ctx.db.get(args.eventMessageId);
    if (!messageDoc || messageDoc.eventId !== args.eventId) {
      throw new ConvexError({
        code: "MESSAGE_NOT_FOUND",
        message: "Cannot queue notifications because the event message was not found.",
      });
    }

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_eventId_and_createdAt", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(3000);

    let queued = 0;

    for (const rsvp of rsvps) {
      if (rsvp.attendeeProfileId === messageDoc.authorProfileId) {
        continue;
      }

      const recipient = await ctx.db.get(rsvp.attendeeProfileId);
      if (!recipient) {
        continue;
      }

      if (recipient.email) {
        await ctx.db.insert("notificationDeliveries", {
          eventId: args.eventId,
          eventMessageId: args.eventMessageId,
          recipientProfileId: recipient._id,
          channel: "email",
          status: "pending",
          attemptCount: 0,
          nextAttemptAt: Date.now(),
          createdAt: Date.now(),
        });
        queued += 1;
      }

      if (recipient.expoPushToken) {
        await ctx.db.insert("notificationDeliveries", {
          eventId: args.eventId,
          eventMessageId: args.eventMessageId,
          recipientProfileId: recipient._id,
          channel: "push",
          status: "pending",
          attemptCount: 0,
          nextAttemptAt: Date.now(),
          createdAt: Date.now(),
        });
        queued += 1;
      }
    }

    return { queued };
  },
});

export const listPendingDeliveries = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(pendingDeliveryValidator),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 250));
    const now = Date.now();

    const readyDeliveries: Array<Doc<"notificationDeliveries">> = [];

    const query = ctx.db
      .query("notificationDeliveries")
      .withIndex("by_status_and_nextAttemptAt", (q) => q.eq("status", "pending"))
      .order("asc");

    for await (const delivery of query) {
      if (delivery.nextAttemptAt > now) {
        break;
      }

      readyDeliveries.push(delivery);
      if (readyDeliveries.length >= limit) {
        break;
      }
    }

    const views = await Promise.all(
      readyDeliveries.map(async (delivery) => {
        const [recipient, eventDoc, messageDoc] = await Promise.all([
          ctx.db.get(delivery.recipientProfileId),
          ctx.db.get(delivery.eventId),
          ctx.db.get(delivery.eventMessageId),
        ]);

        return toPendingDeliveryView(delivery, recipient, eventDoc, messageDoc);
      }),
    );

    return views;
  },
});

export const markDeliveryAttempt = internalMutation({
  args: {
    deliveryId: v.id("notificationDeliveries"),
    outcome: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
      v.literal("retry"),
    ),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);

    if (!delivery) {
      return null;
    }

    const attemptedAt = Date.now();
    const nextAttemptCount = delivery.attemptCount + 1;

    if (args.outcome === "retry") {
      const backoffMs = Math.min(30 * 60 * 1000, 2 ** nextAttemptCount * 30 * 1000);
      await ctx.db.patch(delivery._id, {
        status: "pending",
        ...(args.error ? { error: args.error } : {}),
        attemptCount: nextAttemptCount,
        lastAttemptAt: attemptedAt,
        nextAttemptAt: attemptedAt + backoffMs,
      });
      return null;
    }

    const status: Doc<"notificationDeliveries">["status"] =
      args.outcome === "sent"
        ? "sent"
        : args.outcome === "failed"
          ? "failed"
          : "skipped";

    await ctx.db.patch(delivery._id, {
      status,
      ...(args.providerMessageId ? { providerMessageId: args.providerMessageId } : {}),
      ...(args.error ? { error: args.error } : {}),
      attemptCount: nextAttemptCount,
      lastAttemptAt: attemptedAt,
      nextAttemptAt: attemptedAt,
    });

    return null;
  },
});
