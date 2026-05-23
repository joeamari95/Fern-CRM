"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card, SectionHeader, Tag, Dot, Pill } from "@/components/ui";
import { Modal, EntryForm, RowActions, AddButton, EmptyState, Attachments, type Field } from "@/components/forms";
import DocIngest from "@/components/DocIngest";
import { useCollection, caseKey, newId } from "@/lib/store/local";
import { fmtDate, toISODate } from "@/lib/format";
import type { DocExtraction } from "@/lib/openai";
import type { Accent, Correspondence, CorrespondenceType } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "date", label: "Date", kind: "date", required: true },
  { name: "type", label: "Type", kind: "select", options: ["Email", "Letter", "Call", "Court"].map((t) => ({ value: t, label: t })) },
  { name: "from", label: "From", kind: "text", required: true, placeholder: "Sender" },
  { name: "to", label: "To", kind: "text", required: true, placeholder: "Recipient" },
  { name: "summary", label: "Summary", kind: "textarea", placeholder: "What was communicated…" },
];

const typeAccent: Record<CorrespondenceType, Accent> = { Email: "teal", Letter: "blue", Call: "amber", Court: "peach" };

export default function CorrespondencePage() {
  const { id } = useParams<{ id: string }>();
  const { items, add, update, remove, ready } = useCollection<Correspondence>(caseKey(id, "correspondence"));
  const [editing, setEditing] = useState<Correspondence | "new" | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string> | undefined>(undefined);
  const txt = (v?: string[] | string) => (Array.isArray(v) ? v.join("; ") : v || "");
  const mapToFields = (d: DocExtraction): Record<string, string> => ({
    date: toISODate(txt(d.document_date)),
    type: "Letter",
    from: txt(d.parties),
    to: "",
    summary: txt(d.action_items) || (d.extracted_text || "").slice(0, 240) || d.document_type || "",
  });
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  function save(v: Record<string, string>) {
    if (editing === "new") add({ id: newId(), ...(v as unknown as Omit<Correspondence, "id">) });
    else if (editing) update(editing.id, v as Partial<Correspondence>);
    setEditing(null);
  }

  return (
    <>
      <CaseHeader caseId={id} title="Correspondence" />
      <Card>
        <SectionHeader
          title="Communication Log"
          sub="Emails, letters & calls between parties"
          right={
            <div className="flex items-center gap-2">
              <DocIngest mapToFields={mapToFields} onApply={(p) => { setPrefill(p); setEditing("new"); }} />
              <AddButton onClick={() => { setPrefill(undefined); setEditing("new"); }} label="Add entry" />
            </div>
          }
        />
        {!ready ? null : sorted.length === 0 ? (
          <EmptyState title="No correspondence logged yet" hint="Record emails, letters, and calls with clients, opposing counsel, and the court." onAdd={() => { setPrefill(undefined); setEditing("new"); }} addLabel="Log your first communication" />
        ) : (
          <div className="flex flex-col">
            {sorted.map((c) => {
              const accent = typeAccent[c.type] ?? "teal";
              return (
                <div key={c.id} className={`accent-bar bar-${accent === "peach" ? "amber" : accent} pl-4 py-3.5 border-b hairline last:border-0`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-1.5"><Dot accent={accent} /></span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-medium">{c.from} <span className="text-[var(--faint)]">→</span> {c.to}</span>
                          <Tag>{c.type}</Tag>
                        </div>
                        {c.summary && <p className="text-[12.5px] text-[var(--muted)] mt-1.5 leading-snug">{c.summary}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-[var(--faint)]">{fmtDate(c.date)}</span>
                      <RowActions onEdit={() => setEditing(c)} onDelete={() => remove(c.id)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Attachments section={caseKey(id, "correspondence")} />
      </Card>

      {editing && (
        <Modal title={editing === "new" ? "Add correspondence" : "Edit correspondence"} onClose={() => setEditing(null)}>
          <EntryForm fields={FIELDS} initial={editing === "new" ? prefill : (editing as unknown as Record<string, string>)} onSubmit={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
