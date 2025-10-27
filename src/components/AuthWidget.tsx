/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
        } catch (err: unknown) {
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
        } catch (err: unknown) {
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
                    <div className="flex items-center gap-3">
                        {user.photoURL && (
                            <Image
                                src={user.photoURL}
                                alt={user.displayName || user.email || "User"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <span className="font-medium">{user.displayName || user.email}</span>
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
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                    {mode === "login" ? "Welcome back" : "Create an account"}
                </CardTitle>
                <CardDescription>
                    {mode === "login" ? "Sign in to continue" : "Join Make Waves to get started"}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-6 pt-2">
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                    <Button type="submit" disabled={loading} className="w-full">
                        {mode === "login" ? "Sign In" : "Sign Up"}
                    </Button>
                </form>

                <div className="relative">
                    <Separator className="my-2" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card px-2 text-xs text-muted-foreground">
                        or
                    </div>
                </div>

                <Button onClick={handleGoogle} variant="outline" disabled={loading} className="w-full">
                    Sign in with Google
                </Button>

                <div className="text-xs text-center text-muted-foreground">
                    {mode === "login" ? (
                        <span>
                            Don&apos;t have an account?{' '}
                            <button className="underline underline-offset-2 hover:text-foreground" onClick={() => setMode("signup")}>
                                Sign up
                            </button>
                        </span>
                    ) : (
                        <span>
                            Already have an account?{' '}
                            <button className="underline underline-offset-2 hover:text-foreground" onClick={() => setMode("login")}>
                                Sign in
                            </button>
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
