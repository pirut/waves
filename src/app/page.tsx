'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AuthWidget from '@/components/AuthWidget';
import { Calendar, Map as MapIcon, Users, Heart, Sparkles } from 'lucide-react';
import { MapView } from '@/components/MapView';
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';
import { Event } from '@/types/event';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const { data: stats } = trpc.stats.useQuery(undefined, { staleTime: 60_000 });
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setConsented(true);
      },
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const { data: nearbyEvents = [] } = trpc.events.getDashboardEvents.useQuery(
    center ? { userLat: center.lat, userLng: center.lng } : undefined,
    { staleTime: 60_000 }
  );

  return (
    <main className="min-h-screen flex flex-col">
      <section className="relative flex-1 flex items-center">
        <div className="absolute inset-0 -z-10" />
        <div className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                Do good IRL
              </Badge>
              <span className="text-sm text-muted-foreground">Make Waves in your community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Discover impact events around you and turn intention into action
            </h1>
            <p className="text-lg text-muted-foreground max-w-prose">
              Make Waves is a map-centric social app for real-world good. Find nearby opportunities,
              RSVP with friends, and share the moments that matter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Get Started
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Sign in</DialogTitle>
                  </DialogHeader>
                  <AuthWidget />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> {stats?.usersCount ?? '—'} users
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {stats?.eventsCount ?? '—'} events
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" /> Built for impact
              </div>
            </div>
          </div>

          <Card className="w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">See what&apos;s happening near you</CardTitle>
              <CardDescription>Map-first discovery with rich event details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4 aspect-square sm:aspect-[5/4] rounded-lg overflow-hidden">
                {consented && center ? (
                  <MapBoundsProvider>
                    <MapView
                      interactive={false}
                      showZoomControls={false}
                      showFullscreenControl={false}
                      center={center}
                      zoom={12}
                      minZoom={3}
                      maxZoom={18}
                      showEventMarkers={true}
                      events={nearbyEvents as Event[]}
                    />
                  </MapBoundsProvider>
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">
                    Enable location to preview events
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Map-first discovery',
              Icon: MapIcon,
              desc: 'Browse real events on a beautiful map and filter by what matters.',
            },
            {
              title: 'Go with friends',
              Icon: Users,
              desc: 'RSVP together and see who&apos;s attending before you head out.',
            },
            {
              title: 'Stay organized',
              Icon: Calendar,
              desc: 'Track upcoming plans and get gentle reminders when it&apos;s time.',
            },
            {
              title: 'Celebrate impact',
              Icon: Heart,
              desc: 'Share photos and stories tied to real-world actions.',
            },
          ].map(({ title, Icon, desc }) => (
            <Card key={title} className="h-full">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary grid place-items-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-4 container mx-auto" />

      <section className="container mx-auto px-4 pb-20">
        <Card className="w-full overflow-hidden">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-prose">
              <h3 className="text-2xl font-bold mb-1">Ready to make a wave?</h3>
              <p className="text-muted-foreground">
                Jump in now—discover events near you and meet people making a difference.
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="secondary">
                    Create Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Welcome to Make Waves</DialogTitle>
                  </DialogHeader>
                  <AuthWidget />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
