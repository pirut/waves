'use client';

interface MobileMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

export default function MobileMapControls({
  onZoomIn,
  onZoomOut,
  className = '',
}: MobileMapControlsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={onZoomIn}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
      >
        <span className="text-xl font-bold">+</span>
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
      >
        <span className="text-xl font-bold">−</span>
      </button>
    </div>
  );
}
