// The app's "today" — seed data is calibrated around this date.
// Swap to `new Date()` once data is live.
export const TODAY = new Date("2026-05-23");

export function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDay(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Whole-day delta from TODAY. Negative = past.
export function daysFromToday(iso: string): number {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  return Math.round((a - b) / 86400000);
}

export function relativeDue(iso: string): string {
  const n = daysFromToday(iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n < 0) return `${-n}d overdue`;
  return `in ${n}d`;
}
