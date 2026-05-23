"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCollection, readCollection, caseKey } from "@/lib/store/local";
import { callClaudeMessages, type ChatMsg } from "@/lib/claude";
import { fmtDate } from "@/lib/format";
import type {
  Case,
  Contact,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
} from "@/lib/types";

const SYSTEM = `You are a senior litigation associate helping Finn O'Connell, a first-year associate attorney at Wilson Elser, organize his thinking on active cases. Your job is not to make legal decisions — it is to help him structure his thoughts clearly enough to present to a supervising partner.

Always:
- Cite which specific case document or fact you draw from
- Use clear section headers
- Keep language professional and direct
- Never invent facts not in the case context
- End every response with: Next suggested action and who to loop in

Never:
- Use em-dashes
- Use words: crucial, pivotal, ensure`;

const STORE_KEY = "finn:sb:conversation";

function buildContext(id: string, c: Case | undefined): string {
  const deadlines = readCollection<Deadline>(caseKey(id, "deadlines"));
  const discovery = readCollection<DiscoveryItem>(caseKey(id, "discovery"));
  const correspondence = readCollection<Correspondence>(caseKey(id, "correspondence"));
  const contacts = readCollection<Contact>(caseKey(id, "contacts"));
  const docket = readCollection<DocketEntry>(caseKey(id, "docket"));

  const lines: string[] = ["=== CASE CONTEXT (from the case file) ==="];
  if (c) {
    lines.push(`Caption: ${c.name}`);
    lines.push(`Index: ${c.index} | Court: ${c.court}, ${c.county} | Justice: ${c.justice}`);
    lines.push(`Stage: ${c.stage} | We represent: ${c.weRepresent}`);
    lines.push(`Supervising partner: ${c.supervisingPartner} | My role: ${c.role}`);
    lines.push(`Summary: ${c.summary}`);
    if (c.notes?.length) lines.push(`Notes: ${c.notes.join("; ")}`);
  }
  lines.push("\n--- Deadlines ---");
  deadlines.forEach((d) =>
    lines.push(`- ${fmtDate(d.date)} | ${d.description} | ${d.type} | ${d.status}${d.hard ? " | HARD" : ""}`),
  );
  lines.push("\n--- Discovery ---");
  discovery.forEach((d) =>
    lines.push(`- ${d.name} | ${d.type} | ${d.direction} | ${d.status}${d.notes ? ` | ${d.notes}` : ""}`),
  );
  lines.push("\n--- Correspondence ---");
  correspondence.forEach((x) =>
    lines.push(`- ${fmtDate(x.date)} | ${x.type} | ${x.from} -> ${x.to} | ${x.summary}`),
  );
  lines.push("\n--- Contacts ---");
  contacts.forEach((p) =>
    lines.push(`- ${p.partyName} (${p.role}) | ${p.firm} | ${p.attorney} | ${p.email} ${p.phone}`),
  );
  lines.push("\n--- Docket ---");
  docket.forEach((d) => lines.push(`- ${d.filingNumber} | ${fmtDate(d.date)} | ${d.name} | ${d.party} | ${d.notes}`));
  return lines.join("\n");
}

export default function FloatingSoundingBoard() {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);
  const urlCaseId = segs[0] === "cases" && segs.length >= 2 ? segs[1] : null;

  const { items: cases } = useCollection<Case>("cases");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCaseId = urlCaseId ?? (selectedId || null);
  const activeCase = cases.find((c) => c.id === activeCaseId);

  // Load conversation for the browser session.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Allow other components to open the panel.
  useEffect(() => {
    const openSb = () => setOpen(true);
    window.addEventListener("finn:open-sb", openSb);
    return () => window.removeEventListener("finn:open-sb", openSb);
  }, []);

  // Auto-scroll to newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  function grow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px"; // ~4 lines
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError("");
    const history: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    requestAnimationFrame(grow);
    setLoading(true);
    try {
      // Inject current case context into the system prompt for every message.
      const system = activeCase
        ? `${SYSTEM}\n\n${buildContext(activeCase.id, activeCase)}`
        : `${SYSTEM}\n\n(No case selected. If the question needs case facts, tell Finn to select a case for context.)`;
      const reply = await callClaudeMessages(system, history);
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setError("");
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        className={`sb-fab${activeCaseId ? " glow" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Sounding Board"
        title="Sounding Board"
      >
        §
      </button>

      <div
        className={`sb-overlay${open ? " open" : ""}`}
        style={{ pointerEvents: open ? "auto" : "none" }}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside className={`sb-panel${open ? " open" : ""}`} role="dialog" aria-label="Sounding Board">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b hairline">
          <div className="font-semibold text-[15px]">Sounding Board</div>
          <div className="ml-auto text-[11px] text-[var(--faint)] truncate max-w-[170px] text-right">
            {activeCase ? `Case: ${activeCase.name}` : "No case selected"}
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Case selector — only when not inside a case page */}
        {!urlCaseId && (
          <div className="px-4 py-3 border-b hairline">
            <select
              className="input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select a case for context…</option>
              {cases
                .filter((c) => c.stage !== "Closed")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Conversation */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] uppercase tracking-wide text-[var(--faint)]">Conversation</span>
          {messages.length > 0 && (
            <button className="text-[11px] text-[var(--blue)] hover:underline" onClick={newConversation}>
              New conversation
            </button>
          )}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.length === 0 && !loading && (
            <p className="text-[12.5px] text-[var(--faint)] mt-2">
              Think out loud about {activeCase ? "this case" : "a case"}. Get back something
              structured enough to show a partner.
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="self-end max-w-[85%] card-2 px-3 py-2 text-[13px]">
                {m.content}
              </div>
            ) : (
              <div key={i} className="self-start max-w-[92%] text-[13px] leading-relaxed">
                {m.content.split("\n").map((line, j) =>
                  /^from:/i.test(line.trim()) ? (
                    <div key={j} className="text-[11px] text-[var(--faint)]">
                      {line}
                    </div>
                  ) : (
                    <div key={j} className="whitespace-pre-wrap">
                      {line || " "}
                    </div>
                  ),
                )}
              </div>
            ),
          )}
          {loading && <div className="self-start text-[12.5px] text-[var(--muted)]">Structuring…</div>}
          {error && <div className="self-start text-[12.5px] text-[var(--rose)]">{error}</div>}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t hairline">
          <div className="flex items-end gap-2">
            <textarea
              ref={taRef}
              className="input"
              rows={1}
              style={{ resize: "none", maxHeight: 96 }}
              placeholder="What's on your mind?"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                grow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="btn btn-accent" onClick={send} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
          <div className="text-[10.5px] text-[var(--faint)] mt-1.5">
            Responses grounded in case file only.
          </div>
        </div>
      </aside>
    </>
  );
}
