"use client";

import { PREFIX } from "@/lib/store/local";

// Distinct, on-theme palette. 11 entries cover the seeded cases 1:1.
export const CASE_PALETTE = [
  "#7aa8ff", // blue
  "#33ddc8", // teal
  "#f43f5e", // rose
  "#fbbf24", // amber
  "#ffaa8c", // peach
  "#4ade80", // green
  "#a78bfa", // violet
  "#22d3ee", // cyan
  "#a3e635", // lime
  "#fb923c", // orange
  "#f472b6", // pink
];

const KEY = PREFIX + "caseColors";
export const NEUTRAL = "rgba(255,255,255,0.28)";

export function colorForIndex(i: number): string {
  return CASE_PALETTE[i % CASE_PALETTE.length];
}

export function readCaseColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(map: Record<string, string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

// Stable color for a case: stored value, else a deterministic hash fallback.
export function getCaseColor(caseId?: string | null): string {
  if (!caseId) return NEUTRAL;
  const map = readCaseColors();
  if (map[caseId]) return map[caseId];
  let h = 0;
  for (const ch of caseId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CASE_PALETTE[h % CASE_PALETTE.length];
}

// Assign and persist a color for a new case (prefers an unused palette entry).
export function assignCaseColor(caseId: string): string {
  const map = readCaseColors();
  if (!map[caseId]) {
    const used = new Set(Object.values(map));
    map[caseId] = CASE_PALETTE.find((c) => !used.has(c)) || colorForIndex(Object.keys(map).length);
    write(map);
  }
  return map[caseId];
}

export function setCaseColors(map: Record<string, string>) {
  write(map);
}
