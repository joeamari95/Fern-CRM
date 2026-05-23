"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import CaseHeader from "@/components/CaseHeader";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import { useCollection, caseKey } from "@/lib/store/local";
import { fmtDay, relativeDue, daysFromToday, dueAccent } from "@/lib/format";
import type { Accent, Case, Correspondence, Deadline, DiscoveryItem, DocketEntry } from "@/lib/types";

export default function CaseDashboard() {
  const { id } = useParams<{ id: string }>();
  const cases = useCollection<Case>("cases");
  const c = cases.items.find((x) => x.id === id);

  const deadlines = useCollection<Deadline>(caseKey(id, "deadlines"));
  const discovery = useCollection<DiscoveryItem>(caseKey(id, "discovery"));
  const correspondence = useCollection<Correspondence>(caseKey(id, "correspondence"));
  const docket = useCollection<DocketEntry>(caseKey(id, "docket"));

  const open = deadlines.items.filter((d) => d.status !== "done");
  const upcoming = [...open]
    .sort((a, b) => {
      const da = daysFromToday(a.date), db = daysFromToday(b.date);
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    })
    .slice(0, 5);
  const overdueSoon = open.filter((d) => {
    const n = daysFromToday(d.date);
    return d.status === "overdue" || (!isNaN(n) && n <= 7);
  }).length;
  const openDiscovery = discovery.items.filter(
    (d) => d.status !== "complete" && d.status !== "received",
  );

  const activity = [
    ...docket.items.map((d) => ({ id: "dk-" + d.id, date: d.date, label: d.name, detail: [d.filingNumber, d.party].filter(Boolean).join(" · "), accent: "blue" as Accent, kind: "Docket" })),
    ...correspondence.items.map((x) => ({ id: "co-" + x.id, date: x.date, label: `${x.from} → ${x.to}`, detail: x.summary, accent: "teal" as Accent, kind: x.type })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <>
      <CaseHeader caseId={id} title="Dashboard" />

      {c && (
        <Card className="mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-[12px] text-[var(--faint)]">Supervising Partner</div>
              <div className="text-[14px] font-medium">{c.supervisingPartner || "—"}</div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--faint)]">My Role</div>
              <div className="text-[14px] font-medium">{c.role || "—"}</div>
            </div>
            <div className="min-w-0 max-w-[340px]">
              <div className="text-[12px] text-[var(--faint)]">Next Step</div>
              <div className="text-[14px] font-medium">{c.nextStep || "—"}</div>
            </div>
            <button
              className="btn btn-accent self-center"
              onClick={() => window.dispatchEvent(new Event("finn:open-sb"))}
            >
              § Sounding Board
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Open Deadlines" value={open.length} accent="blue" />
        <Stat label="Urgent (≤7d / overdue)" value={overdueSoon} accent="rose" />
        <Stat label="Open Discovery" value={openDiscovery.length} accent="amber" />
        <Stat label="Next Deadline" value={upcoming[0] ? relativeDue(upcoming[0].date) || fmtDay(upcoming[0].date) : "—"} accent="teal" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Open Discovery" sub="Items awaiting action" right={<Link href={`/cases/${id}/discovery`} className="text-[12px] text-[var(--blue)] hover:underline">View all →</Link>} />
            {openDiscovery.length === 0 ? (
              <p className="text-[13px] text-[var(--faint)] py-3">No open discovery items.</p>
            ) : (
              <div className="flex flex-col">
                {openDiscovery.slice(0, 6).map((d) => (
                  <Link key={d.id} href={`/cases/${id}/discovery`} className="py-2.5 border-b hairline last:border-0 flex items-center justify-between gap-3 hover:bg-[var(--surface-2)] rounded-md transition-colors">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">{d.name}</div>
                      <div className="text-[12px] text-[var(--faint)]">{d.type} · {d.direction}</div>
                    </div>
                    <Pill accent="amber">{d.status.replace("-", " ")}</Pill>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-5">
            <SectionHeader title="What's Happened" sub="Recent filings & correspondence" />
            {activity.length === 0 ? (
              <p className="text-[13px] text-[var(--faint)] py-3">No activity yet.</p>
            ) : (
              <div className="flex flex-col">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2.5 border-b hairline last:border-0">
                    <span className="mt-1.5"><Dot accent={a.accent} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-medium">{a.label}</span>
                        <span className="tag">{a.kind}</span>
                      </div>
                      {a.detail && <p className="text-[12.5px] text-[var(--muted)] leading-snug">{a.detail}</p>}
                    </div>
                    <span className="text-[11px] text-[var(--faint)] shrink-0">{fmtDay(a.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <SectionHeader title="Upcoming Deadlines" right={<Link href={`/cases/${id}/deadlines`} className="text-[12px] text-[var(--blue)] hover:underline">All →</Link>} />
            {upcoming.length === 0 ? (
              <p className="text-[13px] text-[var(--faint)] py-3">No upcoming deadlines.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((d) => {
                  const accent = dueAccent(d.date);
                  return (
                    <div key={d.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <Dot accent={accent} />
                        <div className="flex-1 w-px bg-[var(--border)] mt-1" />
                      </div>
                      <div className="pb-1">
                        <div className="text-[12px] text-[var(--muted)]">{fmtDay(d.date)}</div>
                        <div className="text-[13.5px] font-medium leading-snug">{d.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {d.hard && <span className="tag">Hard</span>}
                          {relativeDue(d.date) && <span className="text-[11px] text-[var(--faint)]">{relativeDue(d.date)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: Accent }) {
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
