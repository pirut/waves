import type { Metadata } from "next";
import "./globals.css";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { TrpcProvider } from "@/components/TrpcProvider";

export const metadata: Metadata = {
    title: "Make Waves",
    description: "Map-centric social app for real-world good.",
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 3,
        userScalable: true,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden">
                <TrpcProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        {/* Nav Bar */}
                        <Header />
                        <Separator className="bg-[#F6E8D6] hidden sm:block" />
                        {/* Main Content */}
                        <main className="flex-1 flex flex-col">{children}</main>
                        <Separator className="bg-[#F6E8D6] hidden sm:block" />
                        {/* Footer */}
                        <Footer />
                    </ThemeProvider>
                </TrpcProvider>
            </body>
        </html>
    );
}
