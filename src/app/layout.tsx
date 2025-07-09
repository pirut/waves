import type { Metadata } from "next";
import "./globals.css";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Make Waves",
    description: "Map-centric social app for real-world good.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-[#FFE5D4] text-[#7F8C8D] font-sans flex flex-col">
                {/* Nav Bar */}
                <nav className="sticky top-0 z-30 w-full h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md">
                    <NavigationMenu className="flex-1">
                        <NavigationMenuList>
                            <NavigationMenuItem className="text-xl font-semibold tracking-tight">Make Waves</NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                    <Avatar className="ml-4">
                        <AvatarFallback>MW</AvatarFallback>
                    </Avatar>
                </nav>
                <Separator className="bg-[#F6E8D6]" />
                {/* Main Content */}
                <div className="flex-1 h-full min-h-0 flex flex-col">{children}</div>
                <Separator className="bg-[#F6E8D6]" />
                {/* Footer */}
                <Card className="fixed bottom-0 left-0 z-20 w-full h-12 rounded-none shadow-none bg-white/80 backdrop-blur-md border-none">
                    <CardContent className="flex items-center justify-center h-full p-0 text-xs text-[#7F8C8D]">
                        &copy; {new Date().getFullYear()} Make Waves
                    </CardContent>
                </Card>
            </body>
        </html>
    );
}
