import type { EventListItem } from "@/src/modules/events/domain/types";

export type EventMapProps = {
  events: EventListItem[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
};
