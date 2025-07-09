import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../firebaseAdmin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

// GET /api/posts - List all posts
export async function GET() {
    const snapshot = await adminDb.collection("posts").get();
    const posts = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(posts);
}

// POST /api/posts - Create a new post
export async function POST(req: NextRequest) {
    const data = await req.json();
    // Optionally: validate data here
    const docRef = await adminDb.collection("posts").add(data);
    const newDoc = await docRef.get();
    return NextResponse.json({ id: newDoc.id, ...newDoc.data() });
}
