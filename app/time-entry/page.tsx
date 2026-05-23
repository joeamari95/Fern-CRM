"use client";

import { useState } from "react";
import { Card, SectionHeader } from "@/components/ui";
import MicButton from "@/components/MicButton";
import { generateNarrative, OpenAIError } from "@/lib/openai";

export default function TimeEntryPage() {
  const [description, setDescription] = useState("");
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError("");
    setNarrative("");
    try {
      setNarrative(await generateNarrative(description.trim()));
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : "Could not complete request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">Time Entry</h1>
      <p className="text-[13px] text-[var(--muted)] mt-1 mb-5">
        Dictate or type what you worked on. Generate a clean billing narrative.
      </p>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <label className="field-label">Description</label>
          <MicButton
            title="Dictate the description"
            onText={(t) => setDescription((p) => (p ? `${p} ${t}` : t))}
          />
        </div>
        <textarea
          className="input"
          rows={4}
          placeholder="e.g. reviewed plaintiff's document demand, drafted objections, called client re missing authorizations"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-3">
          <button className="btn btn-accent" onClick={generate} disabled={loading || !description.trim()}>
            {loading ? "Generating…" : "Generate Narrative"}
          </button>
          {error && <span className="text-[12.5px] text-[var(--rose)]">{error}</span>}
        </div>
      </Card>

      {narrative && (
        <Card className="mt-5">
          <SectionHeader
            title="Billing Narrative"
            right={<button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>}
          />
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </Card>
      )}
    </>
  );
}
