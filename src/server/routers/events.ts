import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { adminDb } from '@/firebaseAdmin';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  time: z.string(), // ISO string for event date/time
  maxAttendees: z.number().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
  requirements: z.array(z.string()).optional(),
  ageRestriction: z.object({
    min: z.number().min(0).optional(),
    max: z.number().max(120).optional(),
  }).optional(),
  cost: z.object({
    amount: z.number().min(0).optional(),
    currency: z.string().default('USD'),
    description: z.string().optional(),
  }).optional(),
  duration: z.object({
    hours: z.number().min(0).max(24).optional(),
    minutes: z.number().min(0).max(59).optional(),
  }).optional(),
});

export const eventsRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
      category: z.string().optional(),
      search: z.string().optional(),
      tags: z.array(z.string()).optional(),
      upcoming: z.boolean().optional(),
    }).optional())
    .query(async ({ input = {} }) => {
      let query = adminDb.collection('events');
      
      // Filter by category
      if (input.category) {
        query = query.where('category', '==', input.category);
      }
      
      // Filter upcoming events
      if (input.upcoming) {
        const now = new Date().toISOString();
        query = query.where('time', '>=', now);
      }
      
      // Order by time (newest first for past events, earliest first for upcoming)
      query = query.orderBy('time', input.upcoming ? 'asc' : 'desc');
      
      // Apply pagination
      if (input.offset && input.offset > 0) {
        query = query.offset(input.offset);
      }
      query = query.limit(input.limit);
      
      const eventsSnapshot = await query.get();
      let events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Apply client-side filters that Firestore can't handle
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        events = events.filter((event: any) => 
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.address?.toLowerCase().includes(searchLower)
        );
      }
      
      if (input.tags && input.tags.length > 0) {
        events = events.filter((event: any) => 
          event.tags?.some((tag: string) => input.tags!.includes(tag))
        );
      }
      
      return events;
    }),

  getByBounds: publicProcedure
    .input(
      z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
        limit: z.number().min(1).max(200).optional().default(100),
        upcoming: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = adminDb.collection('events');
      
      // Filter upcoming events
      if (input.upcoming) {
        const now = new Date().toISOString();
        query = query.where('time', '>=', now);
      }
      
      const eventsSnapshot = await query
        .where('location.lat', '>=', input.south)
        .where('location.lat', '<=', input.north)
        .limit(input.limit)
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

  getUserEvents: protectedProcedure
    .input(z.object({
      type: z.enum(['created', 'attending']).optional().default('created'),
      upcoming: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      let query = adminDb.collection('events');
      
      if (input.type === 'created') {
        query = query.where('createdBy', '==', ctx.user.uid);
      } else {
        query = query.where('attendees', 'array-contains', ctx.user.uid);
      }
      
      if (input.upcoming) {
        const now = new Date().toISOString();
        query = query.where('time', '>=', now);
      }
      
      query = query.orderBy('time', 'asc');
      
      const eventsSnapshot = await query.get();
      return eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),

  create: protectedProcedure.input(eventSchema).mutation(async ({ input, ctx }) => {
    // Validate that event time is in the future
    const eventTime = new Date(input.time);
    if (eventTime <= new Date()) {
      throw new Error('Event time must be in the future');
    }

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
        throw new Error('Unauthorized: You can only edit events you created');
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
        throw new Error('Unauthorized: You can only delete events you created');
      }

      await adminDb.collection('events').doc(input.id).delete();
      return { success: true };
    }),

  join: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const eventDoc = await adminDb.collection('events').doc(input.id).get();
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      const attendees = eventData?.attendees || [];
      
      // Check if user is already attending
      if (attendees.includes(ctx.user.uid)) {
        throw new Error('You are already attending this event');
      }
      
      // Check if event is full
      if (eventData?.maxAttendees && attendees.length >= eventData.maxAttendees) {
        throw new Error('Event is full');
      }
      
      // Check if event is in the past
      if (eventData?.time && new Date(eventData.time) <= new Date()) {
        throw new Error('Cannot join past events');
      }

      await adminDb.collection('events').doc(input.id).update({
        attendees: [...attendees, ctx.user.uid],
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  leave: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const eventDoc = await adminDb.collection('events').doc(input.id).get();
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      const attendees = eventData?.attendees || [];
      
      // Check if user is attending
      if (!attendees.includes(ctx.user.uid)) {
        throw new Error('You are not attending this event');
      }

      await adminDb.collection('events').doc(input.id).update({
        attendees: attendees.filter((uid: string) => uid !== ctx.user.uid),
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  getAttendees: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const eventDoc = await adminDb.collection('events').doc(input.id).get();
      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      const attendeeIds = eventData?.attendees || [];
      
      if (attendeeIds.length === 0) {
        return [];
      }

      // Get user details for attendees (simplified - you might want to get this from a users collection)
      return attendeeIds.map((uid: string) => ({ id: uid, email: `user-${uid}@example.com` }));
    }),
});
