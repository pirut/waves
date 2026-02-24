import type { EventListItem } from "@/src/modules/events/domain/types";

export type FocusLocation = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type EventMapProps = {
  events: EventListItem[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
  focusLocation?: FocusLocation;
  height?: number;
  variant?: "embedded" | "fullscreen";
  markerLabelMode?: "compact" | "detailed";
  followSelection?: boolean;
};
