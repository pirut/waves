/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function AuthWidget() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const user = auth.currentUser;

    async function handleEmailAuth(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setError("");
        setLoading(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (err: any) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignOut() {
        await signOut(auth);
    }

    if (user) {
        return (
            <Card className="w-full max-w-md my-4">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <div className="flex items-center gap-2">
                        {user.photoURL && (
                            <Image
                                src={user.photoURL}
                                alt={user.displayName || user.email || "User"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <span>{user.displayName || user.email}</span>
                    </div>
                    <Button onClick={handleSignOut} variant="secondary">
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md my-4">
            <CardContent className="flex flex-col gap-4 p-6">
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-2">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded px-3 py-2"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded px-3 py-2"
                        required
                    />
                    <Button type="submit" disabled={loading} className="w-full mt-2">
                        {mode === "login" ? "Sign In" : "Sign Up"}
                    </Button>
                </form>
                <Button onClick={handleGoogle} variant="outline" disabled={loading} className="w-full">
                    Sign in with Google
                </Button>
                <div className="text-xs text-center">
                    {mode === "login" ? (
                        <span>
                            Don&apos;t have an account?{" "}
                            <button className="underline" onClick={() => setMode("signup")}>
                                Sign up
                            </button>
                        </span>
                    ) : (
                        <span>
                            Already have an account?{" "}
                            <button className="underline" onClick={() => setMode("login")}>
                                Sign in
                            </button>
                        </span>
                    )}
                </div>
                {error && <div className="text-red-500 text-xs text-center">{error}</div>}
            </CardContent>
        </Card>
    );
}
