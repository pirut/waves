'use client';

interface MapStatusBadgeProps {
  eventCount: number;
  className?: string;
}

export default function MapStatusBadge({ eventCount, className = '' }: MapStatusBadgeProps) {
  return (
    <div className={`bg-white px-3 py-2 rounded-md shadow-sm border border-[#F6E8D6] ${className}`}>
      <p className="text-xs text-gray-600">Showing {eventCount} events in current view</p>
    </div>
  );
}
