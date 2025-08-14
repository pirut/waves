'use client';

import { trpc } from '@/lib/trpc';
import { Event } from '@/types/event';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { MapView } from '@/components/MapView';
import { Badge } from '@/components/ui/badge';

export default function EventsPage() {
  const { data: events = [], isLoading } = trpc.events.getAll.useQuery();

  const formatDate = (date?: string) => {
    if (!date) return 'Date TBA';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Events</h1>
        <Button>Create Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: Event) => {
          const hasCoords =
            typeof event.location?.lat === 'number' && typeof event.location?.lng === 'number';
          return (
            <Card key={event.id} className="overflow-hidden">
              {/* Static mini map at top of card */}
              <div className="relative h-40">
                {hasCoords ? (
                  <MapView
                    className="h-full pointer-events-none select-none"
                    events={[event]}
                    interactive={false}
                    showZoomControls={false}
                    showFullscreenControl={false}
                    gestureHandling="none"
                    showClickOverlay={false}
                    showUserLocation={false}
                    showInfoWindows={false}
                    useVectorMap={false}
                    center={{ lat: event.location!.lat, lng: event.location!.lng }}
                    zoom={13}
                    minZoom={5}
                    maxZoom={18}
                  />
                ) : (
                  <div className="h-full bg-muted flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                {/* Overlay gradient and category badge */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/25" />
                {event.category && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                      {event.category}
                    </Badge>
                  </div>
                )}
                {/* Location overlay */}
                {event.location?.address && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-xs text-white/90 drop-shadow">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.location.address}</span>
                  </div>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {event.location?.address || 'Location TBA'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{event.attendees?.length || 0} attendees</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2">
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}

        {events.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              There are no events available at the moment.
            </p>
            <Button>Create an Event</Button>
          </div>
        )}
      </div>
    </div>
  );
}
