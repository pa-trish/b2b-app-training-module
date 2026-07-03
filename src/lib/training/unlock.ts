import { addDays, format, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { DayUnlockState } from "@/lib/types";

export function getTodayInTimezone(timezone: string): Date {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return startOfDay(zoned);
}

export function getDayUnlockDate(startDate: Date, dayNumber: number): Date {
  return addDays(startOfDay(startDate), dayNumber - 1);
}

export function getDayUnlockState(
  startDate: Date,
  dayNumber: number,
  timezone: string,
  isDayComplete: boolean
): DayUnlockState {
  const today = getTodayInTimezone(timezone);
  const unlockDate = getDayUnlockDate(startDate, dayNumber);

  if (today < unlockDate) return "locked";
  if (isDayComplete) return "completed";
  return "unlocked";
}

export function formatUnlockDate(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "MMM d, yyyy");
}

export function getCurrentTrainingDay(
  startDate: Date,
  totalDays: number,
  timezone: string
): number {
  const today = getTodayInTimezone(timezone);
  const start = startOfDay(startDate);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), totalDays);
}
