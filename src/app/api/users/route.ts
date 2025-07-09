import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../firebaseAdmin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

// GET /api/users - List all users
export async function GET() {
    const snapshot = await adminDb.collection("users").get();
    const users = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(users);
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
    const data = await req.json();
    // Optionally: validate data here
    const docRef = await adminDb.collection("users").add(data);
    const newDoc = await docRef.get();
    return NextResponse.json({ id: newDoc.id, ...newDoc.data() });
}
