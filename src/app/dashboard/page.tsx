'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NearbyEventsSection } from '@/components/dashboard/NearbyEventsSection';
import { UpcomingEventsSection } from '@/components/dashboard/UpcomingEventsSection';
import { RecentPostsSection } from '@/components/dashboard/RecentPostsSection';
import type { Event } from '@/types/event';

export default function DashboardPage() {
  const { user, loading } = useAuth();
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

  // Update user profile in Firestore when user is authenticated
  useEffect(() => {
    if (user) {
      const updateUserProfile = async () => {
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
      };
      updateUserProfile();
    }
  }, [user]);

  const { data: events = [], isLoading: eventsLoading } = trpc.events.getDashboardEvents.useQuery(
    userLocation ? { userLat: userLocation.lat, userLng: userLocation.lng } : undefined,
    { enabled: !loading && userLocation !== null }
  ) as { data: Event[]; isLoading: boolean };

  const nearbyEvents = events;
  const upcomingEvents = events
    .filter((event) => event.attendees?.includes(user?.uid || '') || false)
    .slice(0, 3);

  // Show loading state during authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If user is not authenticated, this should be handled by middleware/conditional layout
  // But as a safety measure, show a loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <DashboardHeader userName={user?.displayName || user?.email?.split('@')[0] || 'User'} />
      <div className="space-y-8">
        <NearbyEventsSection events={nearbyEvents} isLoading={eventsLoading} />
        <UpcomingEventsSection events={upcomingEvents} />
        <RecentPostsSection posts={[]} />
      </div>
    </div>
  );
}
