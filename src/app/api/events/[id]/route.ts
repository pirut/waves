import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../firebaseAdmin";

// GET /api/events/[id] - Get a specific event
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const doc = await adminDb.collection("events").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

// PUT /api/events/[id] - Update a specific event
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await req.json();
        await adminDb.collection("events").doc(id).update(data);

        const updatedDoc = await adminDb.collection("events").doc(id).get();
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

// DELETE /api/events/[id] - Delete a specific event
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await adminDb.collection("events").doc(id).delete();
        return NextResponse.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
