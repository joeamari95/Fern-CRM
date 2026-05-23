"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card, SectionHeader, Tag } from "@/components/ui";
import { Modal, EntryForm, RowActions, AddButton, EmptyState, Attachments, type Field } from "@/components/forms";
import { useCollection, caseKey, newId } from "@/lib/store/local";
import { fmtDate } from "@/lib/format";
import type { DocketEntry } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "filingNumber", label: "Filing Number", kind: "text", placeholder: "e.g. NYSCEF 5" },
  { name: "name", label: "Document Name", kind: "text", required: true, placeholder: "e.g. Verified Answer" },
  { name: "party", label: "Filed By (Party)", kind: "text", placeholder: "e.g. Defendant / Plaintiff / Court" },
  { name: "date", label: "Date Filed", kind: "date" },
  { name: "notes", label: "Notes", kind: "textarea", placeholder: "Summary or significance…" },
];

export default function CourtPage() {
  const { id } = useParams<{ id: string }>();
  const { items, add, update, remove, ready } = useCollection<DocketEntry>(caseKey(id, "docket"));
  const [editing, setEditing] = useState<DocketEntry | "new" | null>(null);
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  function save(v: Record<string, string>) {
    if (editing === "new") add({ id: newId(), ...(v as unknown as Omit<DocketEntry, "id">) });
    else if (editing) update(editing.id, v as Partial<DocketEntry>);
    setEditing(null);
  }

  return (
    <>
      <CaseHeader caseId={id} title="Court Tracking" />
      <div className="card-2 p-4 mb-5 flex items-center gap-2" style={{ borderColor: "rgba(122,168,255,0.3)" }}>
        <span className="dot dot-blue" />
        <span className="text-[12.5px] text-[var(--muted)]">Log NYSCEF / e-Courts docket entries as they post. Live auto-sync is a future addition.</span>
      </div>
      <Card>
        <SectionHeader title="Docket — NYSCEF" sub="Filings and court activity" right={<AddButton onClick={() => setEditing("new")} label="Add filing" />} />
        {!ready ? null : sorted.length === 0 ? (
          <EmptyState title="No docket entries yet" hint="Record filings from NYSCEF / e-Courts so the full docket lives in one place." onAdd={() => setEditing("new")} addLabel="Add your first filing" />
        ) : (
          <div className="flex flex-col">
            {sorted.map((d) => (
              <div key={d.id} className="flex items-start gap-4 py-3 border-b hairline last:border-0">
                <div className="w-20 shrink-0">{d.filingNumber ? <div className="tag">{d.filingNumber}</div> : <span className="text-[11px] text-[var(--faint)]">—</span>}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium">{d.name}</span>
                    {d.party && <Tag>{d.party}</Tag>}
                  </div>
                  {d.notes && <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-snug">{d.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[var(--faint)]">{fmtDate(d.date)}</span>
                  <RowActions onEdit={() => setEditing(d)} onDelete={() => remove(d.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
        <Attachments section={caseKey(id, "court")} />
      </Card>

      {editing && (
        <Modal title={editing === "new" ? "Add filing" : "Edit filing"} onClose={() => setEditing(null)}>
          <EntryForm fields={FIELDS} initial={editing === "new" ? undefined : (editing as unknown as Record<string, string>)} onSubmit={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
