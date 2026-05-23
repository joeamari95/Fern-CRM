"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCollection, readCollection, caseKey } from "@/lib/store/local";
import { callClaudeMessages } from "@/lib/claude";
import MicButton from "@/components/MicButton";
import { legalSearch, OpenAIError } from "@/lib/openai";
import { fmtDate, daysFromToday, relativeDue } from "@/lib/format";
import type {
  Case,
  Contact,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
} from "@/lib/types";

const SYSTEM = `You are Finn O'Connell's case intelligence assistant at Wilson Elser. Finn is a first-year associate in property defense / premises liability.

You have full access to all his case data. Your job:
1. Help him find specific information fast
2. Help him organize his thinking for partners
3. Draft correspondence in attorney voice when asked
4. Flag things he might be missing
5. Brief him before meetings or court appearances

You are NOT:
- A legal strategist
- A decision maker
- A replacement for partner judgment

Rules:
- Always cite which case and which document you draw from
- Use section headers in longer responses
- Never use em-dashes
- Never use: crucial, pivotal, ensure, leverage, utilize, streamline, touch base, circle back
- Attorney voice always — direct, confident, brief
- If asked to draft: output clean copy ready to send
- End every response with one specific next action

When answering retrieval questions:
- Be precise and direct — quote the exact data
- Cite the source: 'From Palsgraf correspondence, May 21 entry:'
- If data not found: say so clearly, don't guess`;

const DRAFT_DIRECTIVE = `Finn is asking for a draft. Output ONLY a clean, ready-to-send draft in attorney voice. Apply these rules without exception: no em-dashes (restructure instead); no AI language (crucial, pivotal, ensure, leverage, utilize, streamline, robust, comprehensive, touch base, circle back); short sentences, active voice; proper salutation (Dear Mr./Ms. [Last Name]) and a close that fits the recipient. After the draft, add one line beginning "Next suggested action:".`;

const BRIEF_PROMPT = `Brief me. Use exactly these sections, each grounded in the case data:
Status (one line)
Top 3 open items right now
Next hard deadline
What my supervising partner is likely to ask
What I need to have ready
If a section has no data on file, say "None on file." Do not invent anything.`;

const DRAFT_RE = /\b(write|draft|send|email|letter|respond)\b/i;
const STORE_KEY = "finn:sb:conversation";

type UiMsg = { role: "user" | "assistant"; content: string; draft?: boolean };
type CaseData = {
  deadlines: Deadline[];
  discovery: DiscoveryItem[];
  correspondence: Correspondence[];
  contacts: Contact[];
  docket: DocketEntry[];
};

function readCaseData(id: string): CaseData {
  return {
    deadlines: readCollection<Deadline>(caseKey(id, "deadlines")),
    discovery: readCollection<DiscoveryItem>(caseKey(id, "discovery")),
    correspondence: readCollection<Correspondence>(caseKey(id, "correspondence")),
    contacts: readCollection<Contact>(caseKey(id, "contacts")),
    docket: readCollection<DocketEntry>(caseKey(id, "docket")),
  };
}

function nextHard(deadlines: Deadline[]): Deadline | null {
  const list = deadlines
    .filter((d) => d.hard && d.status !== "done" && !isNaN(daysFromToday(d.date)))
    .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));
  return list[0] ?? null;
}

function caseFull(c: Case): string {
  const d = readCaseData(c.id);
  const L: string[] = [];
  L.push(`### CASE: ${c.name}`);
  L.push(`Index: ${c.index} | ${c.court}, ${c.county} | ${c.justice}`);
  L.push(`Stage: ${c.stage} | We represent: ${c.weRepresent} | Opposing: ${c.opposingCounsel}`);
  L.push(`Supervising partner: ${c.supervisingPartner} | Finn's role: ${c.role}`);
  L.push(`Summary: ${c.summary}`);
  if (c.notes?.length) L.push(`Notes: ${c.notes.join("; ")}`);
  L.push("Deadlines:");
  d.deadlines.forEach((x) =>
    L.push(`  - ${fmtDate(x.date)} | ${x.description} | ${x.type} | ${x.status}${x.hard ? " | HARD" : ""} | assigned by ${x.assignedBy}`),
  );
  L.push("Discovery:");
  d.discovery.forEach((x) =>
    L.push(`  - ${x.name} | ${x.type} | ${x.direction} | ${x.status}${x.notes ? ` | ${x.notes}` : ""}`),
  );
  L.push("Correspondence:");
  d.correspondence.forEach((x) =>
    L.push(`  - ${fmtDate(x.date)} | ${x.type} | ${x.from} -> ${x.to} | ${x.summary}`),
  );
  L.push("Contacts:");
  d.contacts.forEach((x) =>
    L.push(`  - ${x.partyName} (${x.role}) | ${x.firm} | ${x.attorney} | ${x.email} ${x.phone}`),
  );
  L.push("Docket:");
  d.docket.forEach((x) => L.push(`  - ${x.filingNumber} | ${fmtDate(x.date)} | ${x.name} | ${x.party} | ${x.notes}`));
  return L.join("\n");
}

