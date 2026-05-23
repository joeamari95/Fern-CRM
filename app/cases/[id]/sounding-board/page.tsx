"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card } from "@/components/ui";
import { useCollection, readCollection, caseKey } from "@/lib/store/local";
import { callClaude } from "@/lib/claude";
import { fmtDate } from "@/lib/format";
import type {
  Case,
  Contact,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
} from "@/lib/types";

const SYSTEM = `You are a senior litigation associate helping a first-year attorney at Wilson Elser organize his thinking on an active case. Your job is not to make legal decisions or provide strategy — it is to help him structure his thoughts clearly enough to present to a supervising partner.

Always:
- Cite which specific case document or fact you draw from
- Use clear section headers in your response
- Keep language professional and direct
- Never invent facts not present in the case context
- Never recommend a legal strategy — organize and structure only
- End every response with: Next suggested action and who to loop in

Never:
- Use em-dashes
- Use words like crucial, pivotal, ensure, leverage, utilize
- Give legal advice beyond what the case facts support`;

function buildContext(id: string, c: Case | undefined): string {
  const deadlines = readCollection<Deadline>(caseKey(id, "deadlines"));
  const discovery = readCollection<DiscoveryItem>(caseKey(id, "discovery"));
  const correspondence = readCollection<Correspondence>(caseKey(id, "correspondence"));
  const contacts = readCollection<Contact>(caseKey(id, "contacts"));
  const docket = readCollection<DocketEntry>(caseKey(id, "docket"));

  const lines: string[] = [];
  lines.push("=== CASE CONTEXT (from the case file) ===");
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

export default function SoundingBoardPage() {
  const { id } = useParams<{ id: string }>();
  const cases = useCollection<Case>("cases");
  const c = cases.items.find((x) => x.id === id);

  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const context = buildContext(id, c);
      const user = `${context}\n\n=== WHAT'S ON MY MIND ===\n${input.trim()}`;
      const text = await callClaude(SYSTEM, user);
      setResponse(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CaseHeader caseId={id} title={`Sounding Board${c ? ` — ${c.name}` : ""}`} />
      <p className="text-[13px] text-[var(--muted)] -mt-3 mb-5">
        Think out loud. Get back something structured enough to show a partner.
      </p>

      <Card>
        <label className="field-label">What&apos;s on your mind about this case?</label>
        <textarea
          className="input mt-2"
          rows={6}
          placeholder="Type your thoughts, questions, or where you feel stuck…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-3">
          <button className="btn btn-accent" onClick={submit} disabled={loading || !input.trim()}>
            {loading ? "Thinking…" : "Get Structured Response"}
          </button>
          <span className="text-[11px] text-[var(--faint)]">
            Organizes your thinking from the case file. Not legal advice.
          </span>
        </div>
      </Card>

      {error && (
        <Card className="mt-5">
          <p className="text-[13px] text-[var(--rose)]">{error}</p>
        </Card>
      )}

      {loading && (
        <Card className="mt-5">
          <p className="text-[13px] text-[var(--muted)]">Structuring your thoughts from the case file…</p>
        </Card>
      )}

      {response && !loading && (
        <Card className="mt-5">
          <div className="text-[12px] uppercase tracking-wide text-[var(--blue)] mb-2">
            Structured Response
          </div>
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {response}
          </div>
        </Card>
      )}
    </>
  );
}
