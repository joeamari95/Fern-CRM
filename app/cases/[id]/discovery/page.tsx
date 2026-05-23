"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card, SectionHeader, Pill, Tag } from "@/components/ui";
import { Modal, EntryForm, RowActions, AddButton, EmptyState, Attachments, type Field } from "@/components/forms";
import DocIngest from "@/components/DocIngest";
import { useCollection, caseKey, newId } from "@/lib/store/local";
import type { DocExtraction } from "@/lib/openai";
import { fmtDate, relativeDue, toISODate } from "@/lib/format";
import type { Accent, DiscoveryItem, DiscoveryStatus } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "name", label: "Item Name", kind: "text", required: true, placeholder: "e.g. First Notice for Discovery & Inspection" },
  { name: "type", label: "Type", kind: "select", options: ["Document Demand", "Interrogatories", "Bill of Particulars", "Deposition", "Subpoena", "Disclosure"].map((t) => ({ value: t, label: t })) },
  { name: "direction", label: "Direction", kind: "select", options: [{ value: "outgoing", label: "Outgoing (we serve)" }, { value: "incoming", label: "Incoming (served on us)" }] },
  { name: "dueDate", label: "Due Date", kind: "date" },
  { name: "status", label: "Status", kind: "select", options: [{ value: "to-draft", label: "To Draft" }, { value: "to-serve", label: "To Serve" }, { value: "served", label: "Served" }, { value: "responses-due", label: "Responses Due" }, { value: "received", label: "Received" }, { value: "complete", label: "Complete" }] },
  { name: "notes", label: "Notes", kind: "textarea", placeholder: "Notes on this item…" },
];

const statusAccent: Record<DiscoveryStatus, Accent> = { "to-draft": "rose", "to-serve": "amber", served: "blue", "responses-due": "rose", received: "teal", complete: "green" };
const statusLabel: Record<DiscoveryStatus, string> = { "to-draft": "To Draft", "to-serve": "To Serve", served: "Served", "responses-due": "Responses Due", received: "Received", complete: "Complete" };

export default function DiscoveryPage() {
  const { id } = useParams<{ id: string }>();
  const { items, add, update, remove, ready } = useCollection<DiscoveryItem>(caseKey(id, "discovery"));
  const [editing, setEditing] = useState<DiscoveryItem | "new" | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string> | undefined>(undefined);
  const txt = (v?: string[] | string) => (Array.isArray(v) ? v.join("; ") : v || "");
  const mapToFields = (d: DocExtraction): Record<string, string> => ({
    name: d.document_type || "",
    type: "Document Demand",
    direction: "incoming",
    dueDate: toISODate(txt(d.document_date)),
    status: "received",
    notes: txt(d.action_items) || txt(d.deadlines) || "",
  });

  const outgoing = items.filter((d) => d.direction === "outgoing");
  const incoming = items.filter((d) => d.direction === "incoming");

  function save(v: Record<string, string>) {
    if (editing === "new") add({ id: newId(), ...(v as unknown as Omit<DiscoveryItem, "id">) });
    else if (editing) update(editing.id, v as Partial<DiscoveryItem>);
    setEditing(null);
  }

  function Column({ title, sub, list }: { title: string; sub: string; list: DiscoveryItem[] }) {
    return (
      <Card>
        <SectionHeader title={title} sub={sub} right={<Tag>{list.length}</Tag>} />
        {list.length === 0 ? (
          <p className="text-[12.5px] text-[var(--faint)] py-4">Nothing here yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((d) => (
              <div key={d.id} className={`card-2 p-3.5 accent-bar bar-${statusAccent[d.status] === "green" ? "teal" : statusAccent[d.status]} pl-4`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13.5px] font-medium leading-snug">{d.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Pill accent={statusAccent[d.status]}>{statusLabel[d.status]}</Pill>
                    <RowActions onEdit={() => setEditing(d)} onDelete={() => remove(d.id)} />
                  </div>
                </div>
                {d.notes && <p className="text-[12px] text-[var(--muted)] mt-1.5 leading-snug">{d.notes}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {d.type && <Tag>{d.type}</Tag>}
                  {d.dueDate && <span className="text-[11px] text-[var(--faint)]">{fmtDate(d.dueDate)}{relativeDue(d.dueDate) && ` · ${relativeDue(d.dueDate)}`}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  return (
    <>
      <CaseHeader caseId={id} title="Discovery" />
      <div className="flex items-center justify-between -mt-3 mb-5 gap-3">
        <p className="text-[13px] text-[var(--muted)]">Demands to send out and the status of document exchange.</p>
        <div className="flex items-center gap-2">
          <DocIngest mapToFields={mapToFields} onApply={(p) => { setPrefill(p); setEditing("new"); }} />
          <AddButton onClick={() => { setPrefill(undefined); setEditing("new"); }} label="Add discovery item" />
        </div>
      </div>

      {!ready ? null : items.length === 0 ? (
        <EmptyState title="No discovery items yet" hint="Track outgoing demands you serve and incoming demands you must answer." onAdd={() => { setPrefill(undefined); setEditing("new"); }} addLabel="Add your first discovery item" />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <Column title="Our Demands (Outgoing)" sub="Discovery we serve" list={outgoing} />
          <Column title="Served On Us (Incoming)" sub="Demands we must answer" list={incoming} />
        </div>
      )}

      <div className="mt-5">
        <Card>
          <SectionHeader title="Discovery Documents" sub="Served demands, responses, productions" />
          <Attachments section={caseKey(id, "discovery")} />
        </Card>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Add discovery item" : "Edit discovery item"} onClose={() => setEditing(null)}>
          <EntryForm fields={FIELDS} initial={editing === "new" ? prefill : (editing as unknown as Record<string, string>)} onSubmit={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
