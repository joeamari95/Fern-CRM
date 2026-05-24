"use client";

import { useEffect, useMemo, useState } from "react";
import { useCollection } from "@/lib/store/local";
import TimeEntryForm from "@/components/time/TimeEntryForm";
import DailyView from "@/components/time/DailyView";
import WeeklyView from "@/components/time/WeeklyView";
import AuditPanel from "@/components/time/AuditPanel";
import { readAllEntries, saveEntry, deleteEntry, todayISO } from "@/lib/time";
import type { Case, TimeEntry } from "@/lib/types";

function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function shift(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function pretty(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function TimeEntryPage() {
  const { items: cases } = useCollection<Case>("cases");
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [cursor, setCursor] = useState(todayISO());
  const [version, setVersion] = useState(0);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [auditEntry, setAuditEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    setAllEntries(readAllEntries());
  }, [version]);
  const reload = () => setVersion((v) => v + 1);

  const dayEntries = useMemo(() => allEntries.filter((e) => e.date === cursor), [allEntries, cursor]);

  function handleSubmit(entry: TimeEntry) {
    const caseName = cases.find((c) => c.id === entry.caseId)?.name || "";
    if (editing) {
      deleteEntry(editing);
      saveEntry(entry, caseName, false);
    } else {
      saveEntry(entry, caseName, true);
    }
    setEditing(null);
    setCursor(entry.date);
    reload();
  }

  function handleDelete(e: TimeEntry) {
    if (!confirm("Delete this time entry?")) return;
    deleteEntry(e);
    if (editing?.id === e.id) setEditing(null);
    reload();
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-1">
        <h1 className="text-[26px] font-semibold tracking-tight">Billable Hours</h1>
        <div className="flex rounded-lg overflow-hidden border hairline">
          <button className={`px-3 py-1.5 text-[13px] ${view === "daily" ? "bg-[var(--surface-3)]" : ""}`} onClick={() => setView("daily")}>
            Daily
          </button>
          <button className={`px-3 py-1.5 text-[13px] ${view === "weekly" ? "bg-[var(--surface-3)]" : ""}`} onClick={() => setView("weekly")}>
            Weekly
          </button>
        </div>
      </div>
      <p className="text-[13px] text-[var(--muted)] mb-5">
        Log time against a matter, generate an audit-proof narrative, and export to iTimeKeep.
      </p>

      <div className="mb-5">
        <TimeEntryForm cases={cases} editing={editing} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
      </div>

      {/* Date / week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn" onClick={() => setCursor(shift(cursor, view === "daily" ? -1 : -7))}>← Prev</button>
        <div className="text-[14px] font-medium">
          {view === "daily" ? pretty(cursor) : `Week of ${pretty(mondayOf(cursor))}`}
          {view === "daily" && cursor !== todayISO() && (
            <button className="text-[12px] text-[var(--blue)] ml-2 hover:underline" onClick={() => setCursor(todayISO())}>
              today
            </button>
          )}
        </div>
        <button className="btn" onClick={() => setCursor(shift(cursor, view === "daily" ? 1 : 7))}>Next →</button>
      </div>

      {view === "daily" ? (
        <DailyView entries={dayEntries} cases={cases} onEdit={setEditing} onDelete={handleDelete} onAudit={setAuditEntry} />
      ) : (
        <WeeklyView
          weekStart={mondayOf(cursor)}
          entries={allEntries}
          cases={cases}
          onEdit={setEditing}
          onDelete={handleDelete}
          onAudit={setAuditEntry}
        />
      )}

      {auditEntry && (
        <AuditPanel
          entry={auditEntry}
          caseObj={cases.find((c) => c.id === auditEntry.caseId)}
          onClose={() => setAuditEntry(null)}
        />
      )}
    </>
  );
}
