"use client";

import { useEffect, useRef } from "react";
import { useCollection, newId } from "@/lib/store/local";

type Note = { id: string; text: string; x: number; y: number };

export default function StickyNotes() {
  const { items, add, update, remove, ready } = useCollection<Note>("notes");
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const updateRef = useRef(update);
  updateRef.current = update;

  function addNote() {
    const n = items.length;
    add({ id: newId(), text: "", x: 150 + ((n % 5) * 26), y: 120 + ((n % 5) * 26) });
  }

  // Global drag handlers (attached once).
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      updateRef.current(d.id, {
        x: Math.max(0, e.clientX - d.offX),
        y: Math.max(0, e.clientY - d.offY),
      });
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // Shift+N creates a note (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || (e.key !== "N" && e.key !== "n")) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      e.preventDefault();
      addNote();
    };
    const openNote = () => addNote();
    window.addEventListener("keydown", onKey);
    window.addEventListener("finn:new-note", openNote);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("finn:new-note", openNote);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <>
      <button className="note-fab" onClick={addNote} aria-label="New note (Shift+N)" title="New note (Shift+N)">
        ✎
      </button>

      {ready &&
        items.map((note) => (
          <div key={note.id} className="sticky-note" style={{ left: note.x, top: note.y }}>
            <div
              className="sticky-note-head"
              onPointerDown={(e) => {
                dragRef.current = { id: note.id, offX: e.clientX - note.x, offY: e.clientY - note.y };
              }}
            >
              <span className="text-[10px] uppercase tracking-wide text-[var(--faint)]">Note</span>
              <button
                className="ml-auto text-[var(--faint)] hover:text-[var(--rose)]"
                onClick={() => remove(note.id)}
                aria-label="Delete note"
              >
                ✕
              </button>
            </div>
            <textarea
              className="sticky-note-body"
              placeholder="Jot something down…"
              value={note.text}
              onChange={(e) => update(note.id, { text: e.target.value })}
            />
          </div>
        ))}
    </>
  );
}
