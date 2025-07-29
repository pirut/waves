// Event interface to match Firebase data structure
export interface Event {
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
  time?: string; // ISO string for event date/time
  date?: string; // Deprecated - use time instead
  createdAt?: string;
  updatedAt?: string;
  // New image fields
  images?: string[]; // Array of image URLs from UploadThing
  coverImage?: string; // Main cover image URL
  // Enhanced event details
  tags?: string[]; // Array of event tags
  isPrivate?: boolean; // Whether event is private/invite-only
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  requirements?: string[]; // What attendees need to bring/know
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  cost?: {
    amount?: number;
    currency?: string;
    description?: string; // e.g., "Suggested donation", "Free", etc.
  };
  duration?: {
    hours?: number;
    minutes?: number;
  };
  recurringEvent?: {
    isRecurring: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
}

// Helper type for creating/updating events
export interface CreateEventInput {
  title: string;
  description?: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  time: string; // ISO string for event date/time
  maxAttendees?: number;
  images?: string[];
  coverImage?: string;
  tags?: string[];
  isPrivate?: boolean;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  requirements?: string[];
  ageRestriction?: {
    min?: number;
    max?: number;
  };
  cost?: {
    amount?: number;
    currency?: string;
    description?: string;
  };
  duration?: {
    hours?: number;
    minutes?: number;
  };
}

// Event categories with better typing
export const EVENT_CATEGORIES = [
  'Environmental',
  'Community Service',
  'Education',
  'Health & Wellness',
  'Arts & Culture',
  'Social Justice',
  'Animal Welfare',
  'Disaster Relief',
  'Youth Development',
  'Senior Support',
  'Technology',
  'Sports & Recreation',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];
