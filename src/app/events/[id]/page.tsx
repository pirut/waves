'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { MapPin, Calendar, Users, Tag, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapView } from '@/components/MapView';
import type { Event as EventType } from '@/types/event';
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';
import { useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

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

  const eventId = params.id as string;
  const { data: attendeeProfiles } = trpc.events.getAttendees.useQuery(
    { id: eventId, uids: (event?.attendees as string[]) || [] },
    { enabled: !!eventId }
  );

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

  // Category color badge not used after redesign

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

  const [attendeesParent] = useAutoAnimate({ duration: 250, easing: 'ease-out' });

  const attendeeUids = useMemo(() => {
    const src = (event?.attendees || []) as string[];
    return Array.isArray(src) ? src : [];
  }, [event?.attendees]);

  const attendeesList = useMemo(() => {
    const profileMap = new Map<string, AttendeeUser>(
      ((attendeeProfiles as Array<Record<string, unknown>>) || []).map((p) => {
        const id = (p.id as string) || '';
        const uid = (p.uid as string) || id;
        const displayName = (p.displayName as string) || (p.name as string) || undefined;
        const photoURL = (p.photoURL as string) || (p.profilePhotoUrl as string) || undefined;
        return [uid, { id, uid, displayName, email: (p.email as string) || undefined, photoURL }];
      })
    );

    const ordered: AttendeeUser[] = [];
    attendeeUids.forEach((uid) => {
      const userFromProfiles = profileMap.get(uid);
      ordered.push(userFromProfiles || ({ id: uid, uid } as AttendeeUser));
    });
    return ordered.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [attendeeUids, attendeeProfiles]);

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

  const displayEvent = event!;
  const isUserAttending = displayEvent && user && (displayEvent.attendees || []).includes(user.uid);
  const canJoin =
    displayEvent &&
    (!displayEvent.maxAttendees ||
      (displayEvent.attendees || []).length < displayEvent.maxAttendees);

  const handleShare = () => {
    const shareData = {
      title: displayEvent.title,
      text: displayEvent.description || 'Check out this event',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard && typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  const handleAttend = () => attendMutation.mutate({ id: displayEvent.id });
  const handleLeave = () => leaveMutation.mutate({ id: displayEvent.id });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl mb-2 md:mb-3 leading-snug">
                {displayEvent.title}
              </CardTitle>
              <div className="flex flex-col gap-2 text-muted-foreground md:flex-row md:items-center md:gap-6 mb-2 md:mb-4">
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Calendar className="h-5 w-5" />
                  {formatDate(displayEvent.time)}
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <Users className="h-5 w-5" />
                  {(displayEvent.attendees || []).length} attending
                  {displayEvent.maxAttendees && ` (${displayEvent.maxAttendees} max)`}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {displayEvent.category}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm md:text-base mb-4 md:mb-6">
            {displayEvent.description}
          </CardDescription>

          {displayEvent.location.address && (
            <div className="flex items-center gap-2 text-muted-foreground mb-4 md:mb-6">
              <MapPin className="h-5 w-5" />
              <span>{displayEvent.location.address}</span>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {user ? (
              <>
                {isUserAttending ? (
                  <>
                    <Button variant="outline" disabled className="w-full md:w-auto">
                      ✓ You&apos;re attending
                    </Button>
                    <Button variant="ghost" onClick={handleLeave} className="w-full md:w-auto">
                      Leave
                    </Button>
                  </>
                ) : canJoin ? (
                  <Button onClick={handleAttend} className="w-full md:w-auto">
                    Join Event
                  </Button>
                ) : (
                  <Button disabled className="w-full md:w-auto">
                    Event Full
                  </Button>
                )}
                <Button variant="outline" onClick={handleShare} className="w-full md:w-auto">
                  Share Event
                </Button>
              </>
            ) : (
              <Button onClick={() => router.push('/login')} className="w-full md:w-auto">
                Sign in to Join
              </Button>
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
            <div className="h-64 md:h-80">
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
            {attendeeUids.length === 0 && attendeesList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendees yet.</p>
            ) : (
              <div ref={attendeesParent} className="flex flex-col gap-3">
                {attendeesList.map((u) => {
                  const primaryName =
                    u.displayName ||
                    (u.email ? u.email.split('@')[0] : undefined) ||
                    u.uid ||
                    'User';
                  const initial = (
                    u.displayName ||
                    (u.email ? u.email[0] : undefined) ||
                    u.uid ||
                    'U'
                  ).charAt(0);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 min-w-0 transition-all duration-300 ease-out motion-safe:animate-fadeInUp"
                    >
                      <Avatar className="h-8 w-8">
                        {u.photoURL ? <AvatarImage src={u.photoURL} alt={primaryName} /> : null}
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-medium whitespace-normal break-words">
                          {primaryName}
                        </span>
                        {u.email && (
                          <span className="text-xs text-muted-foreground whitespace-normal break-words">
                            {u.email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky mobile action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t p-3 md:hidden">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {user ? (
            isUserAttending ? (
              <>
                <Button variant="outline" disabled className="flex-1">
                  ✓ You&apos;re attending
                </Button>
                <Button variant="ghost" onClick={handleLeave} className="flex-1">
                  Leave
                </Button>
              </>
            ) : canJoin ? (
              <Button onClick={handleAttend} className="flex-1">
                Join Event
              </Button>
            ) : (
              <Button disabled className="flex-1">
                Event Full
              </Button>
            )
          ) : (
            <Button onClick={() => router.push('/login')} className="flex-1">
              Sign in to Join
            </Button>
          )}
          <Button variant="outline" onClick={handleShare} className="flex-1">
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
