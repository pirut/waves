"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import AuthWidget from "@/components/AuthWidget";
import EventList from "@/components/EventList";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from "next/image";

// Post interface to match the data structure
interface Post {
    id: string;
    content?: string;
    caption?: string;
    mediaUrl?: string;
    eventId?: string;
    authorId?: string;
    createdAt?: string;
}

export default function Home() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<unknown>(null);

    // Use tRPC to fetch posts
    const { data: posts = [], isLoading: loadingPosts } = trpc.posts.getAll.useQuery() as {
        data: Post[];
        isLoading: boolean;
    };

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

    return (
        <div className="flex flex-col min-h-screen px-2 sm:px-4">
            {!currentUser ? (
                <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full py-4">
                    <Card className="max-w-md w-full backdrop-blur-md shadow-xl border-none mb-4 md:mb-0">
                        <CardHeader className="flex flex-col items-center gap-2">
                            <CardTitle className="text-center">Make Waves</CardTitle>
                            <CardDescription className="subtitle max-w-md text-center">
                                Discover, attend, and share real-world events focused on doing good. Every post is rooted in real-life impact.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6 p-0">
                            <Button className="w-full max-w-xs py-4 md:py-6" onClick={() => router.push("/map")} variant="default" size="lg">
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
                    <AuthWidget />
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-8 w-full px-2 sm:px-4 py-4 sm:py-8 mx-auto max-w-4xl">
                    {/* Welcome Section */}
                    <div className="text-center py-8">
                        <h1 className="text-3xl font-bold mb-4">Welcome back, {currentUser.displayName || currentUser.email}!</h1>
                        <p className="subtitle text-lg mb-6">Ready to make some waves? Discover events near you or create your own.</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => router.push("/map")} size="lg">
                                Explore Map
                            </Button>
                            <Button onClick={() => router.push("/profile")} variant="outline" size="lg">
                                My Profile
                            </Button>
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="section-title">Upcoming Events</h2>
                            <Button onClick={() => router.push("/map")} variant="outline" size="sm">
                                View All
                            </Button>
                        </div>
                        <EventList limit={6} showCreateButton={true} />
                    </div>

                    {/* Recent Posts Section (keeping for later when posts are implemented) */}
                    <div className="w-full">
                        <h2 className="section-title mb-4">Recent Community Posts</h2>
                        {loadingPosts ? (
                            <div className="text-center py-8 subtitle">Loading posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-80">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="60" cy="60" r="56" fill="#D4E9FF" stroke="#B6D0E2" strokeWidth="4" />
                                    <ellipse cx="60" cy="80" rx="28" ry="8" fill="#B6D0E2" />
                                    <path d="M45 65 Q60 90 75 65" stroke="currentColor" strokeWidth="3" fill="none" />
                                    <rect x="48" y="48" width="24" height="16" rx="3" fill="currentColor" />
                                    <rect x="54" y="54" width="12" height="4" rx="2" fill="#B6D0E2" />
                                </svg>
                                <div className="mt-6 subtitle text-center">
                                    No posts yet.
                                    <br />
                                    Attend an event to share your first wave!
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {posts.slice(0, 6).map((post) => (
                                    <Card key={post.id} className="p-4">
                                        <CardHeader className="p-0">
                                            {post.mediaUrl && (
                                                <Image
                                                    src={post.mediaUrl || ""}
                                                    alt={post.caption || ""}
                                                    width={400}
                                                    height={160}
                                                    className="w-full h-32 object-cover rounded mb-2"
                                                />
                                            )}
                                            <CardTitle className="font-semibold mb-1 text-sm">{post.caption}</CardTitle>
                                            <CardDescription className="text-xs subtitle">Event: {post.eventId}</CardDescription>
                                        </CardHeader>
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
