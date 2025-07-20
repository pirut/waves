"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import Link from "next/link";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthWidget from "@/components/AuthWidget";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
        return () => unsub();
    }, []);

    if (!isMounted) {
        return (
            <header className="h-16 bg-white border-b border-[#F6E8D6] flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                        <span className="text-gray-900 text-sm font-bold">W</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">Waves Map</span>
                </div>
            </header>
        );
    }

    const navItems = [
        { name: "Map View", href: "/map", active: pathname === "/map" },
        { name: "Event List", href: "/events", active: pathname === "/events" },
        { name: "Event Detail", href: "/events/detail", active: pathname.startsWith("/events/") && pathname !== "/events" },
        { name: "User Profile", href: "/profile", active: pathname === "/profile" },
        { name: "Settings", href: "/settings", active: pathname === "/settings" },
    ];

    return (
        <header className="h-16 bg-white border-b border-[#F6E8D6] flex items-center justify-between px-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                    <span className="text-gray-900 text-sm font-bold">W</span>
                </div>
                <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
                    Waves Map
                </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`text-sm font-medium transition-colors ${
                            item.active 
                                ? "text-gray-900 border-b-2 border-[#FFE5D4] pb-4" 
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {item.name}
                    </Link>
                ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="hover:bg-[#FFE5D4]/20">
                    <Search className="h-4 w-4" />
                </Button>
                
                {currentUser ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-[#FFE5D4]/20">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || ""} />
                                    <AvatarFallback className="bg-[#FFE5D4] text-gray-900">
                                        {currentUser.displayName?.[0] || currentUser.email?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 border-[#F6E8D6]" align="end">
                            <DropdownMenuItem asChild>
                                <Link href="/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#F6E8D6]" />
                            <DropdownMenuItem onClick={() => signOut(auth)}>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#FFE5D4] hover:bg-[#F6E8D6] text-gray-900">
                                Login
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-md border-[#F6E8D6]">
                            <DialogHeader>
                                <DialogTitle>Sign In</DialogTitle>
                            </DialogHeader>
                            <AuthWidget />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </header>
    );
}
