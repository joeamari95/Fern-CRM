import type { Accent } from "@/lib/types";

export const TODAY = new Date();

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Whole-day delta from TODAY. Negative = past. NaN for blank/invalid dates.
export function daysFromToday(iso: string): number {
  if (!iso) return NaN;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return NaN;
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  return Math.round((a - b) / 86400000);
}

export function relativeDue(iso: string): string {
  const n = daysFromToday(iso);
  if (isNaN(n)) return "";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n < 0) return `${-n}d overdue`;
  return `in ${n}d`;
}

// "X days ago" for a past date.
export function ago(iso: string): string {
  const n = daysFromToday(iso);
  if (isNaN(n)) return "";
  const d = -n;
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

// Urgency color for a due date: red overdue, orange <=3d, yellow this week, else calm.
export function dueAccent(iso: string, done = false): Accent {
  if (done) return "green";
  const n = daysFromToday(iso);
  if (isNaN(n)) return "muted";
  if (n < 0) return "rose";
  if (n <= 3) return "peach";
  if (n <= 7) return "amber";
  return "teal";
}
