"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const dispatchSummaryValidator = v.object({
  processed: v.number(),
  sent: v.number(),
  failed: v.number(),
  skipped: v.number(),
  requeued: v.number(),
});

async function sendEmailDelivery(delivery: {
  recipientEmail?: string;
  recipientName: string;
  eventTitle: string;
  messageBody: string;
}) {
  if (!delivery.recipientEmail) {
    return {
      outcome: "skipped" as const,
      error: "Recipient email is missing.",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return {
      outcome: "skipped" as const,
      error: "RESEND_API_KEY or NOTIFICATIONS_FROM_EMAIL is not configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [delivery.recipientEmail],
      subject: `New update: ${delivery.eventTitle}`,
      html: `<p>Hi ${delivery.recipientName},</p><p>${delivery.messageBody}</p>`,
    }),
  });

  if (!response.ok) {
    return {
      outcome: "failed" as const,
      error: `Email provider error (${response.status}): ${await response.text()}`,
    };
  }

  const payload = (await response.json()) as { id?: string };

  return {
    outcome: "sent" as const,
    providerMessageId: payload.id,
  };
}

async function sendPushDelivery(delivery: {
  expoPushToken?: string;
  eventTitle: string;
  messageBody: string;
}) {
  if (!delivery.expoPushToken) {
    return {
      outcome: "skipped" as const,
      error: "Expo push token is missing.",
    };
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: delivery.expoPushToken,
      title: `Event update: ${delivery.eventTitle}`,
      body: delivery.messageBody.slice(0, 180),
      sound: "default",
      data: {
        eventTitle: delivery.eventTitle,
      },
    }),
  });

  if (!response.ok) {
    return {
      outcome: "failed" as const,
      error: `Expo push error (${response.status}): ${await response.text()}`,
    };
  }

  const payload = (await response.json()) as {
    data?: Array<{ status?: string; id?: string; message?: string }>;
  };

  const firstResult = payload.data?.[0];

  if (firstResult?.status !== "ok") {
    return {
      outcome: "failed" as const,
      error: firstResult?.message ?? "Expo push response did not return ok status.",
    };
  }

  return {
    outcome: "sent" as const,
    providerMessageId: firstResult.id,
  };
}

export const dispatchPending = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  returns: dispatchSummaryValidator,
  handler: async (ctx, args) => {
    const pendingDeliveries = await ctx.runQuery(
      internal.notifications.listPendingDeliveries,
      {
        limit: args.limit,
      },
    );

    const summary = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      requeued: 0,
    };

    for (const delivery of pendingDeliveries) {
      summary.processed += 1;

      const maxAttempts = 3;
      const shouldRetryAfterFailure = delivery.attemptCount + 1 < maxAttempts;

      const result =
        delivery.channel === "email"
          ? await sendEmailDelivery(delivery)
          : await sendPushDelivery(delivery);

      if (result.outcome === "sent") {
        await ctx.runMutation(internal.notifications.markDeliveryAttempt, {
          deliveryId: delivery.deliveryId,
          outcome: "sent",
          ...(result.providerMessageId ? { providerMessageId: result.providerMessageId } : {}),
        });
        summary.sent += 1;
        continue;
      }

      if (result.outcome === "skipped") {
        await ctx.runMutation(internal.notifications.markDeliveryAttempt, {
          deliveryId: delivery.deliveryId,
          outcome: "skipped",
          error: result.error,
        });
        summary.skipped += 1;
        continue;
      }

      if (shouldRetryAfterFailure) {
        await ctx.runMutation(internal.notifications.markDeliveryAttempt, {
          deliveryId: delivery.deliveryId,
          outcome: "retry",
          error: result.error,
        });
        summary.requeued += 1;
        continue;
      }

      await ctx.runMutation(internal.notifications.markDeliveryAttempt, {
        deliveryId: delivery.deliveryId,
        outcome: "failed",
        error: result.error,
      });
      summary.failed += 1;
    }

    return summary;
  },
});
