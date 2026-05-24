"use client";

import { useState } from "react";
import { readAuditLog, buildAuditLog, generateAppeal, itimekeepLine } from "@/lib/time";
import type { Case, TimeEntry } from "@/lib/types";

export default function AuditPanel({
  entry,
  caseObj,
  onClose,
}: {
  entry: TimeEntry;
  caseObj?: Case;
  onClose: () => void;
}) {
  const caseName = caseObj?.name || "Unknown case";
  const log = readAuditLog(entry.id) || buildAuditLog(entry, caseName);

  const [flag, setFlag] = useState("");
  const [appeal, setAppeal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!flag.trim() || loading) return;
    setLoading(true);
    setError("");
    setAppeal("");
    try {
      setAppeal(await generateAppeal(itimekeepLine(entry, caseObj), log, flag.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(appeal);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const saved = new Date(log.savedAt);

  return (
    <>
      <div className="audit-overlay" onClick={onClose} aria-hidden />
      <aside className="audit-panel" role="dialog" aria-label="Audit Defense">
        <div className="flex items-center gap-3 px-4 py-3 border-b hairline">
          <div className="font-semibold text-[15px]">Activity log for this entry</div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Field label="Date" value={entry.date} />
            <Field label="Saved" value={saved.toLocaleString()} />
            <Field label="Case" value={caseName} />
            <Field label="Time" value={`${entry.hours.toFixed(1)} h`} />
            <Field label="Task" value={entry.taskCode} />
            <Field label="Sub" value={entry.subCode} />
          </div>

          <div>
            <div className="field-label">Narrative</div>
            <p className="text-[13px] text-[var(--muted)] mt-1">{entry.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Sections" value={String(log.sectionsOpened.length)} />
            <Stat label="SB sessions" value={`${log.soundingBoardSessions}`} />
            <Stat label="Notes" value={String(log.notesCount)} />
          </div>

          {log.sectionsOpened.length > 0 && (
            <div>
              <div className="field-label">Sections active during this session</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {log.sectionsOpened.map((s) => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="field-label">Activity trail (4h window)</div>
            {log.activity.length === 0 ? (
              <p className="text-[12.5px] text-[var(--faint)] mt-1">No logged activity in this window.</p>
            ) : (
              <ul className="list-disc pl-4 mt-1.5 flex flex-col gap-1">
                {log.activity.map((a, i) => (
                  <li key={i} className="text-[12.5px] text-[var(--muted)]">
                    <span className="text-[var(--faint)]">{new Date(a.time).toLocaleTimeString()} </span>
                    {a.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Appeal generator */}
          <div className="card-2 p-3.5">
            <div className="text-[13.5px] font-medium mb-2">Entry flagged in audit? Generate an appeal.</div>
            <textarea
              className="input"
              rows={3}
              placeholder="Paste the audit flag reason here"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
            />
            <div className="flex items-center gap-2 mt-2">
              <button className="btn btn-accent" onClick={generate} disabled={loading || !flag.trim()}>
                {loading ? "Generating…" : "Generate Appeal Response"}
              </button>
              {error && <span className="text-[12px] text-[var(--rose)]">{error}</span>}
            </div>
            {appeal && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="field-label">Appeal response</span>
                  <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
                </div>
                <textarea className="input" rows={7} value={appeal} onChange={(e) => setAppeal(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="field-label">{label}</div>
      <div className="text-[13px] text-[var(--muted)] break-words">{value}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2 p-2.5 text-center">
      <div className="text-[18px] font-semibold">{value}</div>
      <div className="text-[10.5px] uppercase tracking-wide text-[var(--faint)]">{label}</div>
    </div>
  );
}
