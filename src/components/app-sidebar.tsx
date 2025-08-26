'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Calendar, Users, Heart, TrendingUp, MessageSquare } from 'lucide-react';
// import { trpc } from '@/lib/trpc';
import { useMapBounds } from '@/contexts/MapBoundsContext';
import { useMapEvents } from '@/contexts/MapEventsContext';

import { NavUser } from '@/components/nav-user';
import { ModeToggle } from '@/components/ModeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import { useAuth } from '@/hooks/useAuth';

// Navigation data for Make Waves
const navItems = [
  {
    title: 'Map View',
    url: '/map',
    icon: Map,
  },
  {
    title: 'Events',
    url: '/events',
    icon: Calendar,
  },
  {
    title: 'My Events',
    url: '/my-events',
    icon: Heart,
  },
  {
    title: 'Friends',
    url: '/friends',
    icon: Users,
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: TrendingUp,
  },
  {
    title: 'Messages',
    url: '/messages',
    icon: MessageSquare,
  },
  // Profile and settings are accessible from avatar menu; keeping Profile entry removed per request
];

import { Event } from '@/types/event';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [enableBoundsFiltering, setEnableBoundsFiltering] = React.useState(false);

  // Consume events from map context to avoid duplicate reads
  const { events, loading: eventsLoading } = useMapEvents();
  const eventsError = undefined as unknown as Error | undefined;

  // Get map bounds from context (committed by the map when searching)
  const { mapBounds } = useMapBounds();

  // Enable bounds filtering when map bounds change (indicating user interaction)
  React.useEffect(() => {
    if (pathname === '/map' && mapBounds) {
      setEnableBoundsFiltering(true);
    }
  }, [pathname, mapBounds]);

  // Filter and sort events based on search query and map bounds
  const filteredEvents = React.useMemo(() => {
    if (!events.length) return [];

    // First filter by search query
    let filtered = events.filter((event: Event) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.address?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      );
    });

    // If on map view and we have map bounds, filter events by map bounds
    if (
      pathname === '/map' &&
      mapBounds &&
      typeof google !== 'undefined' &&
      enableBoundsFiltering
    ) {
      filtered = filtered.filter((event: Event) => {
        if (
          !event.location ||
          typeof event.location.lat !== 'number' ||
          typeof event.location.lng !== 'number'
        ) {
          return false;
        }

        const eventLatLng = new google.maps.LatLng(event.location.lat, event.location.lng);
        return mapBounds.contains(eventLatLng);
      });
    }

    // Then sort by date (most recent first)
    return filtered.sort((a: Event, b: Event) => {
      // Try to parse dates if available
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    });
  }, [events, searchQuery, pathname, mapBounds, enableBoundsFiltering]);

  // Get user data for sidebar
  const userData = user
    ? {
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || '',
      }
    : {
        name: 'Guest',
        email: '',
        avatar: '',
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => router.push('/dashboard')}
              isActive={pathname === '/dashboard'}
              tooltip="Make Waves"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                  <span className="text-gray-900 text-xs font-bold">W</span>
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Make Waves</span>
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="bg-sidebar-accent/50 rounded-md px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />

        {/* Events Section - Show on map page */}
        {pathname === '/map' && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 min-h-0 flex flex-col">
            <SidebarGroupLabel className="bg-sidebar-accent/50 rounded-md px-2">
              <span>Events in View</span>
            </SidebarGroupLabel>
            <SidebarInput
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SidebarGroupContent className="flex-1 min-h-0 flex flex-col">
              {mapBounds && pathname === '/map' && (
                <div className="p-2 bg-muted/30 text-xs text-muted-foreground rounded-md mb-2">
                  Showing events in the current map view
                </div>
              )}
              {eventsLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-1 animate-pulse">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : eventsError ? (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  Failed to load events
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  {searchQuery.trim() ? 'No events match your search' : 'No events in view'}
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-y-auto rounded-md bg-sidebar-accent/30">
                  {filteredEvents.map((event: Event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex flex-col gap-1 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    >
                      <span className="font-medium text-xs truncate">{event.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {event.location?.address}
                      </span>
                      {event.category && (
                        <span className="text-xs bg-secondary px-1 py-0.5 rounded w-fit">
                          {event.category}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <NavUser user={userData} />
          </div>
          <ModeToggle />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
