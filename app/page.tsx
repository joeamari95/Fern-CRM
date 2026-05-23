import Link from "next/link";
import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import { tasks } from "@/lib/data/tasks";
import { deadlines } from "@/lib/data/deadlines";
import { docket } from "@/lib/data/docket";
import { correspondence } from "@/lib/data/correspondence";
import { discovery } from "@/lib/data/discovery";
import { fmtDay, relativeDue, daysFromToday } from "@/lib/format";
import type { Accent } from "@/lib/types";

const priorityAccent: Record<string, Accent> = {
  critical: "rose",
  high: "amber",
  normal: "blue",
};

export default function Dashboard() {
  const openTasks = tasks;
  const criticalCount = tasks.filter((t) => t.priority === "critical").length;

  const upcoming = deadlines
    .filter((d) => d.status !== "done")
    .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date))
    .slice(0, 5);

  const openDiscovery = discovery.filter(
    (d) => d.status !== "complete" && d.status !== "received",
  ).length;

  // Merge docket + correspondence into one reverse-chron activity feed.
  const activity = [
    ...docket.map((d) => ({
      id: d.id,
      date: d.date,
      label: `${d.type} filed`,
      detail: `${d.summary} — ${d.filedBy}`,
      accent: "blue" as Accent,
      kind: "Docket",
    })),
    ...correspondence.map((c) => ({
      id: c.id,
      date: c.date,
      label: c.subject,
      detail: `${c.from} → ${c.to}`,
      accent: (c.accent ?? "teal") as Accent,
      kind: c.channel,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  return (
    <>
      <Header title="Dashboard" greeting />

      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Open Tasks" value={String(openTasks.length)} accent="blue" />
        <Stat label="Critical" value={String(criticalCount)} accent="rose" />
        <Stat label="Open Discovery" value={String(openDiscovery)} accent="amber" />
        <Stat
          label="Next Deadline"
          value={upcoming[0] ? relativeDue(upcoming[0].date) : "—"}
          accent="teal"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Needs you next */}
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader
              title="Needs You Next"
              sub={`${criticalCount} critical · ${openTasks.length} open action items`}
            />
            <div className="flex flex-col">
              {openTasks.map((t) => (
                <Link
                  key={t.id}
                  href={t.link ?? "#"}
                  className={`accent-bar bar-${priorityAccent[t.priority]} pl-4 py-3 border-b hairline last:border-0 hover:bg-[var(--surface-2)] rounded-md transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Dot accent={priorityAccent[t.priority]} />
                        <span className="text-[14px] font-medium">{t.title}</span>
                      </div>
                      <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-snug">
                        {t.detail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Pill accent={priorityAccent[t.priority]}>{t.priority}</Pill>
                      {t.due && (
                        <div className="text-[11px] text-[var(--faint)] mt-1.5">
                          {relativeDue(t.due)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming deadlines timeline */}
        <div>
          <Card>
            <SectionHeader title="Upcoming Deadlines" />
            <div className="flex flex-col gap-3">
              {upcoming.map((d) => {
                const n = daysFromToday(d.date);
                const accent: Accent =
                  d.status === "overdue" || n < 0 ? "rose" : n <= 7 ? "amber" : "teal";
                return (
                  <div key={d.id} className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <Dot accent={accent} />
                      <div className="flex-1 w-px bg-[var(--border)] mt-1" />
                    </div>
                    <div className="pb-1">
                      <div className="text-[12px] text-[var(--muted)]">{fmtDay(d.date)}</div>
                      <div className="text-[13.5px] font-medium leading-snug">{d.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="tag">{d.owner}</span>
                        <span
                          className={`text-[11px] ${accent === "rose" ? "text-rose" : "text-[var(--faint)]"}`}
                        >
                          {relativeDue(d.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/deadlines"
              className="block text-center text-[12px] text-[var(--blue)] mt-3 hover:underline"
            >
              View all deadlines →
            </Link>
          </Card>
        </div>
      </div>

      {/* Activity feed */}
      <div className="mt-5">
        <Card>
          <SectionHeader title="What's Happened" sub="Recent docket filings & correspondence" />
          <div className="flex flex-col">
            {activity.map((a) => (
              <div
                key={a.kind + a.id}
                className="flex items-start gap-3 py-2.5 border-b hairline last:border-0"
              >
                <span className="mt-1.5">
                  <Dot accent={a.accent} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium">{a.label}</span>
                    <span className="tag">{a.kind}</span>
                  </div>
                  <p className="text-[12.5px] text-[var(--muted)] leading-snug">{a.detail}</p>
                </div>
                <span className="text-[11px] text-[var(--faint)] shrink-0">{fmtDay(a.date)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: Accent }) {
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
