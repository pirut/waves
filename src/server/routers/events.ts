import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { adminDb } from '@/firebaseAdmin';

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  date: z.string(),
  maxAttendees: z.number().optional(),
});

export const eventsRouter = router({
  getAll: publicProcedure.query(async () => {
    const eventsSnapshot = await adminDb.collection('events').get();
    const events = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return events;
  }),

  getDashboardEvents: publicProcedure
    .input(
      z
        .object({
          userLat: z.number(),
          userLng: z.number(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      let bounds;

      if (input) {
        // Create bounds around user's location (roughly 50 mile radius)
        const radiusInDegrees = 0.7; // Approximately 50 miles
        bounds = {
          north: input.userLat + radiusInDegrees,
          south: input.userLat - radiusInDegrees,
          east: input.userLng + radiusInDegrees,
          west: input.userLng - radiusInDegrees,
        };
      } else {
        // Default bounds for Florida area (covers most of Florida)
        bounds = {
          north: 31.0, // Northern Florida
          south: 24.5, // Southern Florida
          east: -80.0, // Eastern Florida
          west: -87.5, // Western Florida
        };
      }

      const eventsSnapshot = await adminDb
        .collection('events')
        .where('location.lat', '>=', bounds.south)
        .where('location.lat', '<=', bounds.north)
        .get();

      // Filter by longitude in memory since Firestore doesn't support multiple range queries
      const events = eventsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((event) => {
          const eventData = event as { location?: { lng: number } };
          const lng = eventData.location?.lng;
          return lng !== undefined && lng >= bounds.west && lng <= bounds.east;
        });

      return events;
    }),

  getByBounds: publicProcedure
    .input(
      z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
      })
    )
    .query(async ({ input }) => {
      const eventsSnapshot = await adminDb
        .collection('events')
        .where('location.lat', '>=', input.south)
        .where('location.lat', '<=', input.north)
        .get();

      // Filter by longitude in memory since Firestore doesn't support multiple range queries
      const events = eventsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((event) => {
          const eventData = event as { location?: { lng: number } };
          const lng = eventData.location?.lng;
          return lng !== undefined && lng >= input.west && lng <= input.east;
        });

      return events;
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const eventDoc = await adminDb.collection('events').doc(input.id).get();
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    return {
      id: eventDoc.id,
      ...eventDoc.data(),
    };
  }),

  create: protectedProcedure.input(eventSchema).mutation(async ({ input, ctx }) => {
    // Filter out undefined values to avoid Firestore errors
    const cleanInput = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined)
    );

    const eventData = {
      ...cleanInput,
      createdBy: ctx.user.uid,
      createdAt: new Date().toISOString(),
      attendees: [],
    };

    const docRef = await adminDb.collection('events').add(eventData);
    return {
      id: docRef.id,
      ...eventData,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: eventSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const eventDoc = await adminDb.collection('events').doc(input.id).get();
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      if (eventData?.createdBy !== ctx.user.uid) {
        throw new Error('Unauthorized');
      }

      // Filter out undefined values to avoid Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(input.data).filter(([, value]) => value !== undefined)
      );

      await adminDb
        .collection('events')
        .doc(input.id)
        .update({
          ...cleanData,
          updatedAt: new Date().toISOString(),
        });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const eventDoc = await adminDb.collection('events').doc(input.id).get();
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      if (eventData?.createdBy !== ctx.user.uid) {
        throw new Error('Unauthorized');
      }

      await adminDb.collection('events').doc(input.id).delete();
      return { success: true };
    }),
});
