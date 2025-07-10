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
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsub();
    }, []);
    return (
        <nav className="fixed top-0 z-30 w-full h-16 flex flex-col sm:flex-row items-center justify-between px-2 sm:px-6 bg-white/80 backdrop-blur-md gap-2 sm:gap-0">
            <NavigationMenu className="flex-1 w-full sm:w-auto">
                <NavigationMenuList>
                    <NavigationMenuItem className="text-xl font-semibold tracking-tight">
                        <Link href="/" className="hover:underline focus:outline-none">
                            Make Waves
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            {/* Auth UI in header */}
            <div className="flex items-center gap-2 sm:gap-4 ml-0 sm:ml-4 w-full sm:w-auto justify-end">
                {currentUser ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 focus:outline-none">
                                {currentUser.photoURL && (
                                    <Image
                                        src={currentUser.photoURL}
                                        alt={currentUser.displayName || currentUser.email || "User"}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <span className="truncate max-w-[100px]">{currentUser.displayName || currentUser.email}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/events">Upcoming Events</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/posts">Posts</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut(auth)}>Sign Out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="default" size="sm">
                                Login
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
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
