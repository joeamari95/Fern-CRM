"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { getCaseColor } from "@/lib/caseColors";
import EntryRow from "@/components/time/EntryRow";
import { itimekeepLine } from "@/lib/time";
import type { Case, TimeEntry } from "@/lib/types";

const WEEK_TARGET = 37.5;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyView({
  weekStart, // Monday yyyy-mm-dd
  entries,
  cases,
  onEdit,
  onDelete,
  onAudit,
}: {
  weekStart: string;
  entries: TimeEntry[];
  cases: Case[];
  onEdit: (e: TimeEntry) => void;
  onDelete: (e: TimeEntry) => void;
  onAudit: (e: TimeEntry) => void;
}) {
  const days = DAY_NAMES.map((_, i) => addDays(weekStart, i));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const weekEntries = entries.filter((e) => days.includes(e.date));
  const weekTotal = weekEntries.reduce((s, e) => s + e.hours, 0);
  const maxDay = Math.max(
    WEEK_TARGET / 5,
    ...days.map((d) => weekEntries.filter((e) => e.date === d).reduce((s, e) => s + e.hours, 0)),
  );
  const caseById = (id: string) => cases.find((c) => c.id === id);

  async function exportWeek() {
    const lines = [...weekEntries]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((e) => itimekeepLine(e, caseById(e.caseId)));
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-[var(--muted)]">
            Week of {new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <button className="btn btn-accent" onClick={exportWeek} disabled={weekEntries.length === 0}>
            {copied ? "Copied ✓" : "Export Week"}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {days.map((d, i) => {
            const dayEntries = weekEntries.filter((e) => e.date === d);
            const dayTotal = dayEntries.reduce((s, e) => s + e.hours, 0);
            // stack by case
            const byCase = new Map<string, number>();
            dayEntries.forEach((e) => byCase.set(e.caseId, (byCase.get(e.caseId) || 0) + e.hours));
            return (
              <button
                key={d}
                className="flex flex-col items-center gap-2 group"
                onClick={() => setExpanded(expanded === d ? null : d)}
              >
                <div className="text-[11px] text-[var(--faint)]">{DAY_NAMES[i]}</div>
                <div className="w-full h-[140px] flex flex-col-reverse rounded-md overflow-hidden bg-[var(--surface-2)] border hairline">
                  {[...byCase.entries()].map(([cid, h]) => (
                    <div
                      key={cid}
                      title={`${caseById(cid)?.name || cid}: ${h.toFixed(1)}h`}
                      style={{ height: `${(h / maxDay) * 100}%`, background: getCaseColor(cid) }}
                    />
                  ))}
                </div>
                <div className="text-[13px] font-semibold tabular-nums">{dayTotal.toFixed(1)}h</div>
              </button>
            );
          })}
        </div>

        <div className="card-2 p-3 mt-4 flex items-center justify-between">
          <span className="text-[13px] text-[var(--muted)]">Week total</span>
          <span className="text-[16px] font-semibold tabular-nums">
            {weekTotal.toFixed(1)} <span className="text-[var(--faint)] text-[13px]">of {WEEK_TARGET} hours</span>
          </span>
        </div>
      </Card>

      {expanded && (
        <Card>
          <div className="text-[14px] font-semibold mb-2">
            {new Date(expanded + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          {weekEntries.filter((e) => e.date === expanded).length === 0 ? (
            <p className="text-[13px] text-[var(--faint)] py-3">No entries this day.</p>
          ) : (
            <div className="flex flex-col">
              {weekEntries
                .filter((e) => e.date === expanded)
                .map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    caseObj={caseById(e.caseId)}
                    onEdit={() => onEdit(e)}
                    onDelete={() => onDelete(e)}
                    onAudit={() => onAudit(e)}
                  />
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
