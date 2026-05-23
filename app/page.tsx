"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import { EmptyState } from "@/components/forms";
import SeedControls from "@/components/SeedControls";
import { useCollection, readCollection, caseKey } from "@/lib/store/local";
import { TODAY, fmtDate, relativeDue, ago, daysFromToday, dueAccent } from "@/lib/format";
import type { Accent, Case, Deadline, Review } from "@/lib/types";

type AggDeadline = Deadline & { caseId: string; caseName: string };

export default function AssociateDashboard() {
  const { items: cases, ready } = useCollection<Case>("cases");
  const reviews = useCollection<Review>("reviews");
  const [deadlines, setDeadlines] = useState<AggDeadline[]>([]);

  // Aggregate every case's deadlines (cross-case read from localStorage).
  useEffect(() => {
    if (!ready) return;
    const all: AggDeadline[] = [];
    for (const c of cases) {
      for (const d of readCollection<Deadline>(caseKey(c.id, "deadlines"))) {
        all.push({ ...d, caseId: c.id, caseName: c.name });
      }
    }
    setDeadlines(all);
  }, [ready, cases]);

  const dateStr = TODAY.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!ready) return <div className="h-10" />;

  if (cases.length === 0) {
    return (
      <>
        <h1 className="text-[26px] font-semibold tracking-tight">Good morning, Finn.</h1>
        <p className="text-[13px] text-[var(--muted)] mt-1">{dateStr}</p>
        <div className="mt-6">
          <EmptyState
            title="No cases yet"
            hint="This is real, private data stored in your browser. Load the sample cases to explore, or add your own from the Case List."
          />
          <SeedControls hasData={false} />
        </div>
      </>
    );
  }

  const active = cases.filter((c) => c.stage !== "Closed");
  const open = deadlines.filter((d) => d.status !== "done");
  const dueThisWeek = open.filter((d) => {
    const n = daysFromToday(d.date);
    return !isNaN(n) && n >= 0 && n <= 7;
  });
  const overdue = open.filter((d) => {
    const n = daysFromToday(d.date);
    return (!isNaN(n) && n < 0) || d.status === "overdue";
  });

  // Widget 1 — needs attention (overdue or within 7 days), urgency-sorted, max 8.
  const attention = [...open]
    .filter((d) => {
      const n = daysFromToday(d.date);
      return !isNaN(n) && n <= 7;
    })
    .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date))
    .slice(0, 8);

  // Widget 2 — hard deadlines this week only.
  const hardThisWeek = [...open]
    .filter((d) => d.hard)
    .filter((d) => {
      const n = daysFromToday(d.date);
      return !isNaN(n) && n <= 7;
    })
    .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));

  const caseById = (cid: string) => cases.find((c) => c.id === cid);

  function nextHardDeadline(caseId: string): AggDeadline | null {
    const list = deadlines
      .filter((d) => d.caseId === caseId && d.hard && d.status !== "done")
      .filter((d) => !isNaN(daysFromToday(d.date)))
      .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date));
    return list[0] ?? null;
  }

  function caseUrgency(caseId: string): Accent {
    const nd = nextHardDeadline(caseId);
    return nd ? dueAccent(nd.date) : "teal";
  }

  return (
    <>
      {/* Header bar */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[26px] font-semibold tracking-tight">Good morning, Finn.</h1>
        <span className="text-[13px] text-[var(--muted)]">{dateStr}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
        <Stat label="Active Cases" value={active.length} accent="blue" />
        <Stat label="Due This Week" value={dueThisWeek.length} accent="amber" />
        <Stat label="Overdue" value={overdue.length} accent="rose" />
        <Stat label="Awaiting Partner Review" value={reviews.items.length} accent="peach" />
      </div>

      {/* Widget 1 — Needs My Attention Today */}
      <Card className="mb-5">
        <SectionHeader
          title="Needs My Attention Today"
          sub="Overdue or due within 7 days, across all cases"
        />
        {attention.length === 0 ? (
          <p className="text-[13px] text-[var(--faint)] py-3">Nothing urgent in the next 7 days.</p>
        ) : (
          <div className="flex flex-col">
            {attention.map((d) => {
              const accent = dueAccent(d.date);
              return (
                <Link
                  key={d.id}
                  href={`/cases/${d.caseId}/deadlines`}
                  className={`accent-bar bar-${accent === "peach" ? "amber" : accent} pl-4 py-3 border-b hairline last:border-0 hover:bg-[var(--surface-2)] rounded-md transition-colors flex items-start justify-between gap-3`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1.5">
                      <Dot accent={accent} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--muted)]">{d.caseName}</div>
                      <div className="text-[14px] font-medium">{d.description}</div>
                      <div className="text-[11.5px] text-[var(--faint)] mt-0.5">
                        Assigned by {d.assignedBy}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px]">{fmtDate(d.date)}</div>
                    <Pill accent={accent}>{relativeDue(d.date)}</Pill>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Widget 2 — Hard Deadlines This Week */}
        <Card>
          <SectionHeader title="Hard Deadlines This Week" sub="Court-ordered & CPLR deadlines only" />
          {hardThisWeek.length === 0 ? (
            <p className="text-[13px] text-[var(--faint)] py-3">No hard deadlines this week.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {hardThisWeek.map((d) => {
                const accent = dueAccent(d.date);
                return (
                  <Link
                    key={d.id}
                    href={`/cases/${d.caseId}/deadlines`}
                    className="card-2 p-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Dot accent={accent} />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium leading-snug">{d.description}</div>
                        <div className="text-[12px] text-[var(--faint)]">{d.caseName}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px]">{fmtDate(d.date)}</div>
                      <Pill accent={accent}>{relativeDue(d.date)}</Pill>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Widget 3 — Awaiting Partner Review */}
        <Card>
          <SectionHeader title="Awaiting Partner Review" sub="Submitted, pending feedback" />
          {reviews.items.length === 0 ? (
            <p className="text-[13px] text-[var(--faint)] py-3">Nothing awaiting review.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {reviews.items.map((r) => (
                <Link
                  key={r.id}
                  href={`/cases/${r.caseId}`}
                  className="card-2 p-3 hover:bg-[var(--surface-3)] transition-colors block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium leading-snug">{r.document}</div>
                      <div className="text-[12px] text-[var(--faint)]">
                        {caseById(r.caseId)?.name ?? r.caseId} · to {r.submittedTo}
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--faint)] shrink-0">
                      {ago(r.submittedDate)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Widget 4 — My Cases */}
      <Card className="mt-5">
        <SectionHeader title="My Cases" sub={`${cases.length} matters`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--faint)]">
                <th className="py-2 pr-2"></th>
                <th className="py-2 pr-3">Case</th>
                <th className="py-2 pr-3">Partner</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Next Hard Deadline</th>
                <th className="py-2 pr-3">Last Action</th>
                <th className="py-2 pr-3">My Role</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const nd = nextHardDeadline(c.id);
                const accent = caseUrgency(c.id);
                return (
                  <tr key={c.id} className="border-t hairline align-top">
                    <td className="py-2.5 pr-2">
                      <Dot accent={accent} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link href={`/cases/${c.id}`} className="font-medium hover:text-[var(--blue)]">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--muted)]">{c.supervisingPartner}</td>
                    <td className="py-2.5 pr-3">
                      <span className="tag">{c.stage}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--muted)]">
                      {nd ? (
                        <>
                          {fmtDate(nd.date)}{" "}
                          <span className="text-[var(--faint)]">· {relativeDue(nd.date)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--muted)]">{c.lastAction}</td>
                    <td className="py-2.5 pr-3 text-[var(--muted)]">{c.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <SeedControls hasData={true} />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: Accent }) {
  return (
    <div className="card-2 p-4">
      <div className="flex items-center gap-2">
        <Dot accent={accent} />
        <span className="text-[11px] uppercase tracking-wide text-[var(--faint)]">{label}</span>
      </div>
      <div className="text-[22px] font-semibold mt-1.5">{value}</div>
    </div>
  );
}
