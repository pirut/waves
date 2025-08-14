'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';
import { MapEventsProvider } from '@/contexts/MapEventsContext';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// No longer need breadcrumb interfaces

// Component to manage sidebar state based on current path
function SidebarController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    // Only enforce closed state on first load of dashboard; let user control thereafter
    if (pathname === '/dashboard') setOpen(false);
  }, [pathname, setOpen]);

  // Close the mobile sheet after route changes so destination content is visible
  useEffect(() => {
    if (!isMobile) return;
    setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  return <>{children}</>;
}

function FloatingSidebarToggle() {
  return (
    <SidebarTrigger
      aria-label="Toggle Sidebar"
      className="shadow bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 size-7"
    />
  );
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if we're on the map page (needs full map layout)
  const isMapPage = pathname === '/map';

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
  const isDashboardPage = pathname === '/dashboard';

  return (
    <MapBoundsProvider>
      <MapEventsProvider>
        <SidebarProvider defaultOpen={!isDashboardPage}>
          <SidebarController>
            <AppSidebar />
            <SidebarInset>
              {/* No header for cleaner UI */}
              {/* Floating sidebar toggle button */}
              <PositionedFloatingToggle />
              {isMapPage ? (
                // Map page takes full space without padding
                <div className="flex flex-1 flex-col h-screen">{children}</div>
              ) : (
                // Other pages use normal padding
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
              )}
            </SidebarInset>
          </SidebarController>
        </SidebarProvider>
      </MapEventsProvider>
    </MapBoundsProvider>
  );
}

// Removed state-based absolute positioning in favor of placing the trigger within the inset area,
// matching shadcn's example pattern for reliability.

function PositionedFloatingToggle() {
  const { state, isMobile, openMobile } = useSidebar();
  // Align with the mobile sheet close (X). Sheet width is 22rem; X sits at right-4.
  // Button is ~1.75rem wide, so left = 22rem - 1rem - 1.75rem = 22rem - 2.75rem
  const leftValue = isMobile
    ? openMobile
      ? 'calc(22rem - 2.75rem)'
      : '0.75rem'
    : state === 'collapsed'
      ? 'calc(var(--sidebar-width-icon) + 0.75rem)'
      : 'calc(var(--sidebar-width) + 0.75rem)';

  return (
    <div
      className="fixed top-3 z-[200] pointer-events-auto transition-[left,transform,opacity] duration-300 ease-out"
      style={{ left: leftValue } as React.CSSProperties}
    >
      <FloatingSidebarToggle />
    </div>
  );
}
