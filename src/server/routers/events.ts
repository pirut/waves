import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { adminDb } from "@/firebaseAdmin";

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
        const eventsSnapshot = await adminDb.collection("events").get();
        return eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    }),

    getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
        const eventDoc = await adminDb.collection("events").doc(input.id).get();
        if (!eventDoc.exists) {
            throw new Error("Event not found");
        }
        return {
            id: eventDoc.id,
            ...eventDoc.data(),
        };
    }),

    create: protectedProcedure.input(eventSchema).mutation(async ({ input, ctx }) => {
        const eventData = {
            ...input,
            createdBy: ctx.user.uid,
            createdAt: new Date().toISOString(),
            attendees: [],
        };

        const docRef = await adminDb.collection("events").add(eventData);
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
            const eventDoc = await adminDb.collection("events").doc(input.id).get();
            if (!eventDoc.exists) {
                throw new Error("Event not found");
            }

            const eventData = eventDoc.data();
            if (eventData?.createdBy !== ctx.user.uid) {
                throw new Error("Unauthorized");
            }

            await adminDb
                .collection("events")
                .doc(input.id)
                .update({
                    ...input.data,
                    updatedAt: new Date().toISOString(),
                });

            return { success: true };
        }),

    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
        const eventDoc = await adminDb.collection("events").doc(input.id).get();
        if (!eventDoc.exists) {
            throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        if (eventData?.createdBy !== ctx.user.uid) {
            throw new Error("Unauthorized");
        }

        await adminDb.collection("events").doc(input.id).delete();
        return { success: true };
    }),
});
