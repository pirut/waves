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
  Moon,
  Sun,
} from 'lucide-react';

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

// Sample recent events data
const recentEvents = [
  {
    id: '1',
    title: 'Beach Cleanup Miami',
    location: 'South Beach, Miami',
    date: 'Today 2:00 PM',
    attendees: 24,
    category: 'Environmental',
  },
  {
    id: '2',
    title: 'Community Garden Project',
    location: 'Wynwood, Miami',
    date: 'Tomorrow 10:00 AM',
    attendees: 15,
    category: 'Community Service',
  },
  {
    id: '3',
    title: 'Youth Mentorship Program',
    location: 'Downtown Miami',
    date: 'This Weekend',
    attendees: 8,
    category: 'Youth Development',
  },
  {
    id: '4',
    title: 'Senior Center Visit',
    location: 'Coral Gables',
    date: 'Next Week',
    attendees: 12,
    category: 'Senior Support',
  },
  {
    id: '5',
    title: 'Food Bank Volunteer',
    location: 'Little Haiti',
    date: 'Next Friday',
    attendees: 18,
    category: 'Community Service',
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = React.useState(navItems[0]);
  const [events] = React.useState(recentEvents);
  const [showUpcoming, setShowUpcoming] = React.useState(true);
  const { setOpen } = useSidebar();

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
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* Main Navigation Sidebar */}
      <Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => router.push('/')}
                className="md:h-8 md:p-0"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
                    <span className="text-gray-900 text-xs font-bold">W</span>
                  </div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Make Waves</span>
                  <span className="truncate text-xs">Social Impact</span>
                </div>
              </SidebarMenuButton>
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
                      className="px-2.5 md:px-2"
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
        <SidebarFooter className="flex flex-col gap-2">
          <NavUser user={userData} />
          <div className="px-2.5 md:px-2 flex justify-center">
            <ModeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Secondary Content Sidebar */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">{activeItem?.title}</div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Upcoming</span>
              <Switch
                className="shadow-none"
                checked={showUpcoming}
                onCheckedChange={setShowUpcoming}
              />
            </Label>
          </div>
          <SidebarInput placeholder="Search events..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {events
                .filter((event) => (showUpcoming ? true : event.date.includes('Today')))
                .map((event) => (
                  <Link
                    href={`/events/${event.id}`}
                    key={event.id}
                    className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="font-medium">{event.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{event.date}</span>
                    </div>
                    <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                      <span>{event.location}</span>
                      <span className="ml-auto">{event.attendees} attending</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                      {event.category}
                    </span>
                  </Link>
                ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
