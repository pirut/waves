'use client';

interface Event {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  attendees?: string[];
  maxAttendees?: number;
  createdBy?: string;
  time?: string;
  date?: string;
  createdAt?: string;
}

interface EventListProps {
  events: Event[];
  loading: boolean;
  onEventSelect?: (event: Event) => void;
  className?: string;
}

export default function EventList({
  events,
  loading,
  onEventSelect,
  className = '',
}: EventListProps) {
  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading events...</div>;
  }

  if (events.length === 0) {
    return <div className="p-4 text-center text-gray-500">No events found</div>;
  }

  return (
    <div className={`overflow-y-auto ${className}`}>
      {events.map((event: Event) => (
        <div
          key={event.id}
          className="bg-white mx-4 mb-4 rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer"
          onClick={() => onEventSelect?.(event)}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{event.title}</h3>
              <p className="text-gray-600 mb-2">{event.location?.address}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  📅 {event.date} • {event.time}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  👥 {event.attendees?.length || 0} attendees
                </span>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
