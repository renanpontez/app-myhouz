import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  getDay,
  isSameDay,
} from "date-fns";
import type { RecurrenceMeta } from "@/domain/models";

type RecurrenceArg = string;

/** Parse "YYYY-MM-DD" as local date (avoids UTC midnight → previous day in negative TZ offsets) */
function parseDateLocal(dateStr: string): Date {
  const parts = dateStr.split("T")[0]!.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function getCycleStart(
  recurrence: RecurrenceArg,
  _meta?: RecurrenceMeta,
): Date {
  const now = new Date();
  switch (recurrence) {
    case "daily":
    case "weekdays":
    case "weekends":
    case "custom":
      return startOfDay(now);
    case "weekly":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "monthly":
      return startOfMonth(now);
    default:
      return startOfDay(now);
  }
}

export function isCompletedThisCycle(
  lastCompletedAt: string | null,
  recurrence: RecurrenceArg,
  meta?: RecurrenceMeta,
): boolean {
  if (!lastCompletedAt) return false;
  const cycleStart = getCycleStart(recurrence, meta);
  return new Date(lastCompletedAt) >= cycleStart;
}

export function isActiveOnDate(
  recurrence: RecurrenceArg,
  meta: RecurrenceMeta | undefined,
  date: Date,
  startsAt?: string | null,
  createdAt?: string | null,
): boolean {
  // If task has a start date, don't show before it
  if (startsAt) {
    const startDate = parseDateLocal(startsAt);
    if (startOfDay(date) < startOfDay(startDate)) return false;
  }

  // Anchor date: starts_at (local) or created_at (UTC timestamp → local via new Date)
  const anchorDate = startsAt
    ? parseDateLocal(startsAt)
    : createdAt
      ? new Date(createdAt)
      : null;

  const dayOfWeek = getDay(date);

  switch (recurrence) {
    case "daily":
      return true;
    case "weekly": {
      if (!anchorDate) return true;
      return getDay(anchorDate) === dayOfWeek;
    }
    case "monthly": {
      if (!anchorDate) return true;
      return anchorDate.getDate() === date.getDate();
    }
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "custom": {
      if (!meta) return true;
      if (meta.type === "days_of_week") {
        return meta.days.includes(dayOfWeek);
      }
      return true;
    }
    default:
      return true;
  }
}

export function isActiveToday(
  recurrence: RecurrenceArg,
  meta?: RecurrenceMeta,
  startsAt?: string | null,
): boolean {
  return isActiveOnDate(recurrence, meta, new Date(), startsAt);
}


export function hasCompletionOnDate(
  completions: { completed_at: string }[],
  date: Date,
): boolean {
  return completions.some((c) => isSameDay(new Date(c.completed_at), date));
}

export function getStreak(completions: { completed_at: string }[]): number {
  if (completions.length === 0) return 0;

  const sorted = [...completions]
    .map((c) => startOfDay(new Date(c.completed_at)).getTime())
    .sort((a, b) => b - a);

  // Deduplicate by day
  const uniqueDays: number[] = [];
  for (const ts of sorted) {
    if (uniqueDays.length === 0 || uniqueDays[uniqueDays.length - 1] !== ts) {
      uniqueDays.push(ts);
    }
  }

  const todayTs = startOfDay(new Date()).getTime();
  const oneDayMs = 86400000;

  // The streak must start from today or yesterday
  const first = uniqueDays[0];
  if (first === undefined || (first !== todayTs && first !== todayTs - oneDayMs)) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = uniqueDays[i - 1];
    const curr = uniqueDays[i];
    if (prev !== undefined && curr !== undefined && prev - curr === oneDayMs) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getRecurrenceDescription(
  recurrence: RecurrenceArg,
  meta: RecurrenceMeta,
  dayLabels: string[],
  unitLabels: Record<string, string>,
): string | null {
  if (recurrence !== "custom" || !meta) return null;

  if (meta.type === "days_of_week") {
    const sorted = [...meta.days].sort((a, b) => {
      const orderA = a === 0 ? 7 : a;
      const orderB = b === 0 ? 7 : b;
      return orderA - orderB;
    });
    return sorted.map((d) => dayLabels[d]).join(", ");
  }

  if (meta.type === "interval") {
    const unitLabel = unitLabels[meta.unit] ?? meta.unit;
    if (meta.every === 1) return unitLabel;
    return `${meta.every} ${unitLabel}`;
  }

  return null;
}
