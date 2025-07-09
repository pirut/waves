import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../firebaseAdmin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

// GET /api/events - List all events
export async function GET() {
    const snapshot = await adminDb.collection("events").get();
    const events = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(events);
}

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
    const data = await req.json();
    // Optionally: validate data here
    const docRef = await adminDb.collection("events").add(data);
    const newDoc = await docRef.get();
    return NextResponse.json({ id: newDoc.id, ...newDoc.data() });
}
