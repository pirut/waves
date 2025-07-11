import type { Metadata } from "next";
import "./globals.css";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
    title: "Make Waves",
    description: "Map-centric social app for real-world good.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col font-sans bg-background text-foreground">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {/* Nav Bar */}
                    <Header />
                    <Separator className="bg-[#F6E8D6]" />
                    {/* Main Content */}
                    <main className="flex-1 flex flex-col px-2 sm:px-4 md:px-8 pt-2">{children}</main>
                    <Separator className="bg-[#F6E8D6]" />
                    {/* Footer */}
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
