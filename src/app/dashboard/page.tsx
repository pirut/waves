'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { trpc } from '@/lib/trpc';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NearbyEventsSection } from '@/components/dashboard/NearbyEventsSection';
import { UpcomingEventsSection } from '@/components/dashboard/UpcomingEventsSection';
import { RecentPostsSection } from '@/components/dashboard/RecentPostsSection';
import type { Event } from '@/types/event';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation({ lat: 26.7511, lng: -80.0989 })
      );
    } else {
      setUserLocation({ lat: 26.7511, lng: -80.0989 });
    }
  }, []);

  const { data: events = [], isLoading: eventsLoading } = trpc.events.getDashboardEvents.useQuery(
    userLocation ? { userLat: userLocation.lat, userLng: userLocation.lng } : undefined,
    { enabled: authInitialized && userLocation !== null }
  ) as { data: Event[]; isLoading: boolean };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        // Avoid an extra read: write-or-merge the user profile
        await setDoc(
          userRef,
          {
            uid: user.uid,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || '',
            email: user.email,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });
    return () => unsub();
  }, []);

  const nearbyEvents = events;
  const upcomingEvents = events
    .filter((event) => event.attendees?.includes(currentUser?.uid || '') || false)
    .slice(0, 3);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <DashboardHeader
        userName={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
      />
      <div className="space-y-8">
        <NearbyEventsSection events={nearbyEvents} isLoading={eventsLoading} />
        <UpcomingEventsSection events={upcomingEvents} />
        <RecentPostsSection posts={[]} />
      </div>
    </div>
  );
}
