'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Event } from '@/types/event';

interface MapEventsContextType {
  events: Event[];
  setEvents: (events: Event[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const MapEventsContext = createContext<MapEventsContextType | undefined>(undefined);

export function MapEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <MapEventsContext.Provider value={{ events, setEvents, loading, setLoading }}>
      {children}
    </MapEventsContext.Provider>
  );
}

export function useMapEvents() {
  const ctx = useContext(MapEventsContext);
  if (!ctx) throw new Error('useMapEvents must be used within a MapEventsProvider');
  return ctx;
}
