import { z } from "zod";

export const CREATE_EVENT_MIN_DESCRIPTION_CHARS = 20;

export const createEventInputSchema = z.object({
  title: z.string().trim().min(4, "Event title is too short"),
  description: z
    .string()
    .trim()
    .min(
      CREATE_EVENT_MIN_DESCRIPTION_CHARS,
      `Add more context in the description (minimum ${CREATE_EVENT_MIN_DESCRIPTION_CHARS} characters).`,
    ),
  category: z.string().trim().min(2),
  startAt: z.number().positive(),
  endAt: z.number().positive(),
  timezone: z.string().trim().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressLine1: z.string().trim().min(4),
  city: z.string().trim().min(2),
  region: z.string().trim().optional(),
  country: z.string().trim().min(2),
  postalCode: z.string().trim().optional(),
  impactSummary: z.string().trim().optional(),
  capacity: z.number().int().positive().optional(),
}).refine((input) => input.endAt > input.startAt, {
  message: "End time must be after start time.",
  path: ["endAt"],
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;
