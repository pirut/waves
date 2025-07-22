'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, MoreVertical } from 'lucide-react';

interface MobileMapHeaderProps {
  mobileView: 'map' | 'events';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  categoryColorMap: { [key: string]: string };
}

export default function MobileMapHeader({
  mobileView,
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  categoryColorMap,
}: MobileMapHeaderProps) {
  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(newCategories);
  };

  const handleSelectAllCategories = () => {
    onCategoriesChange(Object.keys(categoryColorMap));
  };

  return (
    <div className="bg-white border-b border-[#F6E8D6] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FFE5D4] rounded-full flex items-center justify-center">
              <span className="text-gray-900 text-xs font-bold">W</span>
            </div>
            <h1 className="text-lg font-semibold">
              {mobileView === 'map' ? 'Map View' : 'Events'}
            </h1>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-200 rounded-full"
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm whitespace-nowrap"
          onClick={handleSelectAllCategories}
        >
          All Events
        </button>
        {Object.entries(categoryColorMap).map(([category]) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border ${
              selectedCategories.includes(category)
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200'
            }`}
            onClick={() => handleCategoryToggle(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
