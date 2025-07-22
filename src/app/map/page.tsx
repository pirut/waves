'use client';
import ImprovedMapView from './ImprovedMapView';

export default function MapPage() {
  return (
    <div className="flex-1 relative w-full h-[calc(100vh-2rem)]">
      <ImprovedMapView />
    </div>
  );
}
