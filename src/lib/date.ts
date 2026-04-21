// date.ts — format helpers that match the design copy.
// The prototype uses strings like "Sat, Apr 26", "in 3 days", "Tomorrow".
// We derive these from a timestamp (ms since epoch) stored in Convex.

import {
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  isTomorrow,
  isToday,
} from 'date-fns';

/** "Sat, Apr 26" */
export function formatDateLabel(ms: number): string {
  return format(new Date(ms), 'EEE, MMM d');
}

/** "6:30 – 9:00 AM" — takes start + end. */
export function formatTimeRange(startMs: number, endMs: number): string {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const startStr = format(start, 'h:mm');
  const endStr = format(end, 'h:mm a');
  return `${startStr} – ${endStr}`;
}

/** Human relative stamp: "Today", "Tomorrow", "in 3 days", "in 2 weeks". */
export function formatTimestamp(ms: number, now: number = Date.now()): string {
  const d = new Date(ms);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const days = differenceInCalendarDays(d, new Date(now));
  if (days < 0) return formatDistanceStrict(d, new Date(now), { addSuffix: true });
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'next week';
  if (days < 30) return `in ${Math.round(days / 7)} weeks`;
  return format(d, 'MMM d');
}

/** Returns the day label ("SAT"), day number ("26"), and month ("APR")
 * used on Hub event cards. */
export function formatDateBlock(ms: number): { day: string; num: string; month: string } {
  const d = new Date(ms);
  return {
    day: format(d, 'EEE').toUpperCase(),
    num: format(d, 'd'),
    month: format(d, 'MMM').toUpperCase(),
  };
}
