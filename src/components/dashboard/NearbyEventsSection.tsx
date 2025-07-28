'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Eye } from 'lucide-react';
import { Event } from '@/types/event';
import { useRouter } from 'next/navigation';
import { MiniMapView } from './MiniMapView';

interface NearbyEventsSectionProps {
  events: Event[];
}

export function NearbyEventsSection({ events }: NearbyEventsSectionProps) {
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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Nearby Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mini Map */}
          <div className="order-2 lg:order-1">
            <MiniMapView events={events} className="h-[300px]" />
          </div>

          {/* Events List */}
          <div className="order-1 lg:order-2 space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No nearby events found</p>
                <p className="text-sm">Try expanding your search area</p>
              </div>
            ) : (
              events.slice(0, 5).map((event) => <EventCard key={event.id} event={event} />)
            )}

            {events.length > 5 && (
              <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/map')}>
                View All Nearby Events
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
