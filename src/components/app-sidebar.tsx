'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Map,
  Calendar,
  Users,
  User,
  Settings,
  Heart,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useMapBounds } from '@/contexts/MapBoundsContext';

import { NavUser } from '@/components/nav-user';
import { Label } from '@/components/ui/label';
import { ModeToggle } from '@/components/ModeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

import { Event } from '@/types/event';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = React.useState(navItems[0]);
  const [showUpcoming, setShowUpcoming] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { setOpen } = useSidebar();

  // Fetch events from Firebase using tRPC
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = trpc.events.getAll.useQuery();

  // Get map bounds from context
  const { mapBounds } = useMapBounds();

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
    if (pathname === '/map' && mapBounds && typeof google !== 'undefined') {
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
  }, [events, searchQuery, pathname, mapBounds]);

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

  // Update active item based on current pathname
  React.useEffect(() => {
    const currentItem = navItems.find((item) => item.url === pathname);
    if (currentItem) {
      setActiveItem(currentItem);
    }
  }, [pathname]);

  const handleNavClick = (item: (typeof navItems)[0]) => {
    setActiveItem(item);
    router.push(item.url);
    setOpen(true);
  };

  return (
    <TooltipProvider>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        {...props}
      >
        {/* Main Navigation Sidebar */}
        <Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_2px)] border-r">
          <SidebarHeader className="flex flex-row md:justify-center justify-baseline items-center w-full p-2">
            <div className="md:hidden flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    onClick={() => router.push('/')}
                    className="h-10 w-10 p-0 justify-center items-center !text-center"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                        <span className="text-gray-900 text-xs font-bold">W</span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </TooltipTrigger>
              </Tooltip>
            </div>
            <div className="md:hidden flex items-center">
              <span className="font-semibold text-sm">Make Waves</span>
            </div>
            <SidebarMenu className="md:flex hidden justify-center w-full m-0">
              <SidebarMenuItem className="flex justify-center items-center w-full list-none">
                <div className="flex justify-center items-center w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        onClick={() => router.push('/')}
                        className="h-10 w-10 p-0 justify-center items-center !text-center group-data-[collapsible=icon]:w-10"
                      >
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                          <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                            <span className="text-gray-900 text-xs font-bold">W</span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="text-center">
                        <p className="font-semibold">Make Waves</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-1.5 md:px-0">
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => handleNavClick(item)}
                        isActive={activeItem?.title === item.title}
                        className="px-3 md:px-3"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="flex md:flex-col flex-row md:gap-2 gap-0 items-center md:justify-center justify-between w-full p-2">
            <div className="md:hidden flex gap-1 justify-between items-baseline w-full">
              <NavUser user={userData} />
              <ModeToggle />
            </div>
            <SidebarMenu className="md:flex hidden justify-center w-full m-0">
              <SidebarMenuItem className="flex justify-center items-center w-full list-none">
                <div className="flex justify-center items-center w-full">
                  <NavUser user={userData} />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="md:flex hidden justify-center w-full">
              <ModeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Secondary Content Sidebar */}
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-5">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">
                {pathname === '/map' ? 'Events in View' : activeItem?.title}
              </div>
              <Label className="flex items-center gap-2 text-sm">
                <span>Upcoming</span>
                <Switch
                  className="shadow-none"
                  checked={showUpcoming}
                  onCheckedChange={setShowUpcoming}
                />
              </Label>
            </div>
            <SidebarInput
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {pathname === '/map' && (
                  <div className="p-3 bg-muted/30 text-xs text-muted-foreground border-b">
                    {mapBounds
                      ? 'Showing events in the current map view'
                      : 'Move the map to see events in that area'}
                  </div>
                )}
                {eventsLoading ? (
                  <div className="flex flex-col gap-4 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-3 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/5"></div>
                        </div>
                        <div className="h-5 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : eventsError ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Failed to load events
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {pathname === '/map'
                      ? 'No events in the current map view'
                      : searchQuery.trim()
                        ? 'No events match your search'
                        : 'No events available'}
                  </div>
                ) : (
                  filteredEvents
                    .filter((event: Event) => {
                      // If showing all upcoming events, show everything
                      if (showUpcoming) return true;

                      // Otherwise only show today's events
                      const eventDate = event.date || '';
                      return eventDate.toLowerCase().includes('today');
                    })
                    .slice(0, 5) // Limit to 5 events for better performance
                    .map((event: Event) => (
                      <Link
                        href={`/events/${event.id}`}
                        key={event.id}
                        className="flex flex-col items-start gap-2 border-b p-5 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {event.date ||
                              (event.createdAt && new Date(event.createdAt).toLocaleDateString())}
                          </span>
                        </div>
                        <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.location?.address}</span>
                          <span className="ml-auto">{event.attendees?.length || 0} attending</span>
                        </div>
                        {event.category && (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                            {event.category}
                          </span>
                        )}
                      </Link>
                    ))
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
    </TooltipProvider>
  );
}
