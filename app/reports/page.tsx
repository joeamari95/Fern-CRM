import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Tag } from "@/components/ui";
import { reports } from "@/lib/data/reports";
import { fmtDate } from "@/lib/format";

export default function ReportsPage() {
  const sorted = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1));
  const current = sorted.find((r) => r.status === "current") ?? sorted[0];
  const history = sorted.filter((r) => r.id !== current.id);

  return (
    <>
      <Header title="Reports" />
      <p className="text-[13px] text-[var(--muted)] -mt-3 mb-5">
        Status reports to the client/carrier. The latest supersedes prior versions; new developments
        roll into the next supplemental report.
      </p>

      <Card className="mb-5">
        <SectionHeader
          title={current.label}
          sub={`Current · ${fmtDate(current.date)}`}
          right={<Pill accent="green">Current</Pill>}
        />
        <div className="flex flex-col gap-4">
          {current.sections.map((s) => (
            <div key={s.heading}>
              <div className="text-[12px] uppercase tracking-wide text-[var(--blue)] mb-1">
                {s.heading}
              </div>
              <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{s.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <div
        className="card-2 p-4 mb-5 flex items-center gap-2"
        style={{ borderColor: "rgba(251,191,36,0.3)" }}
      >
        <span className="dot dot-amber" />
        <span className="text-[12.5px] text-[var(--muted)]">
          New filings or correspondence will be summarized into the next supplemental report.
        </span>
        <span className="ml-auto"><Tag>Add update — soon</Tag></span>
      </div>

      <SectionHeader title="Report History" sub={`${history.length} prior report(s)`} />
      <div className="flex flex-col gap-3">
        {history.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <span className="text-[14px] font-medium">{r.label}</span>
                <span className="text-[12px] text-[var(--faint)] ml-2">{fmtDate(r.date)}</span>
              </div>
              <Pill accent="muted">Superseded</Pill>
            </div>
            <div className="flex flex-col gap-2">
              {r.sections.map((s) => (
                <p key={s.heading} className="text-[12.5px] text-[var(--muted)] leading-snug">
                  <span className="text-[var(--fg)] font-medium">{s.heading}: </span>
                  {s.body}
                </p>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
