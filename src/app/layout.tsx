import type { Metadata } from "next";
import "./globals.css";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = {
    title: "Make Waves",
    description: "Map-centric social app for real-world good.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-[#FFE5D4] text-[#7F8C8D] font-sans flex flex-col">
                {/* Nav Bar */}
                <nav className="sticky top-0 z-30 w-full h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-[#F6E8D6] shadow-sm">
                    <NavigationMenu className="flex-1">
                        <NavigationMenuList>
                            <NavigationMenuItem className="text-xl font-semibold tracking-tight">Make Waves</NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                    <Avatar className="ml-4">
                        <AvatarFallback>MW</AvatarFallback>
                    </Avatar>
                </nav>
                {/* Main Content */}
                <div className="flex-1 h-full min-h-0 flex flex-col">{children}</div>
                {/* Footer */}
                <footer className="sticky bottom-0 z-20 w-full h-12 flex items-center justify-center bg-white/80 backdrop-blur-md border-t border-[#F6E8D6] text-xs text-[#7F8C8D]">
                    &copy; {new Date().getFullYear()} Make Waves
                </footer>
            </body>
        </html>
    );
}
