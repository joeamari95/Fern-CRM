"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { callClaude } from "@/lib/claude";

const SYSTEM = `You are a senior litigation associate at Wilson Elser, a top-tier NY defense firm. Refine this email draft so it reads as written by a confident, experienced attorney.

STRICT RULES — apply every time without exception:
- Remove all em-dashes. Restructure the sentence instead.
- Remove these words entirely if present: crucial, pivotal, streamline, utilize, leverage, ensure, prompt, robust, comprehensive, it is important to note, please be advised, I wanted to, I hope this finds you well, please do not hesitate, touch base, circle back, going forward
- No bullet points in the email body — prose only
- Short sentences — 20 words max preferred
- Active voice throughout
- Formal but direct — 'Please provide' not 'Could you provide'
- Write out dates fully: May 28, 2026
- Proper salutation: Dear Mr./Ms. [Last Name]
- Proper close based on email type:
  Opposing counsel: Very truly yours,
  Client: Best regards,
  Partner: Thanks, [or appropriate informal close]
  Court: Respectfully,
- Never sound apologetic or eager
- Never start consecutive sentences with 'I'
- First line must get directly to the point — no warmup

Tone guidance:
- Firm: direct, no pleasantries, business only
- Neutral: professional, standard correspondence
- Collegial: warm but still professional, first name ok

Output format:
1. The refined email only — no commentary before it
2. Then a section titled 'What changed:' with specific bullet points of every edit made`;

const EMAIL_TYPES = ["Opposing Counsel", "Client", "Partner", "Court"];
const TONES = ["Firm", "Neutral", "Collegial"];

// Split the model output into the refined email and the "What changed" section.
function splitOutput(text: string): { email: string; changes: string } {
  const m = text.match(/what changed:?/i);
  if (!m || m.index === undefined) return { email: text.trim(), changes: "" };
  return {
    email: text.slice(0, m.index).trim(),
    changes: text.slice(m.index + m[0].length).trim(),
  };
}

export default function EmailReviewPage() {
  const [draft, setDraft] = useState("");
  const [emailType, setEmailType] = useState(EMAIL_TYPES[0]);
  const [tone, setTone] = useState(TONES[1]);
  const [context, setContext] = useState("");
  const [result, setResult] = useState<{ email: string; changes: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (!draft.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const user = `Email type: ${emailType}\nTone: ${tone}${context.trim() ? `\nContext: ${context.trim()}` : ""}\n\nDRAFT:\n${draft.trim()}`;
      const text = await callClaude(SYSTEM, user);
      setResult(splitOutput(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyRefined() {
    if (!result?.email) return;
    await navigator.clipboard.writeText(result.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">Email Review</h1>
      <p className="text-[13px] text-[var(--muted)] mt-1 mb-5">
        Paste your draft. Get back what a senior associate would actually send.
      </p>

      <Card>
        <label className="field-label">Paste your draft email</label>
        <textarea
          className="input mt-2"
          rows={8}
          placeholder="Paste your draft here…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <label className="flex flex-col gap-1">
            <span className="field-label">Email type</span>
            <select className="input" value={emailType} onChange={(e) => setEmailType(e.target.value)}>
              {EMAIL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Tone</span>
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Context (one line)</span>
            <input className="input" placeholder="Optional" value={context} onChange={(e) => setContext(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button className="btn btn-accent" onClick={submit} disabled={loading || !draft.trim()}>
            {loading ? "Refining…" : "Review & Refine"}
          </button>
        </div>
      </Card>

      {error && (
        <Card className="mt-5">
          <p className="text-[13px] text-[var(--rose)]">{error}</p>
        </Card>
      )}

      {(loading || result) && (
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <Card>
            <div className="text-[12px] uppercase tracking-wide text-[var(--faint)] mb-2">Your Draft</div>
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--muted)]">{draft}</div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] uppercase tracking-wide text-[var(--teal)]">Refined Version</div>
              {result?.email && (
                <button className="btn" onClick={copyRefined}>{copied ? "Copied ✓" : "Copy"}</button>
              )}
            </div>
            {loading ? (
              <p className="text-[13px] text-[var(--muted)]">Refining your draft…</p>
            ) : (
              <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-[var(--fg)]">{result?.email}</div>
            )}
          </Card>
        </div>
      )}

      {result?.changes && !loading && (
        <Card className="mt-5">
          <div className="text-[12px] uppercase tracking-wide text-[var(--amber)] mb-2">What changed</div>
          <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-[var(--muted)]">{result.changes}</div>
        </Card>
      )}
    </>
  );
}
