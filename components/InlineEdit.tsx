"use client";

import { useEffect, useRef, useState } from "react";
import { fmtDate } from "@/lib/format";

// Click-to-edit text, CRM style. Saves on Enter or blur; Esc cancels.
export function InlineText({
  value,
  onSave,
  placeholder = "Click to edit",
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => ref.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        className="inline-edit-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <button className={`inline-edit ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {value ? value : <span className="text-[var(--faint)]">{placeholder}</span>}
    </button>
  );
}

// Click-to-edit date. Saves immediately on change; closes on blur.
export function InlineDate({
  value,
  onSave,
  placeholder = "Set date",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) requestAnimationFrame(() => ref.current?.focus());
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        className="inline-edit-input"
        defaultValue={value}
        onChange={(e) => onSave(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") setEditing(false);
        }}
      />
    );
  }
  return (
    <button className="inline-edit" onClick={() => setEditing(true)} title="Click to edit date">
      {value ? fmtDate(value) : <span className="text-[var(--faint)]">{placeholder}</span>}
    </button>
  );
}
