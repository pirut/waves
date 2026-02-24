export const EVENT_CATEGORIES = [
  "Community Cleanup",
  "Food Security",
  "Fundraiser",
  "Mentoring",
  "Worship",
  "Health",
  "Education",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type RSVPStatus = "going" | "interested" | "not_going";

export const RSVP_STATUS_OPTIONS: ReadonlyArray<{
  value: RSVPStatus;
  label: string;
  helper: string;
}> = [
  { value: "going", label: "Going", helper: "You plan to attend." },
  { value: "interested", label: "Interested", helper: "You might attend." },
  { value: "not_going", label: "Not Going", helper: "You cannot attend." },
] as const;

export function getRsvpStatusLabel(status: RSVPStatus): string {
  if (status === "going") {
    return "Going";
  }

  if (status === "interested") {
    return "Interested";
  }

  return "Not Going";
}

export function getRsvpStatusTone(status: RSVPStatus): "default" | "success" | "warning" {
  if (status === "going") {
    return "success";
  }

  if (status === "interested") {
    return "warning";
  }

  return "default";
}

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
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
};

export type EventFeedUpdate = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventStartAt: number;
  body: string;
  kind: "announcement" | "update";
  createdAt: number;
  author: ProfilePreview;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
};

export type EventFeedComment = {
  id: string;
  eventMessageId: string;
  body: string;
  createdAt: number;
  author: ProfilePreview;
};

export type EventQuestion = {
  id: string;
  eventId: string;
  questionBody: string;
  createdAt: number;
  asker: ProfilePreview;
  answer?: {
    body: string;
    answeredAt: number;
    answeredBy: ProfilePreview;
  };
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
    notGoing: number;
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
