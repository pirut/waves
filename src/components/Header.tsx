"use client";
import { useEffect, useState } from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsub();
    }, []);
    return (
        <nav className="sticky top-0 z-30 w-full h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md">
            <NavigationMenu className="flex-1">
                <NavigationMenuList>
                    <NavigationMenuItem className="text-xl font-semibold tracking-tight">
                        <Link href="/" className="hover:underline focus:outline-none">
                            Make Waves
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            {/* Auth UI in header */}
            <div className="flex items-center gap-4 ml-4">
                {currentUser ? (
                    <>
                        {currentUser.photoURL && (
                            <Image
                                src={currentUser.photoURL}
                                alt={currentUser.displayName || currentUser.email || "User"}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                            />
                        )}
                        <Button variant="secondary" size="sm" onClick={() => signOut(auth)}>
                            Sign Out
                        </Button>
                    </>
                ) : (
                    <Button variant="default" size="sm" onClick={() => (window.location.href = "/#auth")}>
                        Login
                    </Button>
                )}
            </div>
        </nav>
    );
}
