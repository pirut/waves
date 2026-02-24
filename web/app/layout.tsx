import type { Metadata } from "next";
import { Bodoni_Moda, Source_Sans_3 } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const displayFont = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Make Waves Web",
  description: "A dedicated web experience for Make Waves backed by the same Convex data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
