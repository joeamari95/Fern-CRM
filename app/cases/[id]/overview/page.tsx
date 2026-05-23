"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card, SectionHeader } from "@/components/ui";
import { Modal, EntryForm, EmptyState, type Field } from "@/components/forms";
import { useCollection } from "@/lib/store/local";
import { STAGES, type Case } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "name", label: "Caption", kind: "text", required: true },
  { name: "index", label: "Index / Docket No.", kind: "text" },
  { name: "court", label: "Court", kind: "text" },
  { name: "county", label: "County", kind: "text" },
  { name: "justice", label: "Assigned Justice", kind: "text" },
  { name: "stage", label: "Stage", kind: "select", options: STAGES.map((s) => ({ value: s, label: s })) },
  { name: "weRepresent", label: "We Represent", kind: "text" },
  { name: "opposingCounsel", label: "Opposing Counsel", kind: "text" },
  { name: "supervisingPartner", label: "Supervising Partner", kind: "text" },
  { name: "role", label: "My Role", kind: "text" },
  { name: "nextStep", label: "Next Step", kind: "text" },
  { name: "lastAction", label: "Last Action Taken", kind: "text" },
  { name: "notes", label: "Notes (one per line)", kind: "textarea", placeholder: "One short bullet per line" },
  { name: "summary", label: "Summary", kind: "textarea" },
];

export default function CaseOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { items, update, ready } = useCollection<Case>("cases");
  const c = items.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);

  function toForm(x: Case): Record<string, string> {
    return { ...x, notes: (x.notes ?? []).join("\n") } as unknown as Record<string, string>;
  }
  function save(v: Record<string, string>) {
    update(id, {
      ...(v as Partial<Case>),
      notes: v.notes ? v.notes.split("\n").map((s) => s.trim()).filter(Boolean) : [],
      lastTouched: new Date().toISOString().slice(0, 10),
    } as Partial<Case>);
    setEditing(false);
  }

  if (!ready) return <CaseHeader caseId={id} title="Case Overview" />;
  if (!c)
    return (
      <>
        <CaseHeader caseId={id} title="Case Overview" />
        <EmptyState title="Case not found" hint="This matter does not exist. Return to the Case List." />
      </>
    );

  const facts: [string, string][] = [
    ["Index No.", c.index],
    ["Court", c.court],
    ["County", c.county],
    ["Assigned", c.justice],
    ["Stage", c.stage],
    ["We Represent", c.weRepresent],
    ["Opposing Counsel", c.opposingCounsel],
    ["Supervising Partner", c.supervisingPartner],
    ["My Role", c.role],
  ];

  return (
    <>
      <CaseHeader caseId={id} title="Case Overview" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card>
            <SectionHeader
              title={c.name}
              sub={c.index ? `Index No. ${c.index}` : undefined}
              right={<button className="btn" onClick={() => setEditing(true)}>✎ Edit</button>}
            />
            {c.summary ? (
              <p className="text-[14px] leading-relaxed text-[var(--muted)] whitespace-pre-wrap">{c.summary}</p>
            ) : (
              <p className="text-[13px] text-[var(--faint)]">No summary yet.</p>
            )}
          </Card>
          <Card>
            <SectionHeader title="Notes" />
            {c.notes && c.notes.length > 0 ? (
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                {c.notes.map((n, i) => (
                  <li key={i} className="text-[13.5px] text-[var(--muted)]">{n}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[var(--faint)]">No notes yet.</p>
            )}
          </Card>
        </div>
        <Card>
          <SectionHeader title="Case Facts" />
          <dl className="flex flex-col gap-2.5">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b hairline pb-2.5 last:border-0">
                <dt className="text-[12px] text-[var(--faint)]">{k}</dt>
                <dd className="text-[13px] text-right">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {editing && (
        <Modal title="Edit matter" onClose={() => setEditing(false)}>
          <EntryForm fields={FIELDS} initial={toForm(c)} onSubmit={save} onCancel={() => setEditing(false)} />
        </Modal>
      )}
    </>
  );
}
