'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapBoundsContextType {
  mapBounds: google.maps.LatLngBounds | null;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
}

const MapBoundsContext = createContext<MapBoundsContextType | undefined>(undefined);

export function MapBoundsProvider({ children }: { children: ReactNode }) {
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);

  return (
    <MapBoundsContext.Provider value={{ mapBounds, setMapBounds }}>
      {children}
    </MapBoundsContext.Provider>
  );
}

export function useMapBounds() {
  const context = useContext(MapBoundsContext);
  if (context === undefined) {
    throw new Error('useMapBounds must be used within a MapBoundsProvider');
  }
  return context;
}
