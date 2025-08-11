'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, ExternalLink, UserMinus } from 'lucide-react';
import { Event } from '@/types/event';
import { useRouter } from 'next/navigation';

interface UpcomingEventsSectionProps {
  events: Event[];
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  const router = useRouter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Time TBD';
    return timeString;
  };

  const getTimeUntilEvent = (dateString?: string, timeString?: string) => {
    if (!dateString) return null;
    try {
      const eventDate = new Date(`${dateString} ${timeString || '00:00'}`);
      const now = new Date();
      const diffTime = eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Past event';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days`;
      return `${Math.ceil(diffDays / 7)} weeks`;
    } catch {
      return null;
    }
  };

  const EventCard = ({ event }: { event: Event }) => {
    const timeUntil = getTimeUntilEvent(event.date, event.time);

    return (
      <Card className="flex-shrink-0 w-80 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <CardContent className="p-6">
          {/* Date ribbon */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 text-center">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg">
                <div className="text-xs font-medium uppercase">
                  {formatDate(event.date).split(' ')[0]}
                </div>
                <div className="text-lg font-bold">{formatDate(event.date).split(' ')[1]}</div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base mb-1 line-clamp-2">{event.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {event.description || 'No description available'}
              </p>

              {event.category && (
                <Badge variant="secondary" className="text-xs">
                  {event.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Event details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatTime(event.time)}</span>
              {timeUntil && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {timeUntil}
                </Badge>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              <span>{event.attendees?.length || 0} attending</span>
              {event.maxAttendees && (
                <span className="text-muted-foreground"> / {event.maxAttendees} max</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <UserMinus className="w-4 h-4 mr-1" />
              Leave
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">My Upcoming Events</CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push('/my-events')}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No upcoming events</p>
            <p className="text-sm mb-4">Join some events to see them here</p>
            <Button onClick={() => router.push('/events')}>Browse Events</Button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
            {events.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
