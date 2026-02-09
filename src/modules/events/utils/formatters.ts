import { format } from "date-fns";

export function formatEventWindow(startAt: number, endAt: number) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${format(start, "EEE, MMM d • h:mm a")} - ${format(end, "h:mm a")}`;
}

export function formatEventDateLabel(startAt: number) {
  return format(new Date(startAt), "MMMM d, yyyy");
}

export function formatMonthBucket(startAt: number) {
  return format(new Date(startAt), "MMMM yyyy");
}

export function toDateTimeInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function parseDateTimeInput(value: string) {
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return parsed.getTime();
}
