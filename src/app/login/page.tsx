"use client";
import AuthWidget from "@/components/AuthWidget";

export default function LoginPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold mb-4">Sign In to Make Waves</h1>
            <AuthWidget />
        </main>
    );
}
