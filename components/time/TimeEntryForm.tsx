"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import MicButton from "@/components/MicButton";
import { getCaseColor } from "@/lib/caseColors";
import { TASK_CODES, SUB_CODES } from "@/lib/timeCodes";
import { generateNarrative, predict, todayISO, newEntryId } from "@/lib/time";
import type { Case, TimeEntry } from "@/lib/types";

function fmtElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimeEntryForm({
  cases,
  editing,
  onSubmit,
  onCancel,
}: {
  cases: Case[];
  editing: TimeEntry | null;
  onSubmit: (entry: TimeEntry) => void;
  onCancel: () => void;
}) {
  const active = cases.filter((c) => c.stage !== "Closed");
  const [caseId, setCaseId] = useState(editing?.caseId || active[0]?.id || "");
  const [taskCode, setTaskCode] = useState(editing?.taskCode || TASK_CODES[0].label);
  const [subCode, setSubCode] = useState(editing?.subCode || SUB_CODES[TASK_CODES[0].label][0]);
  const [description, setDescription] = useState(editing?.description || "");
  const [hours, setHours] = useState(editing ? String(editing.hours) : "");
  const [date, setDate] = useState(editing?.date || todayISO());
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");

  // Live timer
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const theCase = cases.find((c) => c.id === caseId);
  const subOptions = SUB_CODES[taskCode] || [];
  const prediction = predict(taskCode, subCode);

  // Cases load asynchronously; default the selector once they arrive.
  useEffect(() => {
    if (!editing && !caseId && active.length) setCaseId(active[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length]);

  // Keep sub code valid when task changes.
  useEffect(() => {
    if (!subOptions.includes(subCode)) setSubCode(subOptions[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskCode]);

  // Timer tick + 10-minute inactivity auto-pause.
  useEffect(() => {
    if (!running) return;
    lastActivityRef.current = Date.now();
    const bump = () => (lastActivityRef.current = Date.now());
    window.addEventListener("mousemove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("click", bump);
    intervalRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 10 * 60 * 1000) {
        setRunning(false);
        return;
      }
      setElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("click", bump);
    };
  }, [running]);

  function stopTimer() {
    setRunning(false);
    const h = Math.max(0.1, Math.round((elapsed / 3600) * 10) / 10);
    setHours(h.toFixed(1));
  }

  async function generate() {
    if (!description.trim() || genLoading) return;
    setGenLoading(true);
    setError("");
    try {
      setDescription(await generateNarrative(taskCode, subCode, description.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate narrative. Please try again.");
    } finally {
      setGenLoading(false);
    }
  }

  function save() {
    const h = Math.round(parseFloat(hours) * 10) / 10;
    if (!caseId) return setError("Select a case.");
    if (!taskCode || !subCode) return setError("Select a task and sub code.");
    if (!description.trim()) return setError("Add a description.");
    if (!h || h < 0.1 || isNaN(h)) return setError("Enter time (minimum 0.1 hours).");
    if (!date) return setError("Pick a date.");
    setError("");
    onSubmit({
      id: editing?.id || newEntryId(),
      date,
      caseId,
      taskCode,
      subCode,
      description: description.trim(),
      hours: h,
      savedAt: editing?.savedAt || new Date().toISOString(),
    });
    // reset for next entry (only when adding)
    if (!editing) {
      setDescription("");
      setHours("");
      setElapsed(0);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">{editing ? "Edit time entry" : "New time entry"}</h2>
        {editing && (
          <button className="btn" onClick={onCancel}>Cancel edit</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Case */}
        <label className="flex flex-col gap-1">
          <span className="field-label">Case</span>
          <select className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            {active.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {theCase && (
            <span className="text-[11px] text-[var(--faint)] flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: getCaseColor(caseId) }} />
              Client {theCase.clientNumber || "—"} · Matter {theCase.matterNumber || "—"}
            </span>
          )}
        </label>

        {/* Date */}
        <label className="flex flex-col gap-1">
          <span className="field-label">Date</span>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {/* Task code */}
        <label className="flex flex-col gap-1">
          <span className="field-label">Task Code</span>
          <select className="input" value={taskCode} onChange={(e) => setTaskCode(e.target.value)}>
            {TASK_CODES.map((t) => (
              <option key={t.label} value={t.label}>{t.label}</option>
            ))}
          </select>
        </label>

        {/* Sub code */}
        <label className="flex flex-col gap-1">
          <span className="field-label">Sub Code</span>
          <select className="input" value={subCode} onChange={(e) => setSubCode(e.target.value)}>
            {subOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Description */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="field-label">Description</span>
          <MicButton title="Dictate the description" onText={(t) => setDescription((p) => (p ? `${p} ${t}` : t))} />
        </div>
        <textarea
          className="input"
          rows={3}
          placeholder="What did you work on? Be specific."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center gap-2 mt-2">
          <button className="btn" onClick={generate} disabled={genLoading || !description.trim()}>
            {genLoading ? "Generating…" : "✦ Generate Narrative"}
          </button>
          <span className="text-[11px] text-[var(--faint)]">Audit-proof billing narrative. Review before saving.</span>
        </div>
      </div>

      {/* Time + timer */}
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="field-label">Time (hours)</span>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="input"
            placeholder="0.0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          {prediction && (
            <span className="text-[11px] text-[var(--faint)]">
              Est. {prediction.minutes} min based on {prediction.count} similar entries
            </span>
          )}
        </label>
        <div className="flex flex-col gap-1">
          <span className="field-label">Live Timer</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[18px] tabular-nums">{fmtElapsed(elapsed)}</span>
            {!running ? (
              <button className="btn" onClick={() => setRunning(true)}>▶ Start</button>
            ) : (
              <button className="btn btn-accent" onClick={stopTimer}>■ Stop</button>
            )}
            {elapsed > 0 && !running && (
              <button className="btn" onClick={() => setElapsed(0)}>Reset</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button className="btn btn-accent" onClick={save}>{editing ? "Save changes" : "Save entry"}</button>
        {error && <span className="text-[12.5px] text-[var(--rose)]">{error}</span>}
      </div>
    </Card>
  );
}
