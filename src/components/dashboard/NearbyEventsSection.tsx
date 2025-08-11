'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Eye } from 'lucide-react';
import { Event } from '@/types/event';
import { useRouter } from 'next/navigation';
import { MapView } from '../MapView';

interface NearbyEventsSectionProps {
  events: Event[];
  isLoading?: boolean;
}

export function NearbyEventsSection({ events, isLoading = false }: NearbyEventsSectionProps) {
  const router = useRouter();

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
            {event.category || 'General'}
          </Badge>
        </div>

        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="line-clamp-1">{event.location?.address || 'Location TBD'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="w-3 h-3 mr-1" />
            <span>{event.attendees?.length || 0} attending</span>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              className="h-7 px-2 text-xs bg-primary hover:bg-primary/90"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              Join
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EventCardSkeleton = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 ml-2" />
        </div>

        <div className="flex items-center mb-3">
          <Skeleton className="w-3 h-3 mr-1" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Skeleton className="w-3 h-3 mr-1" />
            <Skeleton className="h-3 w-16" />
          </div>

          <div className="flex gap-1">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-7 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Events Near You ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mini Map */}
          <div className="order-2 lg:order-1">
            <MapView
              events={events}
              className="h-[400px]"
              interactive={false}
              showZoomControls={false}
              showFullscreenControl={false}
              gestureHandling="cooperative"
              zoom={10}
              minZoom={8}
              maxZoom={14}
              showClickOverlay={true}
              overlayClickAction={() => (window.location.href = '/map')}
              overlayTitle="Click to open full map"
              emptyStateComponent={
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events in current view</p>
                  <p className="text-xs">Pan or zoom the map to see events</p>
                </div>
              }
            />
          </div>

          {/* Events List */}
          <div className="order-1 lg:order-2">
            {isLoading ? (
              // Show skeleton loading state
              <div className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 h-[340px]">
                  <div className="space-y-3 pr-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <EventCardSkeleton key={index} />
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground h-[400px] flex flex-col items-center justify-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events in current view</p>
                <p className="text-sm">Pan or zoom the map to see events</p>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 h-[340px]">
                  <div className="space-y-3 pr-4">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-3">
                  <Button variant="outline" className="w-full" onClick={() => router.push('/map')}>
                    View All on Map ({events.length} events)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
