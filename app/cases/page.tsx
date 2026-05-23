"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionHeader, Dot, Pill } from "@/components/ui";
import { Modal, EntryForm, AddButton, EmptyState, RowActions, type Field } from "@/components/forms";
import SeedControls from "@/components/SeedControls";
import { useCollection, readCollection, caseKey, newId } from "@/lib/store/local";
import { assignCaseColor } from "@/lib/caseColors";
import { fmtDate, relativeDue, ago, daysFromToday, dueAccent } from "@/lib/format";
import { STAGES, type Accent, type Case, type Deadline } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "name", label: "Case Name", kind: "text", required: true, placeholder: "e.g. Smith v. Acme Realty LLC" },
  { name: "index", label: "Index Number", kind: "text", placeholder: "e.g. 451234/2026" },
  { name: "court", label: "Court", kind: "text", placeholder: "Supreme Court of the State of New York" },
  { name: "county", label: "County", kind: "text", placeholder: "e.g. New York County" },
  { name: "stage", label: "Stage", kind: "select", options: STAGES.map((s) => ({ value: s, label: s })) },
  { name: "opposingCounsel", label: "Opposing Counsel Firm", kind: "text", placeholder: "Plaintiff's firm" },
  { name: "supervisingPartner", label: "Supervising Partner", kind: "text", placeholder: "e.g. Michael Harrington" },
  { name: "role", label: "Your Role", kind: "text", placeholder: "e.g. Drafting discovery responses" },
  { name: "weRepresent", label: "We Represent", kind: "text", placeholder: "e.g. Defendant — Acme Realty LLC" },
];

