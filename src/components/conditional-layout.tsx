'use client';

import { useAuth } from '@/hooks/useAuth';
import { SidebarLayout } from '@/components/sidebar-layout';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect unauthenticated users to landing page for protected routes
  useEffect(() => {
    if (!isMounted || loading) return;
    if (user) return;
    const publicPaths = new Set<string>(['/', '/login']);
    if (!publicPaths.has(pathname || '/')) {
      router.replace('/');
    }
  }, [isMounted, loading, user, pathname, router]);

  // Show loading state during hydration and auth check
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, use sidebar layout
  if (user) {
    return <SidebarLayout>{children}</SidebarLayout>;
  }

  // If user is not authenticated, use traditional header/footer layout
  return (
    <>
      <Header />
      <Separator className="bg-[#F6E8D6] hidden sm:block" />
      <main className="flex-1 flex flex-col">{children}</main>
      <Separator className="bg-[#F6E8D6] hidden sm:block" />
      <Footer />
    </>
  );
}
