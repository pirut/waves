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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Client-side fallback: redirect unauthenticated users from protected routes
  useEffect(() => {
    if (!isMounted || loading) return;

    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(() => {
      const protectedRoutes = [
        '/dashboard',
        '/map',
        '/events',
        '/friends',
        '/messages',
        '/profile',
        '/settings',
        '/account',
        '/activity',
        '/my-events',
      ];

      const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route));

      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 ConditionalLayout Debug:', {
          pathname,
          user: !!user,
          loading,
          isProtectedRoute,
          isMounted,
          hasCheckedAuth,
        });
      }

      // Only redirect if we're certain the user is not authenticated and we're on a protected route
      if (!user && isProtectedRoute && !loading) {
        console.log(
          '🔄 ConditionalLayout: Redirecting unauthenticated user from',
          pathname,
          'to homepage'
        );
        router.replace('/');
      }

      setHasCheckedAuth(true);
    }, 200); // Small delay to ensure auth state is stable

    return () => clearTimeout(timer);
  }, [isMounted, loading, user, pathname, router]);

  // Show loading state during hydration and auth check
  if (!isMounted || loading || !hasCheckedAuth) {
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
