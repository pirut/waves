'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { MapPin, Calendar, Users, Tag, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  time: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  attendees: string[];
  maxAttendees?: number;
  createdBy: string;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: event,
    isLoading: loading,
    error,
  } = trpc.events.getById.useQuery({ id: params.id as string }, { enabled: !!params.id }) as {
    data: Event | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Environmental: 'bg-green-100 text-green-800',
      'Community Service': 'bg-blue-100 text-blue-800',
      Education: 'bg-purple-100 text-purple-800',
      'Health & Wellness': 'bg-pink-100 text-pink-800',
      'Arts & Culture': 'bg-yellow-100 text-yellow-800',
      'Social Justice': 'bg-orange-100 text-orange-800',
      'Animal Welfare': 'bg-emerald-100 text-emerald-800',
      'Disaster Relief': 'bg-red-100 text-red-800',
      'Youth Development': 'bg-indigo-100 text-indigo-800',
      'Senior Support': 'bg-violet-100 text-violet-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isUserAttending = event && user && event.attendees.includes(user.uid);
  const canJoin = event && (!event.maxAttendees || event.attendees.length < event.maxAttendees);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button onClick={() => router.back()} variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message ||
                'The event you&apos;re looking for doesn&apos;t exist or has been removed.'}
            </p>
            <Button onClick={() => router.push('/map')}>Explore Events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{event.title}</CardTitle>
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(event.time)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {event.attendees.length} attending
                  {event.maxAttendees && ` (${event.maxAttendees} max)`}
                </div>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}
            >
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {event.category}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">{event.description}</CardDescription>

          {event.location.address && (
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="h-5 w-5" />
              <span>{event.location.address}</span>
            </div>
          )}

          <div className="flex gap-3">
            {user ? (
              <>
                {isUserAttending ? (
                  <Button variant="outline" disabled>
                    ✓ You&apos;re attending
                  </Button>
                ) : canJoin ? (
                  <Button>Join Event</Button>
                ) : (
                  <Button disabled>Event Full</Button>
                )}
                <Button variant="outline">Share Event</Button>
              </>
            ) : (
              <Button onClick={() => router.push('/login')}>Sign in to Join</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map placeholder - can be enhanced later */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Map view coming soon</p>
              <p className="text-sm">
                Coordinates: {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
