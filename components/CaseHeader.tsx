"use client";

import { useCollection } from "@/lib/store/local";
import type { Case } from "@/lib/types";

export default function CaseHeader({ caseId, title }: { caseId: string; title: string }) {
  const { items, ready } = useCollection<Case>("cases");
  const c = items.find((x) => x.id === caseId);

  return (
    <header className="mb-7">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
      </div>
      {ready && c ? (
        <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px]">
          <span className="tag">{c.name}</span>
          {(c.court || c.county) && (
            <>
              <span className="text-[var(--faint)]">·</span>
              <span className="text-[var(--muted)]">
                {[c.court, c.county].filter(Boolean).join(", ")}
              </span>
            </>
          )}
          {c.index && (
            <>
              <span className="text-[var(--faint)]">·</span>
              <span className="tag">Index {c.index}</span>
            </>
          )}
          {c.stage && <span className="pill pill-blue">{c.stage}</span>}
        </div>
      ) : ready ? (
        <div className="mt-2 text-[12px] text-[var(--rose)]">Case not found.</div>
      ) : null}
    </header>
  );
}
