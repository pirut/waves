/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { fetchUsers, fetchPosts } from "../api";
import AuthWidget from "@/components/AuthWidget";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from "next/image";

export default function Home() {
    const router = useRouter();
    const [users, setUsers] = useState<{ id: string; name?: string; profilePhotoUrl?: string }[]>([]);
    const [posts, setPosts] = useState<{ id: string; caption?: string; mediaUrl?: string; userId?: string; eventId?: string }[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const introCardRef = useRef<HTMLDivElement>(null);
    const [introCardHeight, setIntroCardHeight] = useState<number | undefined>(undefined);
    const [hasMounted, setHasMounted] = useState(false);
    // Sync user to Firestore on sign-in
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        name: user.displayName || user.email,
                        profilePhotoUrl: user.photoURL || "",
                        email: user.email,
                        createdAt: new Date().toISOString(),
                    });
                }
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        setLoadingUsers(true);
        fetchUsers()
            .then(setUsers)
            .finally(() => setLoadingUsers(false));
        setLoadingPosts(true);
        fetchPosts()
            .then(setPosts)
            .finally(() => setLoadingPosts(false));
    }, []);

    useLayoutEffect(() => {
        if (introCardRef.current) {
            setIntroCardHeight(introCardRef.current.offsetHeight);
        }
    }, [currentUser, loadingUsers, loadingPosts]);

    return (
        <div className="flex flex-col min-h-screen px-2 sm:px-4">
            {!currentUser ? (
                <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full py-4">
                    <Card ref={introCardRef} className="max-w-md w-full bg-card backdrop-blur-md shadow-xl border-none mb-4 md:mb-0">
                        <CardContent className="flex flex-col items-center gap-6 p-6 md:p-8">
                            <div className="flex flex-col items-center gap-2">
                                <h1 className="text-5xl font-bold text-foreground tracking-tight text-center">Make Waves</h1>
                                <p className="text-lg text-muted-foreground max-w-md text-center">
                                    Discover, attend, and share real-world events focused on doing good. Every post is rooted in real-life impact.
                                </p>
                            </div>
                            <Button className="w-full max-w-xs text-lg py-4 md:py-6" onClick={() => router.push("/map")} variant="default" size="lg">
                                Find Events Near You
                            </Button>
                            <Button className="w-full max-w-xs flex items-center gap-2 text-lg py-4 md:py-6" variant="secondary" size="lg">
                                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_17_40)">
                                        <path
                                            d="M47.5 24.5C47.5 22.8333 47.3333 21.1667 47 19.5833H24V28.9167H37.3333C36.6667 32.0833 34.6667 34.75 31.8333 36.5833V41.0833H39.5C44 37.0833 47.5 31.3333 47.5 24.5Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M24 48C30.5 48 36.0833 45.9167 39.5 41.0833L31.8333 36.5833C29.9167 37.9167 27.5 38.75 24 38.75C17.8333 38.75 12.5 34.5833 10.6667 29.0833H2.83334V33.75C6.25 41.0833 14.5 48 24 48Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M10.6667 29.0833C10.1667 27.75 10 26.3333 10 24.9167C10 23.5 10.1667 22.0833 10.6667 20.75V16.0833H2.83334C1.5 18.75 0.75 21.75 0.75 24.9167C0.75 28.0833 1.5 31.0833 2.83334 33.75L10.6667 29.0833Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M24 9.25C27.9167 9.25 31.0833 10.5833 33.25 12.5833L39.6667 6.16667C36.0833 2.91667 30.5 0.75 24 0.75C14.5 0.75 6.25 7.66667 2.83334 16.0833L10.6667 20.75C12.5 15.25 17.8333 9.25 24 9.25Z"
                                            fill="currentColor"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_17_40">
                                            <rect width="48" height="48" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                Sign in with Google
                            </Button>
                        </CardContent>
                    </Card>
                    <Card
                        className="max-w-md w-full bg-card backdrop-blur-md shadow-xl border-none flex flex-col"
                        style={hasMounted && introCardHeight ? { height: introCardHeight } : {}}
                    >
                        <CardContent className="flex flex-col justify-center h-full p-6 md:p-8">
                            <AuthWidget />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-8 w-full px-2 sm:px-4 py-4 sm:py-8 mx-auto max-w-5xl">
                    {/* User Feed */}
                    <div className="w-full">
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Users</h2>
                        {loadingUsers ? (
                            <div>Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-80">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="60" cy="60" r="56" fill="#F6E8D6" stroke="#E1CFC2" strokeWidth="4" />
                                    <ellipse cx="60" cy="80" rx="28" ry="8" fill="#E1CFC2" />
                                    <path d="M40 60 Q60 80 80 60" stroke="currentColor" strokeWidth="3" fill="none" />
                                    <circle cx="50" cy="54" r="4" fill="currentColor" />
                                    <circle cx="70" cy="54" r="4" fill="currentColor" />
                                </svg>
                                <div className="mt-6 text-lg text-muted-foreground text-center">
                                    No users yet.
                                    <br />
                                    Be the first to join Make Waves!
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {users.map((user) => (
                                    <Card key={user.id} className="flex items-center gap-4 p-4 bg-card text-foreground">
                                        {user.profilePhotoUrl && (
                                            <Image
                                                src={user.profilePhotoUrl || ""}
                                                alt={user.name || ""}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        )}
                                        <span>{user.name || user.id}</span>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Post Feed */}
                    <div className="w-full">
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Posts</h2>
                        {loadingPosts ? (
                            <div>Loading posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-80">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="60" cy="60" r="56" fill="#D4E9FF" stroke="#B6D0E2" strokeWidth="4" />
                                    <ellipse cx="60" cy="80" rx="28" ry="8" fill="#B6D0E2" />
                                    <path d="M45 65 Q60 90 75 65" stroke="currentColor" strokeWidth="3" fill="none" />
                                    <rect x="48" y="48" width="24" height="16" rx="3" fill="currentColor" />
                                    <rect x="54" y="54" width="12" height="4" rx="2" fill="#B6D0E2" />
                                </svg>
                                <div className="mt-6 text-lg text-muted-foreground text-center">
                                    No posts yet.
                                    <br />
                                    Be the first to make a wave!
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {posts.map((post) => (
                                    <Card key={post.id} className="p-4 bg-card text-foreground">
                                        {post.mediaUrl && (
                                            <Image
                                                src={post.mediaUrl || ""}
                                                alt={post.caption || ""}
                                                width={400}
                                                height={160}
                                                className="w-full h-32 sm:h-40 object-cover rounded mb-2"
                                            />
                                        )}
                                        <div className="font-semibold mb-1">{post.caption}</div>
                                        <div className="text-xs text-muted-foreground">
                                            User: {post.userId} | Event: {post.eventId}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
