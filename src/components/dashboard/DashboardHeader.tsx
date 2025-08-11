'use client';

import { Button } from '@/components/ui/button';
import { Map, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground mt-1">
          Ready to make some waves? Discover events near you or create your own.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => router.push('/map')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Map className="w-4 h-4 mr-2" />
          Explore Map
        </Button>
        <Button
          onClick={() => router.push('/events/create')}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>
    </div>
  );
}
