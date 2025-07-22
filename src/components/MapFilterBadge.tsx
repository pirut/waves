'use client';

import { Filter } from 'lucide-react';

interface MapFilterBadgeProps {
  selectedCategoriesCount: number;
  totalCategoriesCount: number;
  className?: string;
}

export default function MapFilterBadge({
  selectedCategoriesCount,
  totalCategoriesCount,
  className = '',
}: MapFilterBadgeProps) {
  if (selectedCategoriesCount === totalCategoriesCount) {
    return null;
  }

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm border border-[#F6E8D6] rounded-md px-3 py-2 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="w-4 h-4" />
        <span>
          {selectedCategoriesCount === 0
            ? 'No categories selected'
            : `${selectedCategoriesCount} of ${totalCategoriesCount} categories`}
        </span>
      </div>
    </div>
  );
}