export default function CaseListPage() {
  const { items: cases, add, update, remove, ready } = useCollection<Case>("cases");
  const [deadlinesByCase, setDeadlinesByCase] = useState<Record<string, Deadline[]>>({});
  const [editing, setEditing] = useState<Case | "new" | null>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [needsOnly, setNeedsOnly] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const map: Record<string, Deadline[]> = {};
    for (const c of cases) map[c.id] = readCollection<Deadline>(caseKey(c.id, "deadlines"));
    setDeadlinesByCase(map);
  }, [ready, cases]);

  function nextHard(caseId: string): Deadline | null {
    const list = (deadlinesByCase[caseId] ?? [])
      .filter((d) => d.hard && d.status !== "done" && !isNaN(daysFromToday(d.date)))
      .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));
    return list[0] ?? null;
  }
  function needsAttention(caseId: string): boolean {
    return (deadlinesByCase[caseId] ?? []).some((d) => {
      if (d.status === "done") return false;
      const n = daysFromToday(d.date);
      return d.status === "overdue" || (!isNaN(n) && n <= 7);
    });
  }

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (stage && c.stage !== stage) return false;
      if (needsOnly && !needsAttention(c.id)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases, q, stage, needsOnly, deadlinesByCase]);

  // Header stats
  const activeCount = cases.filter((c) => c.stage !== "Closed").length;
  let dueWeek = 0;
  let overdue = 0;
  Object.values(deadlinesByCase)
    .flat()
    .forEach((d) => {
      if (d.status === "done") return;
      const n = daysFromToday(d.date);
      if (d.status === "overdue" || (!isNaN(n) && n < 0)) overdue++;
      else if (!isNaN(n) && n <= 7) dueWeek++;
    });
  const stale = cases.filter((c) => {
    const n = daysFromToday(c.lastTouched);
    return !isNaN(n) && -n >= 7;
  }).length;

  function save(v: Record<string, string>) {
    if (editing === "new") {
      const id = newId();
      assignCaseColor(id);
      add({
        id,
        name: v.name,
        index: v.index,
        court: v.court,
        county: v.county,
        justice: "",
        stage: (v.stage as Case["stage"]) || "Pleadings",
        opposingCounsel: v.opposingCounsel,
        supervisingPartner: v.supervisingPartner,
        role: v.role,
        weRepresent: v.weRepresent,
        nextStep: "",
        nextStepDate: "",
        lastAction: "Matter opened",
        lastTouched: new Date().toISOString().slice(0, 10),
        notes: [],
        summary: "",
      });
    } else if (editing) {
      update(editing.id, v as Partial<Case>);
    }
    setEditing(null);
  }

  if (!ready) return <div className="h-10" />;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
        <h1 className="text-[26px] font-semibold tracking-tight">Case List</h1>
        <AddButton onClick={() => setEditing("new")} label="Add new case" />
      </div>

      {cases.length === 0 ? (
        <>
          <EmptyState
            title="No cases yet"
            hint="Add your first matter, or load the 11 sample cases to explore."
            onAdd={() => setEditing("new")}
            addLabel="Add your first case"
          />
          <SeedControls hasData={false} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <MiniStat label="Total Active" value={activeCount} accent="blue" />
            <MiniStat label="Due This Week" value={dueWeek} accent="amber" />
            <MiniStat label="Overdue" value={overdue} accent="rose" />
            <MiniStat label="Stale 7+ Days" value={stale} accent="muted" />
          </div>

          <Card>
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <input
                className="input max-w-[260px]"
                placeholder="Search by case name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select className="input max-w-[180px]" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">All stages</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                className={`btn ${needsOnly ? "btn-accent" : ""}`}
                onClick={() => setNeedsOnly((v) => !v)}
              >
                Needs Attention
              </button>
              <span className="text-[12px] text-[var(--faint)] ml-auto">
                {filtered.length} of {cases.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--faint)]">
                    <th className="py-2 pr-2"></th>
                    <th className="py-2 pr-3">Case</th>
                    <th className="py-2 pr-3">Stage</th>
                    <th className="py-2 pr-3">Next Step</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Opposing Counsel</th>
                    <th className="py-2 pr-3">Partner</th>
                    <th className="py-2 pr-3">Last Touched</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const nd = nextHard(c.id);
                    const accent: Accent = nd ? dueAccent(nd.date) : "teal";
                    return (
                      <tr key={c.id} className="border-t hairline align-top">
                        <td className="py-2.5 pr-2">
                          <Dot accent={accent} />
                        </td>
                        <td className="py-2.5 pr-3">
                          <Link href={`/cases/${c.id}`} className="font-medium hover:text-[var(--blue)]">
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="tag">{c.stage}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--muted)] max-w-[200px]">
                          {c.nextStep || "—"}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {nd ? (
                            <>
                              <span className="text-[var(--muted)]">{fmtDate(nd.date)}</span>{" "}
                              <Pill accent={accent}>{relativeDue(nd.date)}</Pill>
                            </>
                          ) : (
                            <span className="text-[var(--faint)]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--muted)]">{c.opposingCounsel || "—"}</td>
                        <td className="py-2.5 pr-3 text-[var(--muted)]">{c.supervisingPartner || "—"}</td>
                        <td className="py-2.5 pr-3 text-[var(--faint)] whitespace-nowrap">
                          {ago(c.lastTouched)}
                        </td>
                        <td className="py-2.5 pr-3 max-w-[180px]">
                          {c.notes.length === 0 ? (
                            <span className="text-[var(--faint)]">—</span>
                          ) : (
                            <div className="notes-cell">
                              <span className="text-[var(--muted)] truncate block">{c.notes[0]}</span>
                              <div className="notes-pop card-2">
                                <ul className="list-disc pl-4 flex flex-col gap-1">
                                  {c.notes.slice(0, 3).map((n, i) => (
                                    <li key={i} className="text-[12px] text-[var(--muted)]">
                                      {n}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          <RowActions onEdit={() => setEditing(c)} onDelete={() => remove(c.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <SeedControls hasData={true} />
        </>
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add new case" : "Edit case"} onClose={() => setEditing(null)}>
          <EntryForm
            fields={FIELDS}
            initial={editing === "new" ? undefined : (editing as unknown as Record<string, string>)}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            submitLabel={editing === "new" ? "Create case" : "Save"}
          />
        </Modal>
      )}
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: Accent }) {
  return (
    <div className="card-2 p-4">
      <div className="flex items-center gap-2">
        <Dot accent={accent} />
        <span className="text-[11px] uppercase tracking-wide text-[var(--faint)]">{label}</span>
      </div>
      <div className="text-[22px] font-semibold mt-1.5">{value}</div>
    </div>
  );
}
