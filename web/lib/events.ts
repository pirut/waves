export const EVENT_CATEGORIES = [
  "Community Cleanup",
  "Food Security",
  "Fundraiser",
  "Mentoring",
  "Worship",
  "Health",
  "Education",
] as const;

export const RSVP_OPTIONS = [
  { value: "going", label: "Going" },
  { value: "interested", label: "Interested" },
  { value: "not_going", label: "Not Going" },
] as const;

export type RsvpStatus = (typeof RSVP_OPTIONS)[number]["value"];

export function formatRsvpLabel(status: RsvpStatus | undefined) {
  if (!status) {
    return "No RSVP yet";
  }

  const match = RSVP_OPTIONS.find((option) => option.value === status);
  return match ? match.label : "No RSVP yet";
}
