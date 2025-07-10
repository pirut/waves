 
import type { Metadata } from "next";
import "./globals.css";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: "Make Waves",
    description: "Map-centric social app for real-world good.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-[#FFE5D4] text-[#7F8C8D] font-sans flex flex-col">
                {/* Nav Bar */}
                <Header />
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
