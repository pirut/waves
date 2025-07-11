"use client";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import Image from "next/image";
import AuthWidget from "@/components/AuthWidget";

export default function ProfilePage() {
    const [user, setUser] = useState(() => auth.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    if (!user) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-3xl font-bold mb-4">Profile</h1>
                <p className="mb-4">Please sign in to view your profile.</p>
                <AuthWidget />
            </main>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
            <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-card shadow">
                {user.photoURL && (
                    <Image src={user.photoURL} alt={user.displayName || user.email || "User"} width={80} height={80} className="w-20 h-20 rounded-full" />
                )}
                <div className="text-lg font-semibold text-foreground">{user.displayName || user.email}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
        </main>
    );
}
