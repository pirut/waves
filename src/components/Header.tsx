"use client";
import { useEffect, useState } from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthWidget from "@/components/AuthWidget";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Header() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsub();
    }, []);
    // Prevent hydration mismatch by showing consistent content until mounted
    if (!isMounted) {
        return (
            <nav className="relative z-30 w-full h-16 flex items-center justify-between px-4 sm:px-8 py-2 bg-background/95 backdrop-blur-md text-foreground border-b border-border/50">
                <NavigationMenu className="flex-shrink-0">
                    <NavigationMenuList>
                        <NavigationMenuItem className="text-xl font-semibold tracking-tight">
                            <Link href="/" className="hover:underline focus:outline-none">
                                Make Waves
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
                <div className="flex items-center gap-4">
                    <Link href="/map">
                        <Button variant="outline" size="sm">
                            Find Events
                        </Button>
                    </Link>
                    <Button variant="default" size="sm">
                        Login
                    </Button>
                </div>
            </nav>
        );
    }

    return (
        <nav className="relative z-30 w-full h-14 sm:h-16 flex items-center justify-between px-3 sm:px-8 py-2 bg-background/95 backdrop-blur-md text-foreground border-b border-border/50">
            <NavigationMenu className="flex-shrink-0">
                <NavigationMenuList>
                    <NavigationMenuItem className="text-lg sm:text-xl font-semibold tracking-tight">
                        <Link href="/" className="hover:underline focus:outline-none">
                            Make Waves
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>

            {/* Auth UI in header */}
            <div className="flex items-center gap-1 sm:gap-4">
                <Link href="/map">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                        <span className="hidden sm:inline">Find Events</span>
                        <span className="sm:hidden">Map</span>
                    </Button>
                </Link>
                {currentUser ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1 rounded hover:bg-muted focus:outline-none">
                                {currentUser.photoURL && (
                                    <Image
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || currentUser.email || "User"}
                                        width={28}
                                        height={28}
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                                    />
                                )}
                                <span className="truncate max-w-[60px] sm:max-w-[100px] text-xs sm:text-sm hidden sm:inline">
                                    {currentUser.displayName || currentUser.email}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 sm:w-56" align="end">
                            <DropdownMenuLabel asChild>
                                <Link href="/account" className="hover:underline cursor-pointer">
                                    My Account
                                </Link>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/events">Upcoming Events</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut(auth)}>Sign Out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                                Login
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Sign In</DialogTitle>
                            </DialogHeader>
                            <AuthWidget />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </nav>
    );
}
