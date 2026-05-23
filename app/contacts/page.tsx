"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Card, SectionHeader, Tag } from "@/components/ui";
import {
  Modal,
  EntryForm,
  RowActions,
  AddButton,
  EmptyState,
  type Field,
} from "@/components/forms";
import { useCollection, newId } from "@/lib/store/local";
import type { Contact } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "partyName", label: "Party Name", kind: "text", required: true, placeholder: "e.g. Margaret Doe" },
  {
    name: "role",
    label: "Role",
    kind: "select",
    options: [
      "Plaintiff",
      "Defendant",
      "Our Client",
      "Witness",
      "Expert",
      "Third Party",
      "Business",
    ].map((r) => ({ value: r, label: r })),
  },
  { name: "firm", label: "Firm", kind: "text", placeholder: "Law firm or company" },
  { name: "attorney", label: "Attorney / Contact", kind: "text", placeholder: "Primary contact" },
  { name: "email", label: "Email", kind: "text", placeholder: "name@example.com" },
  { name: "phone", label: "Phone", kind: "text", placeholder: "(212) 555-0100" },
];

function Field2({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12.5px]">
      <span className="text-[var(--faint)] w-16 shrink-0">{label}</span>
      <span className="text-[var(--muted)] break-all">{value}</span>
    </div>
  );
}

export default function ContactsPage() {
  const { items, add, update, remove, ready } = useCollection<Contact>("contacts");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);

  function save(v: Record<string, string>) {
    if (editing === "new") add({ id: newId(), ...(v as unknown as Omit<Contact, "id">) });
    else if (editing) update(editing.id, v as Partial<Contact>);
    setEditing(null);
  }

  return (
    <>
      <Header title="Parties & Contacts" />
      <div className="flex items-center justify-between -mt-3 mb-5 gap-3">
        <p className="text-[13px] text-[var(--muted)]">
          Every party, witness, business, and law firm of record — in one place.
        </p>
        <AddButton onClick={() => setEditing("new")} label="Add contact" />
      </div>

      {!ready ? null : items.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          hint="Add parties, opposing counsel, witnesses, experts, and businesses."
          onAdd={() => setEditing("new")}
          addLabel="Add your first contact"
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {items.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-[15px] font-semibold">{p.partyName}</h2>
                  {p.role && (
                    <div className="mt-1">
                      <Tag>{p.role}</Tag>
                    </div>
                  )}
                </div>
                <RowActions onEdit={() => setEditing(p)} onDelete={() => remove(p.id)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Field2 label="Firm" value={p.firm} />
                <Field2 label="Attorney" value={p.attorney} />
                <Field2 label="Email" value={p.email} />
                <Field2 label="Phone" value={p.phone} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "Add contact" : "Edit contact"}
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
