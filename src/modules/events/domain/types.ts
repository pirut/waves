export const EVENT_CATEGORIES = [
  "Community Cleanup",
  "Food Security",
  "Fundraiser",
  "Mentoring",
  "Health",
  "Education",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type RSVPStatus = "going" | "interested";

export type ProfilePreview = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  city?: string;
};

export type EventListItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  startAt: number;
  endAt: number;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  coverImageUrl?: string;
  impactSummary?: string;
  attendeeCount: number;
  organizer: ProfilePreview;
  viewerRsvp?: RSVPStatus;
};

export type EventMediaItem = {
  id: string;
  url: string;
  storageId?: string;
  caption?: string;
  sortOrder: number;
};

export type EventMessage = {
  id: string;
  body: string;
  kind: "announcement" | "update";
  createdAt: number;
  author: ProfilePreview;
};

export type EventDetail = {
  event: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    startAt: number;
    endAt: number;
    timezone: string;
    latitude: number;
    longitude: number;
    addressLine1: string;
    city: string;
    region?: string;
    country: string;
    postalCode?: string;
    coverImageUrl?: string;
    coverStorageId?: string;
    impactSummary?: string;
    capacity?: number;
    status: "draft" | "published";
    attendeeCount: number;
  };
  organizer: ProfilePreview;
  viewerRsvp?: RSVPStatus;
  attendeeBreakdown: {
    going: number;
    interested: number;
    total: number;
  };
  attendees: Array<{
    profile: ProfilePreview;
    status: RSVPStatus;
    respondedAt: number;
  }>;
  media: EventMediaItem[];
  messages: EventMessage[];
};
