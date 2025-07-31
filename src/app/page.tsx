'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import AuthWidget from '@/components/AuthWidget';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NearbyEventsSection } from '@/components/dashboard/NearbyEventsSection';
import { UpcomingEventsSection } from '@/components/dashboard/UpcomingEventsSection';
import { RecentPostsSection } from '@/components/dashboard/RecentPostsSection';
import { Event } from '@/types/event';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        () => {
          // Fallback to Florida center if location access is denied
          setUserLocation({ lat: 26.7511, lng: -80.0989 });
        }
      );
    } else {
      // Fallback to Florida center if geolocation is not supported
      setUserLocation({ lat: 26.7511, lng: -80.0989 });
    }
  }, []);

  // Fetch events using tRPC
  const { data: events = [], isLoading: eventsLoading } = trpc.events.getDashboardEvents.useQuery(
    userLocation ? { userLat: userLocation.lat, userLng: userLocation.lng } : undefined,
    {
      enabled: authInitialized && userLocation !== null, // Only run query after auth is initialized and we have location
    }
  ) as {
    data: Event[];
    isLoading: boolean;
  };

  // Sync user to Firestore on sign-in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthInitialized(true); // Mark auth as initialized
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: user.displayName || user.email,
            profilePhotoUrl: user.photoURL || '',
            email: user.email,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
    return () => unsub();
  }, []);

  // Filter events for different sections
  const nearbyEvents = events;
  const upcomingEvents = events
    .filter((event) => {
      // Mock filter for user's events - in real app, check if user is attending
      return event.attendees?.includes(currentUser?.uid || '') || false;
    })
    .slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {!currentUser ? (
        <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full py-4 px-4">
          <Card className="max-w-md w-full backdrop-blur-md shadow-xl border-none mb-4 md:mb-0">
            <CardHeader className="flex flex-col items-center gap-2">
              <CardTitle className="text-center">Make Waves</CardTitle>
              <CardDescription className="subtitle max-w-md text-center">
                Discover, attend, and share real-world events focused on doing good. Every post is
                rooted in real-life impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-0">
              <Button
                className="w-full max-w-xs py-4 md:py-6"
                onClick={() => router.push('/map')}
                variant="default"
                size="lg"
              >
                Find Events Near You
              </Button>
              <Button
                className="w-full max-w-xs flex items-center gap-2 text-lg py-4 md:py-6"
                variant="secondary"
                size="lg"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_17_40)">
                    <path
                      d="M47.5 24.5C47.5 22.8333 47.3333 21.1667 47 19.5833H24V28.9167H37.3333C36.6667 32.0833 34.6667 34.75 31.8333 36.5833V41.0833H39.5C44 37.0833 47.5 31.3333 47.5 24.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M24 48C30.5 48 36.0833 45.9167 39.5 41.0833L31.8333 36.5833C29.9167 37.9167 27.5 38.75 24 38.75C17.8333 38.75 12.5 34.5833 10.6667 29.0833H2.83334V33.75C6.25 41.0833 14.5 48 24 48Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10.6667 29.0833C10.1667 27.75 10 26.3333 10 24.9167C10 23.5 10.1667 22.0833 10.6667 20.75V16.0833H2.83334C1.5 18.75 0.75 21.75 0.75 24.9167C0.75 28.0833 1.5 31.0833 2.83334 33.75L10.6667 29.0833Z"
                      fill="currentColor"
                    />
                    <path
                      d="M24 9.25C27.9167 9.25 31.0833 10.5833 33.25 12.5833L39.6667 6.16667C36.0833 2.91667 30.5 0.75 24 0.75C14.5 0.75 6.25 7.66667 2.83334 16.0833L10.6667 20.75C12.5 15.25 17.8333 9.25 24 9.25Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_17_40">
                      <rect width="48" height="48" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
          <AuthWidget />
        </div>
      ) : (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Dashboard Header */}
          <DashboardHeader
            userName={currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
          />

          {/* Dashboard Content */}
          <div className="space-y-8">
            {/* Events Near You Section */}
            <NearbyEventsSection events={nearbyEvents} isLoading={eventsLoading} />

            {/* My Upcoming Events Section */}
            <UpcomingEventsSection events={upcomingEvents} />

            {/* Recent Posts by Friends Section */}
            <RecentPostsSection posts={[]} />
          </div>
        </div>
      )}
    </div>
  );
}
