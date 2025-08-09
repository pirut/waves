'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { MapPin, Calendar, Users, Tag, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapView } from '@/components/MapView';
import type { Event as EventType } from '@/types/event';
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/firebase';
import { onSnapshot, doc, collection, query, where, Unsubscribe } from 'firebase/firestore';

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

  // Realtime event data
  const [liveEvent, setLiveEvent] = useState<Event | null>(null);
  const eventId = params.id as string;
  useEffect(() => {
    if (!eventId) return;
    const ref = doc(db, 'events', eventId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) {
        const shaped = { ...(data as Record<string, unknown>) };
        delete (shaped as Record<string, unknown>).id;
        const payload = { id: snap.id, ...(shaped as Record<string, unknown>) } as unknown as Event;
        setLiveEvent(payload);
      }
    });
    return () => unsub();
  }, [eventId]);

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

  const utils = trpc.useUtils();
  const attendMutation = trpc.events.attend.useMutation({
    onSuccess: async () => {
      await utils.events.getById.invalidate({ id: params.id as string });
      await utils.events.getAttendees.invalidate({ id: params.id as string });
    },
  });
  const leaveMutation = trpc.events.leave.useMutation({
    onSuccess: async () => {
      await utils.events.getById.invalidate({ id: params.id as string });
      await utils.events.getAttendees.invalidate({ id: params.id as string });
    },
  });

  interface AttendeeUser {
    id: string;
    uid?: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  }

  // Realtime attendees from Firestore (per-UID listener; supports either doc-id===uid or 'uid' field)
  const [liveAttendees, setLiveAttendees] = useState<AttendeeUser[]>([]);
  const attendeesUnsubsRef = useRef<Unsubscribe[]>([]);

  const attendeeUids = useMemo(() => {
    const src = (liveEvent?.attendees || event?.attendees || []) as string[];
    return Array.isArray(src) ? src : [];
  }, [liveEvent?.attendees, event?.attendees]);

  useEffect(() => {
    attendeesUnsubsRef.current.forEach((u) => u());
    attendeesUnsubsRef.current = [];
    setLiveAttendees([]);

    if (attendeeUids.length === 0) return;

    const cache: Record<string, AttendeeUser> = {};

    attendeeUids.forEach((uid) => {
      // Fallback listener by 'uid' field to support setups where doc.id !== uid
      const byField = query(collection(db, 'users'), where('uid', '==', uid));
      const unsub = onSnapshot(byField, (snap) => {
        if (snap.empty) {
          delete cache[uid];
        } else {
          // Use first matching doc
          const docSnap = snap.docs[0];
          const data = docSnap.data() as Partial<AttendeeUser>;
          cache[uid] = {
            id: docSnap.id,
            uid,
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
          };
        }
        setLiveAttendees(
          Object.values(cache).sort((a, b) =>
            (a.displayName || '').localeCompare(b.displayName || '')
          )
        );
      });
      attendeesUnsubsRef.current.push(unsub);
    });

    return () => {
      attendeesUnsubsRef.current.forEach((u) => u());
      attendeesUnsubsRef.current = [];
    };
  }, [attendeeUids]);

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

  const displayEvent = (liveEvent || event)!;
  const isUserAttending = displayEvent && user && (displayEvent.attendees || []).includes(user.uid);
  const canJoin =
    displayEvent &&
    (!displayEvent.maxAttendees ||
      (displayEvent.attendees || []).length < displayEvent.maxAttendees);

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
              <CardTitle className="text-2xl mb-3">{displayEvent.title}</CardTitle>
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(displayEvent.time)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {(displayEvent.attendees || []).length} attending
                  {displayEvent.maxAttendees && ` (${displayEvent.maxAttendees} max)`}
                </div>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(displayEvent.category)}`}
            >
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {displayEvent.category}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base mb-6">{displayEvent.description}</CardDescription>

          {displayEvent.location.address && (
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <MapPin className="h-5 w-5" />
              <span>{displayEvent.location.address}</span>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {user ? (
              <>
                {isUserAttending ? (
                  <>
                    <Button variant="outline" disabled>
                      ✓ You&apos;re attending
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => leaveMutation.mutate({ id: displayEvent.id })}
                    >
                      Leave
                    </Button>
                  </>
                ) : canJoin ? (
                  <Button onClick={() => attendMutation.mutate({ id: displayEvent.id })}>
                    Join Event
                  </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <MapBoundsProvider>
                <MapView
                  interactive={false}
                  showZoomControls={false}
                  showFullscreenControl={false}
                  center={{ lat: displayEvent.location.lat, lng: displayEvent.location.lng }}
                  zoom={14}
                  minZoom={5}
                  maxZoom={19}
                  showEventMarkers
                  events={((): EventType[] => {
                    const mapEvent: EventType = {
                      id: displayEvent.id,
                      title: displayEvent.title,
                      category: displayEvent.category,
                      location: displayEvent.location,
                      attendees: displayEvent.attendees,
                    };
                    return [mapEvent];
                  })()}
                />
              </MapBoundsProvider>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Attendees ({(displayEvent.attendees || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(liveAttendees || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendees yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {liveAttendees.map((u: AttendeeUser) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.photoURL || ''} alt={u.displayName || 'User'} />
                      <AvatarFallback>{(u.displayName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium">{u.displayName || 'User'}</span>
                      {u.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