function caseSummary(c: Case): string {
  const nd = nextHard(readCaseData(c.id).deadlines);
  return `- ${c.name} | ${c.stage} | partner ${c.supervisingPartner} | next hard deadline: ${nd ? `${fmtDate(nd.date)} (${relativeDue(nd.date)}) — ${nd.description}` : "none"}`;
}

function buildContext(active: Case | undefined, all: Case[]): string {
  if (active) {
    const others = all.filter((c) => c.id !== active.id);
    return (
      "=== ACTIVE CASE (full detail — prioritize this) ===\n" +
      caseFull(active) +
      (others.length
        ? "\n\n=== OTHER MATTERS (summary only) ===\n" + others.map(caseSummary).join("\n")
        : "")
    );
  }
  if (all.length === 0) return "(No cases on file.)";
  return (
    "=== ALL MATTERS (full detail — answer cross-case questions using this) ===\n" +
    all.map(caseFull).join("\n\n")
  );
}

function computeFlag(active: Case | undefined, all: Case[]): string | null {
  const urgent = (c: Case) => {
    const ds = readCaseData(c.id).deadlines.filter((d) => d.status !== "done");
    const overdue = ds
      .filter((d) => {
        const n = daysFromToday(d.date);
        return d.status === "overdue" || (!isNaN(n) && n < 0);
      })
      .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));
    if (overdue.length) return { c, kind: "overdue" as const, d: overdue[0] };
    const soon = ds
      .filter((d) => {
        const n = daysFromToday(d.date);
        return !isNaN(n) && n >= 0 && n <= 2;
      })
      .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));
    if (soon.length) return { c, kind: "soon" as const, d: soon[0] };
    return null;
  };

  const phrase = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);

  if (active) {
    const f = urgent(active);
    if (!f) return null;
    return f.kind === "overdue"
      ? `⚠ ${f.d.description} is overdue on this matter`
      : `⚠ ${f.d.description} due ${phrase(daysFromToday(f.d.date))} on this matter`;
  }
  let best: ReturnType<typeof urgent> = null;
  for (const c of all) {
    const f = urgent(c);
    if (!f) continue;
    if (
      !best ||
      (f.kind === "overdue" && best.kind !== "overdue") ||
      daysFromToday(f.d.date) < daysFromToday(best.d.date)
    )
      best = f;
  }
  if (!best) return null;
  return best.kind === "overdue"
    ? `⚠ ${best.c.name}: ${best.d.description} is overdue`
    : `⚠ ${best.c.name}: ${best.d.description} due ${phrase(daysFromToday(best.d.date))}`;
}

