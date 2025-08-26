'use client';
import { useAuth } from '@/hooks/useAuth';
import ImprovedMapView from './ImprovedMapView';

export default function MapPage() {
  const { user, loading } = useAuth();

  // Show loading state during authentication check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If user is not authenticated, this should be handled by conditional layout
  // But as a safety measure, show a loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <ImprovedMapView />
    </div>
  );
}
