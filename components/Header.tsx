"use client";

import { useLocalObject } from "@/lib/store/local";
import type { CaseProfile } from "@/lib/types";
import { TODAY } from "@/lib/format";

export default function Header({ title, greeting }: { title: string; greeting?: boolean }) {
  const { value: c, ready } = useLocalObject<CaseProfile>("case");
  const dateStr = TODAY.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-7">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[26px] font-semibold tracking-tight">
          {greeting ? "Welcome back." : title}
        </h1>
        <span className="text-[13px] text-[var(--muted)]">{dateStr}</span>
      </div>
      {ready && c ? (
        <div className="flex items-center gap-2 mt-3 flex-wrap text-[12px]">
          <span className="tag">{c.caption || "Untitled matter"}</span>
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
          {c.status && <span className="pill pill-blue">{c.status}</span>}
        </div>
      ) : ready ? (
        <div className="mt-3 text-[12px] text-[var(--faint)]">
          No matter set up yet — add your case details on the Case Overview page.
        </div>
      ) : null}
    </header>
  );
}
