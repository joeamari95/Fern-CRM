"use client";

import { PREFIX, newId } from "@/lib/store/local";
import { callClaude } from "@/lib/claude";
import { codesFor } from "@/lib/timeCodes";
import type { Case, TimeEntry } from "@/lib/types";

const isBrowser = typeof window !== "undefined";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ---------------- time entries (finn:time:<date>:<id>) ---------------- */

function entryKey(e: TimeEntry): string {
  return `${PREFIX}time:${e.date}:${e.id}`;
}

export function readAllEntries(): TimeEntry[] {
  if (!isBrowser) return [];
  const out: TimeEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${PREFIX}time:`)) {
      try {
        out.push(JSON.parse(localStorage.getItem(k)!));
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}

export function newEntryId(): string {
  return newId();
}

// Persist an entry. On a brand-new entry, learning + audit log are recorded.
export function saveEntry(e: TimeEntry, caseName: string, isNew: boolean) {
  localStorage.setItem(entryKey(e), JSON.stringify(e));
  if (isNew) {
    updateLearning(e);
    logActivity("time_saved", `Logged ${e.hours.toFixed(1)}h — ${e.taskCode} / ${e.subCode}`);
  }
  saveAuditLog(e, caseName);
}

export function deleteEntry(e: TimeEntry) {
  localStorage.removeItem(entryKey(e));
  localStorage.removeItem(`${PREFIX}auditlog:${e.id}`);
}

/* ---------------- time learning (finn:timelearning) ---------------- */

type Learning = Record<string, { count: number; total: number }>;
const combo = (t: string, s: string) => `${t}|${s}`;

function readLearning(): Learning {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}timelearning`) || "{}");
  } catch {
    return {};
  }
}

function updateLearning(e: TimeEntry) {
  const L = readLearning();
  const k = combo(e.taskCode, e.subCode);
  const cur = L[k] || { count: 0, total: 0 };
  L[k] = { count: cur.count + 1, total: cur.total + e.hours };
  localStorage.setItem(`${PREFIX}timelearning`, JSON.stringify(L));
}

// Prediction for a task/sub combo; null until 3+ logged entries exist.
export function predict(task: string, sub: string): { count: number; minutes: number } | null {
  const L = readLearning();
  const e = L[combo(task, sub)];
  if (!e || e.count < 3) return null;
  return { count: e.count, minutes: Math.round((e.total / e.count) * 60) };
}

/* ---------------- activity trail (finn:activity:<date>) ---------------- */

export type Activity = { time: string; type: string; label: string };

export function logActivity(type: string, label: string) {
  if (!isBrowser) return;
  const k = `${PREFIX}activity:${todayISO()}`;
  let arr: Activity[] = [];
  try {
    arr = JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    /* ignore */
  }
  arr.push({ time: new Date().toISOString(), type, label });
  // keep it bounded
  if (arr.length > 500) arr = arr.slice(-500);
  localStorage.setItem(k, JSON.stringify(arr));
}

function readActivity(date: string): Activity[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}activity:${date}`) || "[]");
  } catch {
    return [];
  }
}

// Activity entries within `hours` before `endIso` (spans the prior day if needed).
export function activityWindow(endIso: string, hours: number): Activity[] {
  const end = new Date(endIso).getTime();
  const start = end - hours * 3600 * 1000;
  const endDay = endIso.slice(0, 10);
  const prevDay = new Date(end - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const days = prevDay === endDay ? [endDay] : [prevDay, endDay];
  return days
    .flatMap((d) => readActivity(d))
    .filter((a) => {
      const t = new Date(a.time).getTime();
      return t >= start && t <= end;
    })
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}

/* ---------------- audit log (finn:auditlog:<id>) ---------------- */

export type AuditLog = {
  entryId: string;
  savedAt: string;
  caseId: string;
  caseName: string;
  taskCode: string;
  subCode: string;
  hours: number;
  narrative: string;
  activity: Activity[];
  soundingBoardSessions: number;
  soundingBoardMinutes: number;
  notesCount: number;
  sectionsOpened: string[];
};

function notesForCase(caseId: string): number {
  if (!isBrowser) return 0;
  try {
    const notes: { caseId?: string }[] = JSON.parse(localStorage.getItem(`${PREFIX}notes`) || "[]");
    return notes.filter((n) => n.caseId === caseId).length;
  } catch {
    return 0;
  }
}

export function buildAuditLog(e: TimeEntry, caseName: string): AuditLog {
  const activity = activityWindow(e.savedAt, 4);
  const sections = Array.from(
    new Set(activity.filter((a) => a.type === "nav").map((a) => a.label)),
  );
  const sb = activity.filter((a) => a.type === "sounding_board");
  return {
    entryId: e.id,
    savedAt: e.savedAt,
    caseId: e.caseId,
    caseName,
    taskCode: e.taskCode,
    subCode: e.subCode,
    hours: e.hours,
    narrative: e.description,
    activity,
    soundingBoardSessions: sb.length,
    soundingBoardMinutes: 0,
    notesCount: notesForCase(e.caseId),
    sectionsOpened: sections,
  };
}

export function saveAuditLog(e: TimeEntry, caseName: string) {
  localStorage.setItem(`${PREFIX}auditlog:${e.id}`, JSON.stringify(buildAuditLog(e, caseName)));
}

export function readAuditLog(entryId: string): AuditLog | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}auditlog:${entryId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ---------------- iTimeKeep export ---------------- */

export function mdy(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

export function itimekeepLine(e: TimeEntry, c?: Case): string {
  const codes = codesFor(e.taskCode);
  return [
    mdy(e.date),
    c?.clientNumber || "",
    c?.matterNumber || "",
    codes?.l || e.taskCode,
    codes?.a || e.subCode,
    e.hours.toFixed(1),
    e.description,
  ].join(" | ");
}

/* ---------------- Claude-backed narrative + appeal ---------------- */

const NARRATIVE_SYSTEM = `You are a legal billing assistant for a first-year associate at a New York defense litigation firm. Generate billing narratives that survive client audit, partner review, and AI billing review tools.

