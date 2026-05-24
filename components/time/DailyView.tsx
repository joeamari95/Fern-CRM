"use client";

import { Card } from "@/components/ui";
import { getCaseColor } from "@/lib/caseColors";
import EntryRow from "@/components/time/EntryRow";
import type { Case, TimeEntry } from "@/lib/types";

const DAILY_TARGET = 7.5;

export default function DailyView({
  entries,
  cases,
  onEdit,
  onDelete,
  onAudit,
}: {
  entries: TimeEntry[];
  cases: Case[];
  onEdit: (e: TimeEntry) => void;
  onDelete: (e: TimeEntry) => void;
  onAudit: (e: TimeEntry) => void;
}) {
  const byCase = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    if (!byCase.has(e.caseId)) byCase.set(e.caseId, []);
    byCase.get(e.caseId)!.push(e);
  }
  const grand = entries.reduce((s, e) => s + e.hours, 0);
  const caseById = (id: string) => cases.find((c) => c.id === id);

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-[13px] text-[var(--faint)] py-4 text-center">
          No time logged for this day yet. Add an entry above.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {[...byCase.entries()].map(([cid, list]) => {
        const total = list.reduce((s, e) => s + e.hours, 0);
        const c = caseById(cid);
        return (
          <Card key={cid}>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-[15px] font-semibold">
                <span style={{ width: 9, height: 9, borderRadius: 999, background: getCaseColor(cid) }} />
                {c?.name || "Unknown case"}
              </span>
              <span className="text-[13px] font-semibold tabular-nums">{total.toFixed(1)}h</span>
            </div>
            <div className="flex flex-col">
              {list.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  caseObj={c}
                  onEdit={() => onEdit(e)}
                  onDelete={() => onDelete(e)}
                  onAudit={() => onAudit(e)}
                />
              ))}
            </div>
          </Card>
        );
      })}

      <div className="card-2 p-4 flex items-center justify-between">
        <span className="text-[13px] text-[var(--muted)]">Daily total</span>
        <span className="text-[16px] font-semibold tabular-nums">
          {grand.toFixed(1)} <span className="text-[var(--faint)] text-[13px]">of {DAILY_TARGET} hours</span>
        </span>
      </div>
    </div>
  );
}
