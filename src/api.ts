// src/api.ts

export async function fetchEvents() {
    const res = await fetch("/api/events");
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
}

export async function fetchEvent(id: string) {
    const res = await fetch(`/api/events/${id}`);
    if (!res.ok) throw new Error("Failed to fetch event");
    return res.json();
}

export async function createEvent(data: unknown) {
    const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create event");
    return res.json();
}

export async function updateEvent(id: string, data: unknown) {
    const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update event");
    return res.json();
}

export async function deleteEvent(id: string) {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete event");
    return res.json();
}

// USERS
export async function fetchUsers() {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function fetchUser(id: string) {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
}

export async function createUser(data: unknown) {
    const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create user");
    return res.json();
}

export async function updateUser(id: string, data: unknown) {
    const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update user");
    return res.json();
}

export async function deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user");
    return res.json();
}

// POSTS
export async function fetchPosts() {
    const res = await fetch("/api/posts");
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
}

export async function fetchPost(id: string) {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) throw new Error("Failed to fetch post");
    return res.json();
}

export async function createPost(data: unknown) {
    const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create post");
    return res.json();
}

export async function updatePost(id: string, data: unknown) {
    const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update post");
    return res.json();
}

export async function deletePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete post");
    return res.json();
}
