import { router } from '../trpc';
import { eventsRouter } from './events';
import { usersRouter } from './users';
import { postsRouter } from './posts';
import { publicProcedure } from '../trpc';
import { adminDb } from '@/firebaseAdmin';

export const appRouter = router({
  events: eventsRouter,
  users: usersRouter,
  posts: postsRouter,
  stats: publicProcedure.query(async () => {
    const fallbackCount = async (collectionName: string): Promise<number> => {
      try {
        const counted: { data: () => { count?: number } } = await adminDb
          .collection(collectionName)
          .count()
          .get();
        return counted.data().count ?? 0;
      } catch {
        const snap = await adminDb.collection(collectionName).get();
        return snap.size;
      }
    };

    const [eventsCount, usersCount] = await Promise.all([
      fallbackCount('events'),
      fallbackCount('users'),
    ]);

    return { eventsCount, usersCount };
  }),
});

export type AppRouter = typeof appRouter;
