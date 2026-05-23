"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCollection, readCollection, caseKey, newId } from "@/lib/store/local";
import { getCaseColor, NEUTRAL } from "@/lib/caseColors";
import type { Case, Contact } from "@/lib/types";

type Note = { id: string; text: string; x: number; y: number; caseId?: string; noSuggest?: boolean };

const STOP = new Set([
  "llc", "corp", "inc", "llp", "pllc", "group", "partners", "properties", "realty",
  "holdings", "company", "the", "and", "ave", "avenue", "street", "defendant",
  "plaintiff", "counsel", "claims", "contact", "lead", "court", "supreme", "state",
  "york", "county", "matter", "case", "this", "that", "with", "from", "have", "need",
]);

const LAYER_KEY = "finn:notesLayer";

function tokens(s: string, min = 4): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= min && !STOP.has(t));
}

type Keywords = { strong: Set<string>; weak: Set<string> };

function buildKeywords(c: Case): Keywords {
  const strong = new Set<string>();
  const weak = new Set<string>();
  const plaintiff = c.name.split(" v. ")[0] ?? "";
  // Plaintiff surname allowed down to 3 chars (e.g. "Kim").
  tokens(plaintiff, 3).forEach((t) => strong.add(t));
  const defendant = c.name.split(" v. ")[1] ?? "";
  tokens(defendant).forEach((t) => strong.add(t));
  tokens(c.supervisingPartner).forEach((t) => weak.add(t));
  tokens(c.opposingCounsel).forEach((t) => weak.add(t));
  for (const ct of readCollection<Contact>(caseKey(c.id, "contacts"))) {
    tokens(ct.partyName, 3).forEach((t) => weak.add(t));
    tokens(ct.attorney).forEach((t) => weak.add(t));
  }
  return { strong, weak };
}

export default function StickyNotes() {
  const { items, add, update, remove, ready } = useCollection<Note>("notes");
  const { items: cases } = useCollection<Case>("cases");

  const [layerVisible, setLayerVisible] = useState(true);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const updateRef = useRef(update);
  updateRef.current = update;
  const tapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layerVisibleRef = useRef(layerVisible);
  layerVisibleRef.current = layerVisible;

  const keywords = useMemo(
    () => cases.map((c) => ({ c, kw: buildKeywords(c) })),
    [cases],
  );

  function suggestCase(text: string): Case | null {
    const set = new Set(tokens(text, 3));
    if (set.size === 0) return null;
    let best: { c: Case; score: number } | null = null;
    let positives = 0;
    for (const { c, kw } of keywords) {
      let s = 0;
      kw.strong.forEach((k) => set.has(k) && (s += 3));
      kw.weak.forEach((k) => set.has(k) && (s += 1));
      if (s > 0) positives++;
      if (s > 0 && (!best || s > best.score)) best = { c, score: s };
    }
    if (!best) return null;
    // Name match is high-confidence; a weak-only match must be unambiguous.
    if (best.score >= 3) return best.c;
    if (best.score >= 1 && positives === 1) return best.c;
    return null;
  }

  // Layer visibility persistence.
  useEffect(() => {
    try {
      const v = localStorage.getItem(LAYER_KEY);
      if (v !== null) setLayerVisible(v === "1");
    } catch {
      /* ignore */
    }
  }, []);
  function setLayer(v: boolean) {
    setLayerVisible(v);
    try {
      localStorage.setItem(LAYER_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function addNote() {
    const n = items.length;
    const x = Math.max(20, Math.round(window.innerWidth / 2 - 110 + (n % 4) * 18));
    const y = Math.max(20, Math.round(window.innerHeight / 2 - 100 + (n % 4) * 18));
    add({ id: newId(), text: "", x, y });
    setLayer(true);
  }

  // Drag handlers (attached once).
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      updateRef.current(d.id, { x: Math.max(0, e.clientX - d.offX), y: Math.max(0, e.clientY - d.offY) });
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

  // Hotkeys: Shift+N = new note, Shift+N+N (double) = toggle the layer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || (e.key !== "N" && e.key !== "n")) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      e.preventDefault();
      if (tapRef.current) {
        clearTimeout(tapRef.current);
        tapRef.current = null;
        setLayer(!layerVisibleRef.current); // double press → toggle layer
      } else {
        tapRef.current = setTimeout(() => {
          tapRef.current = null;
          addNote(); // single press → new note
        }, 320);
      }
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

  const hiddenCount = !layerVisible ? items.length : 0;

  return (
    <>
      <button
        className="note-fab"
        onClick={addNote}
        aria-label="New note (Shift+N)"
        title="New note — Shift+N. Toggle layer — Shift+N N."
      >
        ✎
        {hiddenCount > 0 && <span className="note-fab-badge">{hiddenCount}</span>}
      </button>

      {ready &&
        layerVisible &&
        items.map((note) => {
          const color = getCaseColor(note.caseId);
          const filed = cases.find((c) => c.id === note.caseId);
          const suggestion =
            !note.caseId && !note.noSuggest && note.text.trim().length > 3
              ? suggestCase(note.text)
              : null;
          return (
            <div
              key={note.id}
              className="sticky-note"
              style={{ left: note.x, top: note.y, borderLeft: `4px solid ${note.caseId ? color : NEUTRAL}` }}
            >
              <div
                className="sticky-note-head"
                onPointerDown={(e) => {
                  dragRef.current = { id: note.id, offX: e.clientX - note.x, offY: e.clientY - note.y };
                }}
              >
                {filed ? (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
                    <span className="text-[10.5px] text-[var(--muted)] truncate">{filed.name}</span>
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-[var(--faint)]">Note</span>
                )}
                <button
                  className="ml-auto text-[var(--faint)] hover:text-[var(--fg)]"
                  onClick={() => setMenuFor((v) => (v === note.id ? null : note.id))}
                  title="File under a case"
                  aria-label="File under a case"
                >
                  🗂
                </button>
                <button
                  className="text-[var(--faint)] hover:text-[var(--rose)]"
                  onClick={() => remove(note.id)}
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>

              {/* Manual case assignment dropdown */}
              {menuFor === note.id && (
                <div className="sticky-note-menu">
                  {note.caseId && (
                    <button
                      className="sticky-note-menu-item"
                      onClick={() => {
                        update(note.id, { caseId: undefined });
                        setMenuFor(null);
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: NEUTRAL }} />
                      Unfiled
                    </button>
                  )}
                  {cases
                    .filter((c) => c.stage !== "Closed")
                    .map((c) => (
                      <button
                        key={c.id}
                        className="sticky-note-menu-item"
                        onClick={() => {
                          update(note.id, { caseId: c.id, noSuggest: true });
                          setMenuFor(null);
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: getCaseColor(c.id) }} />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Suggestion banner */}
              {suggestion && (
                <div className="sticky-note-suggest">
                  <span className="truncate">Sounds like {suggestion.name} — file here?</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      className="sn-yes"
                      onClick={() => update(note.id, { caseId: suggestion.id, noSuggest: true })}
                    >
                      Yes
                    </button>
                    <button className="sn-no" onClick={() => update(note.id, { noSuggest: true })}>
                      No
                    </button>
                  </span>
                </div>
              )}

              <textarea
                className="sticky-note-body"
                placeholder="Jot something down…"
                value={note.text}
                onChange={(e) => update(note.id, { text: e.target.value })}
              />
            </div>
          );
        })}
    </>
  );
}
