'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Event, EVENT_CATEGORIES } from '@/types/event';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Search, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { EventImage } from '@/components/EventImage';
import { format, parseISO, isPast, isFuture } from 'date-fns';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const { data: events = [], isLoading } = trpc.events.getAll.useQuery({
    limit: 100,
    upcoming: timeFilter === 'upcoming' ? true : timeFilter === 'past' ? false : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery.trim() || undefined,
  });

  // Client-side filtering for additional filters
  const filteredEvents = useMemo(() => {
    return events.filter((event: Event) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.address?.toLowerCase().includes(query) ||
          event.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Time filter
      if (timeFilter !== 'all' && event.time) {
        const eventDate = parseISO(event.time);
        if (timeFilter === 'upcoming' && isPast(eventDate)) return false;
        if (timeFilter === 'past' && isFuture(eventDate)) return false;
      }

      return true;
    });
  }, [events, searchQuery, timeFilter]);



  const formatEventTime = (dateString?: string) => {
    if (!dateString) return 'TBD';
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const isEventPast = isPast(date);
      
      if (isEventPast) {
        return `Ended ${format(date, 'MMM d')}`;
      }
      
      const daysDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        return `Today at ${format(date, 'h:mm a')}`;
      } else if (daysDiff === 1) {
        return `Tomorrow at ${format(date, 'h:mm a')}`;
      } else if (daysDiff < 7) {
        return `${format(date, 'EEEE')} at ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d • h:mm a');
      }
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Environmental: 'bg-green-100 text-green-800 hover:bg-green-200',
      'Community Service': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      Education: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Health & Wellness': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'Arts & Culture': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Social Justice': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Animal Welfare': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      'Disaster Relief': 'bg-red-100 text-red-800 hover:bg-red-200',
      'Youth Development': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Senior Support': 'bg-violet-100 text-violet-800 hover:bg-violet-200',
      Technology: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      'Sports & Recreation': 'bg-lime-100 text-lime-800 hover:bg-lime-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getEventStatus = (event: Event) => {
    if (!event.time) return null;
    
    try {
      const eventDate = parseISO(event.time);
      const now = new Date();
      
      if (isPast(eventDate)) {
        return { label: 'Past', color: 'bg-gray-100 text-gray-600' };
      }
      
      const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        return { label: 'Today', color: 'bg-red-100 text-red-800' };
      } else if (daysDiff === 1) {
        return { label: 'Tomorrow', color: 'bg-orange-100 text-orange-800' };
      } else if (daysDiff <= 7) {
        return { label: 'This Week', color: 'bg-yellow-100 text-yellow-800' };
      }
      
      return null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-muted animate-pulse" />
              <CardHeader className="p-4">
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Discover and join community events near you
          </p>
        </div>
        <Link href="/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search events, locations, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={setTimeFilter as any}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || selectedCategory !== 'all' || timeFilter !== 'upcoming') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setTimeFilter('upcoming');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event: Event) => {
          const status = getEventStatus(event);
          
          return (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Image */}
              <EventImage
                src={event.coverImage || event.images?.[0]}
                alt={event.title || 'Event image'}
                size="md"
                className="rounded-t-lg rounded-b-none"
              />

              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2 flex-1">
                    {event.title}
                  </CardTitle>
                  {status && (
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  )}
                </div>
                
                {event.category && (
                  <Badge
                    variant="outline"
                    className={getCategoryColor(event.category)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {event.category}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-0 pb-2">
                <div className="space-y-2">
                  {/* Date and Time */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{formatEventTime(event.time)}</span>
                  </div>

                  {/* Location */}
                  {event.location?.address && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{event.location.address}</span>
                    </div>
                  )}

                  {/* Attendees */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {event.attendees?.length || 0} attending
                      {event.maxAttendees && ` (${event.maxAttendees} max)`}
                    </span>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {event.description}
                    </p>
                  )}

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
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
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery || selectedCategory !== 'all' || timeFilter !== 'upcoming'
              ? 'No events found'
              : 'No events available'}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {searchQuery || selectedCategory !== 'all' || timeFilter !== 'upcoming'
              ? 'Try adjusting your filters to find more events.'
              : 'There are no events available at the moment. Be the first to create one!'}
          </p>
          <div className="flex gap-2">
            {(searchQuery || selectedCategory !== 'all' || timeFilter !== 'upcoming') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setTimeFilter('upcoming');
                }}
              >
                Clear Filters
              </Button>
            )}
            <Link href="/events/create">
              <Button>Create an Event</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
