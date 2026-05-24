"use client";

import { useState } from "react";
import { RowActions } from "@/components/forms";
import { getCaseColor } from "@/lib/caseColors";
import { itimekeepLine } from "@/lib/time";
import type { Case, TimeEntry } from "@/lib/types";

function daysOld(dateISO: string): number {
  const d = new Date(dateISO + "T00:00:00").getTime();
  return Math.floor((Date.now() - d) / 86400000);
}

export default function EntryRow({
  entry,
  caseObj,
  onEdit,
  onDelete,
  onAudit,
}: {
  entry: TimeEntry;
  caseObj?: Case;
  onEdit: () => void;
  onDelete: () => void;
  onAudit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const old = daysOld(entry.date) >= 14;

  async function copyLine() {
    await navigator.clipboard.writeText(itimekeepLine(entry, caseObj));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="py-3 border-b hairline last:border-0 flex items-start justify-between gap-3 accent-bar pl-3"
      style={{ borderLeft: `3px solid ${getCaseColor(entry.caseId)}` }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag">{entry.taskCode}</span>
          <span className="tag">{entry.subCode}</span>
        </div>
        <p className="text-[13.5px] mt-1.5 leading-snug">{entry.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <button className="text-[11px] text-[var(--blue)] hover:underline" onClick={copyLine}>
            {copied ? "Copied ✓" : "Copy for iTimeKeep"}
          </button>
          {old && (
            <button className="text-[11px] text-[var(--amber)] hover:underline" onClick={onAudit} title="Audit Defense">
              🛡 Audit Defense
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[14px] font-semibold tabular-nums">{entry.hours.toFixed(1)}h</span>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
