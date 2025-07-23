'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';
import { useEffect, useState } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// No longer need breadcrumb interfaces

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate breadcrumbs from pathname
  // We've removed the breadcrumbs as requested

  // Show loading state during hydration and auth check
  if (!isMounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, show children without sidebar
  if (!user) {
    return <>{children}</>;
  }

  // If user is authenticated, show sidebar layout
  return (
    <MapBoundsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* No header for cleaner UI */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </MapBoundsProvider>
  );
}
