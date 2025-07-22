'use client';

interface MobileBottomNavProps {
  activeView: 'map' | 'events';
  onViewChange: (view: 'map' | 'events') => void;
}

export default function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        <button
          className={`flex flex-col items-center py-2 px-4 ${
            activeView === 'map' ? 'text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => onViewChange('map')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-xs">Map</span>
        </button>
        <button
          className={`flex flex-col items-center py-2 px-4 ${
            activeView === 'events' ? 'text-gray-900' : 'text-gray-500'
          }`}
          onClick={() => onViewChange('events')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="text-xs">Event</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <div className="w-6 h-6 mb-1 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">i</span>
          </div>
          <span className="text-xs">Info</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs">Profile</span>
        </button>
        <button className="flex flex-col items-center py-2 px-4 text-gray-500">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );
}
