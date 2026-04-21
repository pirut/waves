// EventMap.types.ts — shared types for the native + web maps.

import type { CategoryId } from '@/theme/tokens';

export type EventMapMarker = {
  id: string;
  lat: number;
  lng: number;
  category: CategoryId;
};

export type EventMapProps = {
  markers: EventMapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /**
   * Initial camera. Defaults to San Francisco. After first render the user
   * can pan freely; we don't auto-recenter on marker changes.
   */
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
};
