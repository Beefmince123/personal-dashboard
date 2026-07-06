import type { DayOfWeek } from "./types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Formats as "Monday, 6 July 2026" without Intl/toLocaleDateString, whose default
 * locale can differ between server (Node) and client (browser) and cause hydration
 * mismatches. */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function todayDayOfWeek(date: Date = new Date()): DayOfWeek {
  return WEEKDAYS[date.getDay()] as DayOfWeek;
}

export function todayISO(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number, from: string = todayISO()): string {
  const d = new Date(`${from}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Counts consecutive completed days walking backwards from today (or yesterday, so a
 * not-yet-done-today habit doesn't zero out an existing streak). */
export function computeStreak(completedDates: string[], today: string = todayISO()): number {
  const dates = new Set(completedDates);
  let streak = 0;
  let cursor = dates.has(today) ? today : isoDaysAgo(1, today);
  if (!dates.has(cursor)) return 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = isoDaysAgo(1, cursor);
  }
  return streak;
}
