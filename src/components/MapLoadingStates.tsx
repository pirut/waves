'use client';

import { Card, CardContent } from '@/components/ui/card';

interface MapLoadingStatesProps {
  type: 'api-key-missing' | 'loading' | 'events-loading';
}

export default function MapLoadingStates({ type }: MapLoadingStatesProps) {
  if (type === 'api-key-missing') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-600">Google Maps API key is not configured</p>
          <p className="text-sm text-gray-500 mt-2">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
          </p>
        </div>
      </div>
    );
  }

  if (type === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (type === 'events-loading') {
    return (
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-40">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading events...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
