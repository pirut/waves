import { z } from "zod";

export const createEventInputSchema = z.object({
  title: z.string().trim().min(4, "Event title is too short"),
  description: z.string().trim().min(20, "Add more context in the description"),
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
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  impactSummary: z.string().trim().optional(),
  capacity: z.number().int().positive().optional(),
  galleryImageUrls: z.array(z.string().trim().url()).optional(),
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;
