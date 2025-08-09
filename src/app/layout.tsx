import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { TrpcProvider } from '@/components/TrpcProvider';
import { ConditionalLayout } from '@/components/conditional-layout';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Make Waves',
  description: 'Map-centric social app for real-world good.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden antialiased ${inter.variable}`}
      >
        <TrpcProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalLayout>{children}</ConditionalLayout>
          </ThemeProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
