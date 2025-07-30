import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { adminDb, isFirebaseInitialized } from "@/firebaseAdmin";

const userSchema = z.object({
    displayName: z.string().optional(),
    email: z.string().email(),
    photoURL: z.string().optional(),
    bio: z.string().optional(),
});

export const usersRouter = router({
    getAll: publicProcedure.query(async () => {
        if (!isFirebaseInitialized() || !adminDb) {
            throw new Error('Firebase not initialized');
        }
        
        const usersSnapshot = await adminDb.collection("users").get();
        return usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    }),

    getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
        if (!isFirebaseInitialized() || !adminDb) {
            throw new Error('Firebase not initialized');
        }
        
        const userDoc = await adminDb.collection("users").doc(input.id).get();
        if (!userDoc.exists) {
            throw new Error("User not found");
        }
        return {
            id: userDoc.id,
            ...userDoc.data(),
        };
    }),

    create: protectedProcedure.input(userSchema).mutation(async ({ input, ctx }) => {
        if (!isFirebaseInitialized() || !adminDb) {
            throw new Error('Firebase not initialized');
        }
        
        const userData = {
            ...input,
            uid: ctx.user.uid,
            createdAt: new Date().toISOString(),
            friends: [],
            attendedEvents: [],
            badges: [],
        };

        await adminDb.collection("users").doc(ctx.user.uid).set(userData);
        return userData;
    }),

    update: protectedProcedure.input(userSchema.partial()).mutation(async ({ input, ctx }) => {
        if (!isFirebaseInitialized() || !adminDb) {
            throw new Error('Firebase not initialized');
        }
        
        await adminDb
            .collection("users")
            .doc(ctx.user.uid)
            .update({
                ...input,
                updatedAt: new Date().toISOString(),
            });

        return { success: true };
    }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
        if (!isFirebaseInitialized() || !adminDb) {
            throw new Error('Firebase not initialized');
        }
        
        const userDoc = await adminDb.collection("users").doc(ctx.user.uid).get();
        if (!userDoc.exists) {
            return null;
        }
        return {
            id: userDoc.id,
            ...userDoc.data(),
        };
    }),
});