RULES — apply every single time:
- One task per narrative. Never combine multiple tasks.
- Specific action verb first: Drafted / Reviewed / Conferred / Researched / Prepared / Attended / Corresponded / Analyzed / Revised
- Name the exact document, motion, or party involved
- Include relevant case-specific detail
- Between 8 and 25 words total
- Past tense always
- No em dashes ever
- No block billing language
- No vague terms: worked on / assisted / various / reviewed file / handled matter / addressed issues

BILLING INCREMENTS:
Round to nearest 0.1 hours.
Minimum entry: 0.1 hours.

GOOD narrative examples:
Reviewed 28-page IME report of Dr. John Smith re: plaintiff right wrist injury.
Drafted argument section of motion for summary judgment re: constructive notice defense.
Telephone conference with client representative R. Coyle re: discovery status and compliance conference scheduling.
Reviewed plaintiff deposition transcript pages 1-85 re: liability testimony and incident conditions.
Corresponded with plaintiff counsel re: outstanding HIPAA authorizations for prior medical treatment.

BAD narratives — never generate these:
Worked on case.
Reviewed documents.
Drafted motion.
Various tasks.
Assisted partner with matter.
Reviewed file and drafted correspondence.

Return ONLY the narrative. No explanation. No preamble. Nothing else.`;

const APPEAL_SYSTEM = `You are helping a litigation associate at a New York defense firm respond to a client billing audit flag. Write a professional appeal response that:
- Directly addresses the specific flag reason
- Cites concrete activities from the log provided
- Uses formal billing dispute language
- Is concise — no more than 150 words
- Does not sound defensive or apologetic
- States clearly that the time is supported
- Ends with a direct request to approve the entry

Return only the appeal response. No preamble.`;

export async function generateNarrative(task: string, sub: string, description: string): Promise<string> {
  const user = `Task code: ${task}\nSub code: ${sub}\nRough notes: ${description}\n\nWrite the billing narrative.`;
  return (await callClaude(NARRATIVE_SYSTEM, user)).trim();
}

export async function generateAppeal(entryLine: string, log: AuditLog, flagReason: string): Promise<string> {
  const ctx = [
    `Case: ${log.caseName}`,
    `Task / Sub: ${log.taskCode} / ${log.subCode}`,
    `Time logged: ${log.hours.toFixed(1)} hours`,
    `Saved: ${log.savedAt}`,
    `Sections active: ${log.sectionsOpened.join(", ") || "n/a"}`,
    `Notes for case: ${log.notesCount}`,
    `Activity trail:`,
    ...log.activity.map((a) => `  - ${new Date(a.time).toLocaleString()} ${a.type}: ${a.label}`),
  ].join("\n");
  const user = `BILLING ENTRY:\n${entryLine}\n\nAUDIT LOG CONTEXT:\n${ctx}\n\nAUDIT FLAG REASON:\n${flagReason}\n\nWrite the appeal response.`;
  return (await callClaude(APPEAL_SYSTEM, user)).trim();
}
