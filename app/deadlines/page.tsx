"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import {
  Modal,
  EntryForm,
  RowActions,
  AddButton,
  EmptyState,
  Attachments,
  type Field,
} from "@/components/forms";
import { useCollection, newId } from "@/lib/store/local";
import { fmtDate, relativeDue, daysFromToday } from "@/lib/format";
import type { Accent, Deadline, DeadlineStatus } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "date", label: "Date", kind: "date", required: true },
  { name: "description", label: "Description", kind: "text", required: true, placeholder: "e.g. Respond to document demand" },
  {
    name: "type",
    label: "Type",
    kind: "select",
    options: [
      { value: "US", label: "Us" },
      { value: "Joint", label: "Joint" },
      { value: "Court", label: "Court" },
    ],
  },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { value: "upcoming", label: "Upcoming" },
      { value: "due-soon", label: "Due Soon" },
      { value: "overdue", label: "Overdue" },
      { value: "done", label: "Done" },
    ],
  },
];

const statusAccent: Record<DeadlineStatus, Accent> = {
  overdue: "rose",
  "due-soon": "amber",
  upcoming: "teal",
  done: "green",
};
const statusLabel: Record<DeadlineStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  upcoming: "Upcoming",
  done: "Done",
};

export default function DeadlinesPage() {
  const { items, add, update, remove, ready } = useCollection<Deadline>("deadlines");
  const [editing, setEditing] = useState<Deadline | "new" | null>(null);

  const sorted = [...items].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    const da = daysFromToday(a.date);
    const db = daysFromToday(b.date);
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return da - db;
  });

  function save(v: Record<string, string>) {
    if (editing === "new") {
      add({ id: newId(), ...(v as unknown as Omit<Deadline, "id">) });
    } else if (editing) {
      update(editing.id, v as Partial<Deadline>);
    }
    setEditing(null);
  }

  return (
    <>
      <Header title="Deadlines" />
      <Card>
        <SectionHeader
          title="Case Calendar"
          sub="Court-ordered and CPLR deadlines"
          right={<AddButton onClick={() => setEditing("new")} label="Add deadline" />}
        />

        {!ready ? null : sorted.length === 0 ? (
          <EmptyState
            title="No deadlines yet"
            hint="Track court-ordered and CPLR deadlines here so nothing slips."
            onAdd={() => setEditing("new")}
            addLabel="Add your first deadline"
          />
        ) : (
          <div className="flex flex-col">
            {sorted.map((d) => {
              const accent = statusAccent[d.status];
              return (
                <div
                  key={d.id}
                  className={`accent-bar bar-${accent === "green" ? "teal" : accent} pl-4 py-3.5 border-b hairline last:border-0 flex items-start justify-between gap-4`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1.5">
                      <Dot accent={accent} />
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-[14px] font-medium ${d.status === "done" ? "line-through text-[var(--faint)]" : ""}`}
                      >
                        {d.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="tag">{d.type === "US" ? "Us" : d.type}</span>
                        <span className="text-[12px] text-[var(--faint)]">{fmtDate(d.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <Pill accent={accent}>{statusLabel[d.status]}</Pill>
                      {d.status !== "done" && relativeDue(d.date) && (
                        <div className="text-[11px] text-[var(--faint)] mt-1.5">
                          {relativeDue(d.date)}
                        </div>
                      )}
                    </div>
                    <RowActions onEdit={() => setEditing(d)} onDelete={() => remove(d.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Attachments section="deadlines" />
      </Card>

      {editing && (
        <Modal
          title={editing === "new" ? "Add deadline" : "Edit deadline"}
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
