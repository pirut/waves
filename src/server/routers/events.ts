import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { adminDb, adminAuth } from '@/firebaseAdmin';

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

// Simple in-memory cache with short TTL to reduce repeated reads
type CacheEntry<T> = { data: T; exp: number };
const cache = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 30_000; // 30s

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, exp: Date.now() + TTL_MS });
}

function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export const eventsRouter = router({
  getAll: publicProcedure.query(async () => {
    const key = 'events:getAll';
    const cached = cacheGet<typeof events>(key);
    if (cached) return cached;
    const eventsSnapshot = await adminDb.collection('events').get();
    const events = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    cacheSet(key, events);
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

      const key = `events:getDashboard:${JSON.stringify(bounds)}`;
      const cached = cacheGet<typeof events>(key);
      if (cached) return cached;
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

      cacheSet(key, events);
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
      const key = `events:getByBounds:${input.north}:${input.south}:${input.east}:${input.west}`;
      const cached = cacheGet<typeof events>(key);
      if (cached) return cached;
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

      cacheSet(key, events);
      return events;
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const key = `events:getById:${input.id}`;
    const cached = cacheGet<Record<string, unknown>>(key);
    if (cached) return cached;
    const eventDoc = await adminDb.collection('events').doc(input.id).get();
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    const result = {
      id: eventDoc.id,
      ...eventDoc.data(),
    };
    cacheSet(key, result);
    return result;
  }),

  getAttendees: publicProcedure
    .input(z.object({ id: z.string(), uids: z.array(z.string()).optional() }))
    .query(async ({ input }) => {
      let attendeeUids: string[] = Array.isArray(input.uids) ? input.uids : [];
      if (attendeeUids.length === 0) {
        const eventDoc = await adminDb.collection('events').doc(input.id).get();
        if (!eventDoc.exists) {
          throw new Error('Event not found');
        }
        const data = eventDoc.data() as { attendees?: string[] } | undefined;
        attendeeUids = data?.attendees || [];
      }
      if (attendeeUids.length === 0) return [];

      // Fetch user profiles for attendees (chunk to avoid Firestore 'in' limit)
      const chunkSize = 10;
      const chunks: string[][] = [];
      for (let i = 0; i < attendeeUids.length; i += chunkSize) {
        chunks.push(attendeeUids.slice(i, i + chunkSize));
      }

      const results: Array<Record<string, unknown>> = [];
      const foundUids = new Set<string>();
      for (const chunk of chunks) {
        const snap = await adminDb.collection('users').where('uid', 'in', chunk).get();
        snap.docs.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const uid = (data.uid as string) || doc.id;
          foundUids.add(uid);
          results.push({
            id: doc.id,
            uid,
            // normalize to common fields used by client
            displayName: (data.displayName as string) || (data.name as string) || undefined,
            email: (data.email as string) || undefined,
            photoURL: (data.photoURL as string) || (data.profilePhotoUrl as string) || undefined,
          });
        });
      }

      // Fallback: for any remaining UIDs without a user doc, use Firebase Auth profile
      const missing = attendeeUids.filter((uid) => !foundUids.has(uid));
      if (missing.length > 0) {
        // Limit parallelism to avoid throttling
        const concurrency = 5;
        for (let i = 0; i < missing.length; i += concurrency) {
          const slice = missing.slice(i, i + concurrency);
          const authUsers = await Promise.all(
            slice.map(async (uid) => {
              try {
                const user = await adminAuth.getUser(uid);
                return {
                  id: uid,
                  uid,
                  displayName: user.displayName ?? undefined,
                  email: user.email ?? undefined,
                  photoURL: user.photoURL ?? undefined,
                } as Record<string, unknown>;
              } catch {
                return { id: uid, uid } as Record<string, unknown>;
              }
            })
          );
          results.push(...authUsers);
        }
      }

      return results;
    }),

  attend: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ref = adminDb.collection('events').doc(input.id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Event not found');
      const data = snap.data() as { attendees?: string[]; maxAttendees?: number };
      const attendees = Array.isArray(data.attendees) ? [...data.attendees] : [];
      if (attendees.includes(ctx.user.uid)) {
        return { success: true, alreadyJoined: true };
      }
      if (typeof data.maxAttendees === 'number' && attendees.length >= data.maxAttendees) {
        throw new Error('Event is full');
      }
      attendees.push(ctx.user.uid);
      await ref.update({ attendees, updatedAt: new Date().toISOString() });
      // Invalidate caches impacted by attendees change
      invalidateCache('events:');
      return { success: true };
    }),

  leave: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
    const ref = adminDb.collection('events').doc(input.id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Event not found');
    const data = snap.data() as { attendees?: string[] };
    const attendees = (Array.isArray(data.attendees) ? data.attendees : []).filter(
      (uid) => uid !== ctx.user.uid
    );
    await ref.update({ attendees, updatedAt: new Date().toISOString() });
    invalidateCache('events:');
    return { success: true };
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
    invalidateCache('events:');
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

      invalidateCache('events:');
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
      invalidateCache('events:');
      return { success: true };
    }),
});