export default function FloatingSoundingBoard() {
  const pathname = usePathname();
  const router = useRouter();
  const segs = pathname.split("/").filter(Boolean);
  const urlCaseId = segs[0] === "cases" && segs.length >= 2 ? segs[1] : null;

  const { items: cases } = useCollection<Case>("cases");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flag, setFlag] = useState<string | null>(null);
  const [flagDismissed, setFlagDismissed] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Quick Research tab state
  const [tab, setTab] = useState<"board" | "research">("board");
  const [rQuery, setRQuery] = useState("");
  const [rResult, setRResult] = useState("");
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState("");

  async function runSearch() {
    const q = rQuery.trim();
    if (!q || rLoading) return;
    setRLoading(true);
    setRError("");
    setRResult("");
    try {
      setRResult(await legalSearch(q));
    } catch (e) {
      setRError(e instanceof OpenAIError ? e.message : "Could not complete request. Please try again.");
    } finally {
      setRLoading(false);
    }
  }

  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCaseId = urlCaseId ?? (selectedId || null);
  const activeCase = cases.find((c) => c.id === activeCaseId);
  const hasContext = Boolean(activeCaseId) || cases.length > 0;

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

  useEffect(() => {
    const openSb = () => setOpen(true);
    window.addEventListener("finn:open-sb", openSb);
    return () => window.removeEventListener("finn:open-sb", openSb);
  }, []);

  // Recompute the proactive flag whenever the panel opens or the case changes.
  useEffect(() => {
    if (!open) return;
    setFlag(computeFlag(activeCase, cases));
    setFlagDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeCaseId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  // Focus the input once the panel has slid in.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => taRef.current?.focus(), 360);
    return () => clearTimeout(t);
  }, [open]);

  function grow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
  }

  async function send(text: string, opts?: { draft?: boolean }) {
    const body = text.trim();
    if (!body || loading) return;
    setError("");
    const draft = opts?.draft ?? DRAFT_RE.test(body);
    const history: UiMsg[] = [...messages, { role: "user", content: body }];
    setMessages(history);
    setInput("");
    requestAnimationFrame(grow);
    setLoading(true);
    try {
      let system = `${SYSTEM}\n\n${buildContext(activeCase, cases)}`;
      if (draft) system += `\n\n${DRAFT_DIRECTIVE}`;
      const reply = await callClaudeMessages(
        system,
        history.map((m) => ({ role: m.role, content: m.content })),
      );
      setMessages([...history, { role: "assistant", content: reply, draft }]);
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

  async function copy(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function refineFurther(text: string) {
    try {
      sessionStorage.setItem("finn:emaildraft", text);
    } catch {
      /* ignore */
    }
    setOpen(false);
    router.push("/email-review");
  }

  return (
    <>
      <button
        className={`sb-fab${activeCaseId ? " glow" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Case Brain"
        title="Case Brain"
      >
        §
      </button>

      <div
        className={`sb-overlay${open ? " open" : ""}`}
        style={{ pointerEvents: open ? "auto" : "none" }}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside className={`sb-panel${open ? " open" : ""}`} role="dialog" aria-label="Case Brain">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b hairline">
          <div className="font-semibold text-[15px]">Case Brain</div>
          <div className="ml-auto text-[11px] text-[var(--faint)] truncate max-w-[160px] text-right">
            {activeCase ? `Case: ${activeCase.name}` : cases.length ? "All matters" : "No cases"}
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="sb-tabs">
          <button className={`sb-tab${tab === "board" ? " active" : ""}`} onClick={() => setTab("board")}>
            Sounding Board
          </button>
          <button className={`sb-tab${tab === "research" ? " active" : ""}`} onClick={() => setTab("research")}>
            Quick Research
          </button>
        </div>

        {tab === "board" && (
          <>
        {/* Case selector — only when not inside a case page */}
        {!urlCaseId && (
          <div className="px-4 py-3 border-b hairline">
            <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">All cases (cross-case mode)</option>
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

        {/* Conversation header */}
        <div className="flex items-center justify-between px-4 pt-3 gap-2">
          <button
            className="btn"
            onClick={() => send(BRIEF_PROMPT)}
            disabled={loading || !hasContext}
            title="Instant brief grounded in case data"
          >
            ⚡ Brief Me
          </button>
          {messages.length > 0 && (
            <button className="text-[11px] text-[var(--blue)] hover:underline" onClick={newConversation}>
              New conversation
            </button>
          )}
        </div>

        {/* Conversation area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {flag && !flagDismissed && (
            <div className="sb-flag">
              <span className="min-w-0 truncate">{flag}</span>
              <button className="shrink-0 text-[var(--faint)] hover:text-[var(--fg)]" onClick={() => setFlagDismissed(true)} aria-label="Dismiss">
                ✕
              </button>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
              <div className="font-medium text-[var(--fg)]">Sounding Board — your cases.</div>
              <div className="text-[var(--faint)] mt-0.5">
                Think out loud or pull a fact. It only uses your case file and cites where it found
                things.
              </div>
              <ul className="list-disc pl-4 mt-2 flex flex-col gap-1">
                <li>Find a fact: “What did the client say about the logs?”</li>
                <li>Get a brief: hit ⚡ Brief Me before a partner check-in.</li>
                <li>Draft: say “draft a reply to opposing counsel” and it writes one in attorney voice.</li>
              </ul>
              <div className="text-[var(--faint)] mt-2">
                Need the law, not your matter?{" "}
                <button className="text-[var(--blue)] hover:underline" onClick={() => setTab("research")}>
                  Switch to Quick Research
                </button>
                .
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="self-end max-w-[85%] card-2 px-3 py-2 text-[13px]">
                {m.content}
              </div>
            ) : (
              <div key={i} className="self-start max-w-[94%] w-full">
                {m.draft && (
                  <div className="text-[10.5px] uppercase tracking-wide text-[var(--teal)] mb-1">Draft</div>
                )}
                <div className={`text-[13px] leading-relaxed ${m.draft ? "card-2 p-3" : ""}`}>
                  {m.content.split("\n").map((line, j) =>
                    /^from:/i.test(line.trim()) ? (
                      <div key={j} className="text-[11px] text-[var(--faint)]">{line}</div>
                    ) : (
                      <div key={j} className="whitespace-pre-wrap">{line || " "}</div>
                    ),
                  )}
                </div>
                {m.draft && (
                  <div className="flex items-center gap-2 mt-2">
                    <button className="btn" onClick={() => copy(m.content, i)}>
                      {copiedIdx === i ? "Copied ✓" : "Copy"}
                    </button>
                    <button className="btn" onClick={() => refineFurther(m.content)}>
                      Refine further →
                    </button>
                  </div>
                )}
              </div>
            ),
          )}
          {loading && <div className="self-start text-[12.5px] text-[var(--muted)]">Thinking…</div>}
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
                  send(input);
                }
              }}
            />
            <MicButton onText={(t) => setInput((p) => (p ? `${p} ${t}` : t))} title="Dictate your question" />
            <button className="btn btn-accent" onClick={() => send(input)} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
          <div className="text-[10.5px] text-[var(--faint)] mt-1.5">
            Grounded in case data only. Cites sources. Not legal advice.
          </div>
        </div>
          </>
        )}

        {tab === "research" && (
          <>
            <div className="px-4 py-3 border-b hairline">
              <div className="flex items-end gap-2">
                <textarea
                  className="input"
                  rows={2}
                  style={{ resize: "none" }}
                  placeholder="e.g. Standard for constructive notice in NY premises liability slip and fall"
                  value={rQuery}
                  onChange={(e) => setRQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      runSearch();
                    }
                  }}
                />
                <button className="btn btn-accent" onClick={runSearch} disabled={rLoading || !rQuery.trim()}>
                  {rLoading ? "…" : "Search"}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!rResult && !rLoading && !rError && (
                <div className="text-[12.5px] text-[var(--muted)] leading-relaxed">
                  <div className="font-medium text-[var(--fg)]">Quick Research — the law.</div>
                  <div className="text-[var(--faint)] mt-0.5">
                    Plain-English legal questions answered from the public web (case law, statutes).
                    It does not see your case files.
                  </div>
                  <ul className="list-disc pl-4 mt-2 flex flex-col gap-1">
                    <li>“Constructive notice standard for NY slip and fall.”</li>
                    <li>“Can a NY owner delegate snow removal to a contractor?”</li>
                  </ul>
                  <div className="text-[var(--faint)] mt-2">
                    Always verify cites in Westlaw or Lexis. For your matter,{" "}
                    <button className="text-[var(--blue)] hover:underline" onClick={() => setTab("board")}>
                      use Sounding Board
                    </button>
                    .
                  </div>
                </div>
              )}
              {rLoading && <p className="text-[13px] text-[var(--muted)]">Searching public legal sources…</p>}
              {rError && <p className="text-[13px] text-[var(--rose)]">{rError}</p>}
              {rResult && (
                <div className="text-[13px] leading-relaxed">
                  {rResult.split("\n").map((line, j) => {
                    const isHeader = /^(ANSWER|RELEVANT CASES|NEXT STEP):/i.test(line.trim());
                    return isHeader ? (
                      <div key={j} className="text-[11px] uppercase tracking-wide text-[var(--blue)] mt-3 first:mt-0">
                        {line}
                      </div>
                    ) : (
                      <div key={j} className="whitespace-pre-wrap text-[var(--muted)]">{line || " "}</div>
                    );
                  })}
                  <div className="text-[10.5px] text-[var(--faint)] mt-4 pt-3 border-t hairline">
                    Verify all citations in Westlaw or LexisNexis before relying on them in any filing
                    or advice.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
