"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Card, SectionHeader, Pill } from "@/components/ui";
import {
  Modal,
  EntryForm,
  RowActions,
  AddButton,
  EmptyState,
  type Field,
} from "@/components/forms";
import { useCollection, newId } from "@/lib/store/local";
import { fmtDate } from "@/lib/format";
import type { ReportEntry } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "label", label: "Report Label", kind: "text", required: true, placeholder: "e.g. Supplemental Report No. 1" },
  { name: "date", label: "Date", kind: "date", required: true },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { value: "current", label: "Current" },
      { value: "superseded", label: "Superseded" },
    ],
  },
  { name: "body", label: "Report Body", kind: "textarea", placeholder: "Status, liability, damages, next steps…" },
];

export default function ReportsPage() {
  const { items, add, update, remove, ready } = useCollection<ReportEntry>("reports");
  const [editing, setEditing] = useState<ReportEntry | "new" | null>(null);

  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  function save(v: Record<string, string>) {
    if (editing === "new") add({ id: newId(), ...(v as unknown as Omit<ReportEntry, "id">) });
    else if (editing) update(editing.id, v as Partial<ReportEntry>);
    setEditing(null);
  }

  return (
    <>
      <Header title="Reports" />
      <div className="flex items-center justify-between -mt-3 mb-5 gap-3">
        <p className="text-[13px] text-[var(--muted)]">
          Status reports to the client / carrier. Mark the latest “Current”; older ones “Superseded”.
        </p>
        <AddButton onClick={() => setEditing("new")} label="Add report" />
      </div>

      {!ready ? null : sorted.length === 0 ? (
        <EmptyState
          title="No reports yet"
          hint="Add an initial report, then supplemental reports as the matter develops."
          onAdd={() => setEditing("new")}
          addLabel="Add your first report"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[15px] font-semibold">{r.label}</span>
                  <span className="text-[12px] text-[var(--faint)] ml-2">{fmtDate(r.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill accent={r.status === "current" ? "green" : "muted"}>
                    {r.status === "current" ? "Current" : "Superseded"}
                  </Pill>
                  <RowActions onEdit={() => setEditing(r)} onDelete={() => remove(r.id)} />
                </div>
              </div>
              {r.body && (
                <p className="text-[13.5px] leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
                  {r.body}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Add report" : "Edit report"}
          onClose={() => setEditing(null)}
        >
          <EntryForm
            fields={FIELDS}
            initial={editing === "new" ? undefined : (editing as unknown as Record<string, string>)}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  );
}
