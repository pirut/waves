'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import CreateEventModal from '@/components/CreateEventModal';

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

interface DesktopMapSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  categoryColorMap: { [key: string]: string };
  filteredEvents: Event[];
  allEvents: Event[];
  loading: boolean;
  onEventSelect: (event: Event) => void;
  onEventCreated: () => void;
}

export default function DesktopMapSidebar({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  categoryColorMap,
  filteredEvents,
  allEvents,
  loading,
  onEventSelect,
  onEventCreated,
}: DesktopMapSidebarProps) {
  const handleCategoryRemove = (category: string) => {
    onCategoriesChange(selectedCategories.filter((c) => c !== category));
  };

  const getCategoryMarkerColor = (category: string) => {
    return categoryColorMap[category] || '#FFE5D4';
  };

  return (
    <div className="w-80 bg-white border-r border-[#F6E8D6] flex flex-col">
      <div className="p-4 border-b border-[#F6E8D6]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Events</h2>
          <Button variant="ghost" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
        </div>

        <div className="relative mb-3">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 border-[#F6E8D6] focus:border-[#FFE5D4]"
          />
          <svg
            className="w-4 h-4 absolute left-2.5 top-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="relative">
          <Select
            value={
              selectedCategories.length === Object.keys(categoryColorMap).length
                ? 'all'
                : 'filtered'
            }
            onValueChange={(value) => {
              if (value === 'all') {
                onCategoriesChange(Object.keys(categoryColorMap));
              } else if (value === 'none') {
                onCategoriesChange([]);
              }
            }}
          >
            <SelectTrigger className="border-[#F6E8D6] focus:border-[#FFE5D4]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Filter by category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Categories ({Object.keys(categoryColorMap).length})
              </SelectItem>
              <SelectItem value="none">None</SelectItem>
              <div className="border-t border-gray-200 my-1"></div>
              {Object.entries(categoryColorMap).map(([category, color]) => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span>{category}</span>
                    {selectedCategories.includes(category) && (
                      <svg
                        className="w-4 h-4 ml-auto text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCategories.length > 0 &&
            selectedCategories.length < Object.keys(categoryColorMap).length && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#FFE5D4] text-gray-700 rounded-full"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColorMap[category] }}
                    />
                    {category}
                    <button
                      onClick={() => handleCategoryRemove(category)}
                      className="ml-1 hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {allEvents.length === 0
              ? 'No events found'
              : selectedCategories.length === 0
                ? 'No categories selected. Choose categories to see events.'
                : searchQuery.trim()
                  ? 'No events match your search and filters'
                  : 'No events match your selected categories'}
          </div>
        ) : (
          filteredEvents.map((event: Event) => (
            <div
              key={event.id}
              className="p-4 border-b border-[#F6E8D6] hover:bg-[#FFE5D4]/20 cursor-pointer"
              onClick={() => onEventSelect(event)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: getCategoryMarkerColor(event.category || '') }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.location?.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      {event.attendees?.length || 0} attendees
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[#F6E8D6]">
        <CreateEventModal onEventCreated={onEventCreated}>
          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Event
          </Button>
        </CreateEventModal>
      </div>
    </div>
  );
}
