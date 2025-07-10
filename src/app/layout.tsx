import type { Metadata } from "next";
import "./globals.css";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
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
                <div className="flex-1 h-full min-h-0 flex flex-col px-2 sm:px-4 md:px-8 pt-2 pb-16 md:pb-0">{children}</div>
                <Separator className="bg-[#F6E8D6]" />
                {/* Footer */}
                <Footer />
            </body>
        </html>
    );
}
