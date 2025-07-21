import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { adminDb } from '@/firebaseAdmin';

const postSchema = z.object({
  content: z.string().min(1),
  eventId: z.string(),
  imageUrl: z.string().optional(),
});

export const postsRouter = router({
  getAll: publicProcedure.query(async () => {
    const postsSnapshot = await adminDb.collection('posts').orderBy('createdAt', 'desc').get();
    return postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const postDoc = await adminDb.collection('posts').doc(input.id).get();
    if (!postDoc.exists) {
      throw new Error('Post not found');
    }
    return {
      id: postDoc.id,
      ...postDoc.data(),
    };
  }),

  getByEventId: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const postsSnapshot = await adminDb
        .collection('posts')
        .where('eventId', '==', input.eventId)
        .orderBy('createdAt', 'desc')
        .get();

      return postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),

  create: protectedProcedure.input(postSchema).mutation(async ({ input, ctx }) => {
    // Verify user attended the event
    const userDoc = await adminDb.collection('users').doc(ctx.user.uid).get();
    const userData = userDoc.data();

    if (!userData?.attendedEvents?.includes(input.eventId)) {
      throw new Error('You can only post about events you have attended');
    }

    const postData = {
      ...input,
      authorId: ctx.user.uid,
      createdAt: new Date().toISOString(),
      likes: [],
    };

    const docRef = await adminDb.collection('posts').add(postData);
    return {
      id: docRef.id,
      ...postData,
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: postSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const postDoc = await adminDb.collection('posts').doc(input.id).get();
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      if (postData?.authorId !== ctx.user.uid) {
        throw new Error('Unauthorized');
      }

      await adminDb
        .collection('posts')
        .doc(input.id)
        .update({
          ...input.data,
          updatedAt: new Date().toISOString(),
        });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const postDoc = await adminDb.collection('posts').doc(input.id).get();
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      if (postData?.authorId !== ctx.user.uid) {
        throw new Error('Unauthorized');
      }

      await adminDb.collection('posts').doc(input.id).delete();
      return { success: true };
    }),
});
