"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { Card, SectionHeader } from "@/components/ui";
import { Modal, EntryForm, EmptyState, type Field } from "@/components/forms";
import { useLocalObject } from "@/lib/store/local";
import type { CaseProfile } from "@/lib/types";

const FIELDS: Field[] = [
  { name: "caption", label: "Caption", kind: "text", required: true, placeholder: "e.g. Doe v. Acme Property Holdings LLC" },
  { name: "index", label: "Index / Docket No.", kind: "text", placeholder: "e.g. 720202/2025" },
  { name: "court", label: "Court", kind: "text", placeholder: "e.g. Supreme Court of the State of New York" },
  { name: "county", label: "County", kind: "text", placeholder: "e.g. New York County" },
  { name: "justice", label: "Assigned Justice", kind: "text", placeholder: "e.g. Hon. Eleanor Vance, J.S.C." },
  { name: "type", label: "Cause of Action", kind: "text", placeholder: "e.g. Premises Liability — Slip & Fall" },
  { name: "weRepresent", label: "We Represent", kind: "text", placeholder: "e.g. Defendant — Acme Property Holdings LLC" },
  { name: "status", label: "Status", kind: "text", placeholder: "e.g. Discovery" },
  { name: "summary", label: "Summary", kind: "textarea", placeholder: "Brief description of the matter…" },
];

export default function CasePage() {
  const { value: c, setValue, ready } = useLocalObject<CaseProfile>("case");
  const [editing, setEditing] = useState(false);

  const facts: [string, string][] = c
    ? [
        ["Index No.", c.index],
        ["Court", c.court],
        ["County", c.county],
        ["Assigned", c.justice],
        ["Cause of Action", c.type],
        ["We Represent", c.weRepresent],
        ["Status", c.status],
      ]
    : [];

  return (
    <>
      <Header title="Case Overview" />

      {!ready ? null : !c ? (
        <EmptyState
          title="No matter set up yet"
          hint="Add your case details — they appear across the app's header and sidebar."
          onAdd={() => setEditing(true)}
          addLabel="Set up your matter"
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card>
              <SectionHeader
                title={c.caption || "Untitled matter"}
                sub={c.index ? `Index No. ${c.index}` : undefined}
                right={
                  <button className="btn" onClick={() => setEditing(true)}>
                    ✎ Edit
                  </button>
                }
              />
              {c.summary ? (
                <p className="text-[14px] leading-relaxed text-[var(--muted)] whitespace-pre-wrap">
                  {c.summary}
                </p>
              ) : (
                <p className="text-[13px] text-[var(--faint)]">No summary yet.</p>
              )}
            </Card>
          </div>
          <Card>
            <SectionHeader title="Case Facts" />
            <dl className="flex flex-col gap-2.5">
              {facts.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b hairline pb-2.5 last:border-0"
                >
                  <dt className="text-[12px] text-[var(--faint)]">{k}</dt>
                  <dd className="text-[13px] text-right">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {editing && (
        <Modal title={c ? "Edit matter" : "Set up matter"} onClose={() => setEditing(false)}>
          <EntryForm
            fields={FIELDS}
            initial={c ? (c as unknown as Record<string, string>) : undefined}
            onSubmit={(v) => {
              setValue(v as unknown as CaseProfile);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
            submitLabel={c ? "Save" : "Create matter"}
          />
        </Modal>
      )}
    </>
  );
}
