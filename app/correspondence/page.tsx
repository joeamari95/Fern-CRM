import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Tag, Dot } from "@/components/ui";
import { correspondence } from "@/lib/data/correspondence";
import { fmtDate } from "@/lib/format";
import type { Accent } from "@/lib/types";

export default function CorrespondencePage() {
  const sorted = [...correspondence].sort((a, b) => (a.date < b.date ? 1 : -1));
  const needsReply = sorted.filter((c) => c.needsReply).length;

  return (
    <>
      <Header title="Correspondence" />
      <Card>
        <SectionHeader
          title="Communication Log"
          sub={`Emails, letters & calls between parties · ${needsReply} awaiting reply`}
        />
        <div className="flex flex-col">
          {sorted.map((c) => {
            const accent = (c.accent ?? "teal") as Accent;
            return (
              <div
                key={c.id}
                className={`accent-bar bar-${accent} pl-4 py-3.5 border-b hairline last:border-0`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1.5"><Dot accent={accent} /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium">{c.subject}</span>
                        <Tag>{c.channel}</Tag>
                        {c.needsReply && <Pill accent="rose">Needs Reply</Pill>}
                      </div>
                      <div className="text-[12px] text-[var(--faint)] mt-0.5">
                        {c.from} → {c.to}
                      </div>
                      <p className="text-[12.5px] text-[var(--muted)] mt-1.5 leading-snug">
                        {c.summary}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[var(--faint)] shrink-0">{fmtDate(c.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--faint)] mt-4">
          Summaries are entered manually in v1. Future: auto-summarized from ingested email.
        </p>
      </Card>
    </>
  );
}
