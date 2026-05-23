"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCollection, newId } from "@/lib/store/local";
import { saveBlob, deleteBlob, openBlobInNewTab } from "@/lib/store/files";
import type { Attachment } from "@/lib/types";
import { fmtDate } from "@/lib/format";

/* ---------------- Modal ---------------- */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Generic entry form ---------------- */
export type Field = {
  name: string;
  label: string;
  kind: "text" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};

export function EntryForm({
  fields,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  fields: Field[];
  initial?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        initial?.[f.name] ?? (f.kind === "select" ? (f.options?.[0]?.value ?? "") : ""),
      ]),
    ),
  );
  const set = (name: string, val: string) => setV((p) => ({ ...p, [name]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="flex flex-col gap-3.5"
    >
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1">
          <span className="field-label">
            {f.label}
            {f.required && <span className="text-rose"> *</span>}
          </span>
          {f.kind === "textarea" ? (
            <textarea
              className="input"
              rows={4}
              required={f.required}
              placeholder={f.placeholder}
              value={v[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : f.kind === "select" ? (
            <select
              className="input"
              value={v[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              type={f.kind === "date" ? "date" : "text"}
              required={f.required}
              placeholder={f.placeholder}
              value={v[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
            />
          )}
        </label>
      ))}
      <div className="flex justify-end gap-2 mt-1">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Row actions (edit / delete) ---------------- */
export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button className="icon-btn" onClick={onEdit} aria-label="Edit" title="Edit">
        ✎
      </button>
      <button
        className="icon-btn icon-btn-danger"
        onClick={() => {
          if (confirm("Delete this entry?")) onDelete();
        }}
        aria-label="Delete"
        title="Delete"
      >
        🗑
      </button>
    </div>
  );
}

export function AddButton({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button className="btn btn-accent" onClick={onClick}>
      + {label}
    </button>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  title,
  hint,
  onAdd,
  addLabel = "Add your first entry",
}: {
  title: string;
  hint?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="empty-state">
      <div className="text-[14px] font-medium">{title}</div>
      {hint && <p className="text-[12.5px] text-[var(--faint)] mt-1 max-w-sm mx-auto">{hint}</p>}
      {onAdd && (
        <button className="btn btn-accent mt-4" onClick={onAdd}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- Attachments (upload + list) ---------------- */
export function Attachments({ section }: { section: string }) {
  const { items, add, remove, ready } = useCollection<Attachment>(`attachments:${section}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const id = newId();
        await saveBlob(id, file);
        add({
          id,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          addedAt: new Date().toISOString().slice(0, 10),
        });
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove(a: Attachment) {
    if (!confirm(`Remove “${a.name}”?`)) return;
    await deleteBlob(a.id);
    remove(a.id);
  }

  return (
    <div className="mt-4 pt-4 border-t hairline">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] uppercase tracking-wide text-[var(--faint)]">
          Attachments {ready && items.length > 0 && `(${items.length})`}
        </span>
        <button className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "⤴ Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {ready && items.length === 0 ? (
        <p className="text-[12px] text-[var(--faint)]">
          No files yet. Upload PDFs, Word documents, or images.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((a) => (
            <div key={a.id} className="attachment-row">
              <button className="attachment-name" onClick={() => openBlobInNewTab(a.id, a.name)}>
                <span aria-hidden>{iconFor(a.type)}</span>
                <span className="truncate">{a.name}</span>
              </button>
              <span className="text-[11px] text-[var(--faint)] shrink-0">
                {kb(a.size)} · {fmtDate(a.addedAt)}
              </span>
              <button
                className="icon-btn icon-btn-danger shrink-0"
                onClick={() => onRemove(a)}
                title="Remove"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function iconFor(type: string): string {
  if (type.startsWith("image/")) return "🖼";
  if (type.includes("pdf")) return "📕";
  if (type.includes("word") || type.includes("msword") || type.includes("document")) return "📘";
  return "📄";
}
function kb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
