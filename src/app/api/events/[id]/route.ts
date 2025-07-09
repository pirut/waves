import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../firebaseAdmin";

// GET /api/events/[id] - Get event by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const doc = await adminDb.collection("events").doc(params.id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ id: doc.id, ...doc.data() });
}

// PUT /api/events/[id] - Update event by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const data = await req.json();
    await adminDb.collection("events").doc(params.id).update(data);
    const updated = await adminDb.collection("events").doc(params.id).get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
}

// DELETE /api/events/[id] - Delete event by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await adminDb.collection("events").doc(params.id).delete();
    return NextResponse.json({ success: true });
}
