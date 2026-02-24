import { format, formatDistanceToNow } from "date-fns";

export function formatEventWindow(startAt: number, endAt: number) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return `${format(start, "EEE, MMM d • h:mm a")} - ${format(end, "h:mm a")}`;
}

export function formatEventDate(startAt: number) {
  return format(new Date(startAt), "MMMM d, yyyy");
}

export function formatRelativeTime(timestamp: number) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
