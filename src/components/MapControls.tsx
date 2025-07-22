'use client';

import { Button } from '@/components/ui/button';
import { Locate } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGoToUserLocation?: () => void;
  showUserLocationButton?: boolean;
  className?: string;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onGoToUserLocation,
  showUserLocationButton = false,
  className = '',
}: MapControlsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
      >
        <span className="text-lg font-bold">−</span>
      </Button>
      {showUserLocationButton && onGoToUserLocation && (
        <Button
          variant="outline"
          onClick={onGoToUserLocation}
          size="sm"
          className="bg-white border-[#F6E8D6] w-10 h-10 p-0"
        >
          <Locate className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
