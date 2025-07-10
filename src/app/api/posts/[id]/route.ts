// Use global Request/Response types
import { adminDb } from "../../../../firebaseAdmin";

// GET /api/posts/[id] - Get post by ID
export async function GET(request: Request) {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() ?? "";
    const doc = await adminDb.collection("posts").doc(id).get();
    if (!doc.exists) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ id: doc.id, ...doc.data() }), { status: 200, headers: { "Content-Type": "application/json" } });
}

// PUT /api/posts/[id] - Update post by ID
export async function PUT(request: Request) {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() ?? "";
    const data = await request.json();
    await adminDb.collection("posts").doc(id).update(data);
    const updated = await adminDb.collection("posts").doc(id).get();
    return new Response(JSON.stringify({ id: updated.id, ...updated.data() }), { status: 200, headers: { "Content-Type": "application/json" } });
}

// DELETE /api/posts/[id] - Delete post by ID
export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() ?? "";
    await adminDb.collection("posts").doc(id).delete();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
