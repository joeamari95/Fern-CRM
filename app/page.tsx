"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import { EmptyState } from "@/components/forms";
import { useCollection } from "@/lib/store/local";
import { fmtDay, relativeDue, daysFromToday } from "@/lib/format";
import type {
  Accent,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
} from "@/lib/types";

export default function Dashboard() {
  const deadlines = useCollection<Deadline>("deadlines");
  const discovery = useCollection<DiscoveryItem>("discovery");
  const correspondence = useCollection<Correspondence>("correspondence");
  const docket = useCollection<DocketEntry>("docket");

  const ready =
    deadlines.ready && discovery.ready && correspondence.ready && docket.ready;

  const totalEntries =
    deadlines.items.length +
    discovery.items.length +
    correspondence.items.length +
    docket.items.length;

  const openDeadlines = deadlines.items.filter((d) => d.status !== "done");
  const upcoming = [...openDeadlines]
    .sort((a, b) => {
      const da = daysFromToday(a.date);
      const db = daysFromToday(b.date);
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    })
    .slice(0, 5);

  const overdueSoon = deadlines.items.filter(
    (d) => d.status === "overdue" || d.status === "due-soon",
  ).length;

  const openDiscovery = discovery.items.filter(
    (d) => d.status !== "complete" && d.status !== "received",
  );

  // "Needs attention" = urgent deadlines + discovery awaiting action.
  const attention: { id: string; title: string; detail: string; accent: Accent; link: string }[] = [
    ...deadlines.items
      .filter((d) => d.status === "overdue" || d.status === "due-soon")
      .map((d) => ({
        id: "dl-" + d.id,
        title: d.description,
        detail: `${d.type === "US" ? "Us" : d.type} · ${relativeDue(d.date) || fmtDay(d.date)}`,
        accent: (d.status === "overdue" ? "rose" : "amber") as Accent,
        link: "/deadlines",
      })),
    ...openDiscovery
      .filter((d) => d.status === "to-draft" || d.status === "to-serve" || d.status === "responses-due")
      .map((d) => ({
        id: "disc-" + d.id,
        title: d.name,
        detail: `${d.type} · ${d.status.replace("-", " ")}`,
        accent: (d.status === "responses-due" ? "rose" : "amber") as Accent,
        link: "/discovery",
      })),
  ];

  const activity = [
    ...docket.items.map((d) => ({
      id: "dk-" + d.id,
      date: d.date,
      label: d.name,
      detail: [d.filingNumber, d.party].filter(Boolean).join(" · "),
      accent: "blue" as Accent,
      kind: "Docket",
    })),
    ...correspondence.items.map((c) => ({
      id: "co-" + c.id,
      date: c.date,
      label: `${c.from} → ${c.to}`,
      detail: c.summary,
      accent: "teal" as Accent,
      kind: c.type,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  if (!ready) {
    return (
      <>
        <Header title="Dashboard" greeting />
      </>
    );
  }

  if (totalEntries === 0) {
    return (
      <>
        <Header title="Dashboard" greeting />
        <EmptyState
          title="Your workspace is empty"
          hint="This is real, private data stored in your browser. Start by setting up your matter, then add deadlines, discovery, contacts, and correspondence."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {[
            ["Set up matter", "/case"],
            ["Add a deadline", "/deadlines"],
            ["Add discovery", "/discovery"],
            ["Add a contact", "/contacts"],
            ["Log correspondence", "/correspondence"],
            ["Add a filing", "/court"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="card-2 p-4 text-[13px] font-medium hover:bg-[var(--surface-3)] transition-colors">
              + {label}
            </Link>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" greeting />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Open Deadlines" value={String(openDeadlines.length)} accent="blue" />
        <Stat label="Urgent" value={String(overdueSoon)} accent="rose" />
        <Stat label="Open Discovery" value={String(openDiscovery.length)} accent="amber" />
        <Stat
          label="Next Deadline"
          value={upcoming[0] ? relativeDue(upcoming[0].date) || fmtDay(upcoming[0].date) : "—"}
          accent="teal"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Needs You Next" sub="Urgent deadlines and pending discovery" />
            {attention.length === 0 ? (
              <p className="text-[13px] text-[var(--faint)] py-4">
                Nothing urgent right now. 🎉
              </p>
            ) : (
              <div className="flex flex-col">
                {attention.map((t) => (
                  <Link
                    key={t.id}
                    href={t.link}
                    className={`accent-bar bar-${t.accent} pl-4 py-3 border-b hairline last:border-0 hover:bg-[var(--surface-2)] rounded-md transition-colors flex items-center gap-2`}
                  >
                    <Dot accent={t.accent} />
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium">{t.title}</div>
                      <div className="text-[12px] text-[var(--muted)] capitalize">{t.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <SectionHeader title="Upcoming Deadlines" />
            {upcoming.length === 0 ? (
              <p className="text-[13px] text-[var(--faint)] py-4">No upcoming deadlines.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((d) => {
                  const n = daysFromToday(d.date);
                  const accent: Accent =
                    d.status === "overdue" || (!isNaN(n) && n < 0) ? "rose" : !isNaN(n) && n <= 7 ? "amber" : "teal";
                  return (
                    <div key={d.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <Dot accent={accent} />
                        <div className="flex-1 w-px bg-[var(--border)] mt-1" />
                      </div>
                      <div className="pb-1">
                        <div className="text-[12px] text-[var(--muted)]">{fmtDay(d.date)}</div>
                        <div className="text-[13.5px] font-medium leading-snug">{d.description}</div>
                        {relativeDue(d.date) && (
                          <div className="text-[11px] text-[var(--faint)] mt-0.5">
                            {relativeDue(d.date)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href="/deadlines"
              className="block text-center text-[12px] text-[var(--blue)] mt-3 hover:underline"
            >
              View all deadlines →
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <Card>
          <SectionHeader title="What's Happened" sub="Recent docket filings & correspondence" />
          {activity.length === 0 ? (
            <p className="text-[13px] text-[var(--faint)] py-4">No activity logged yet.</p>
          ) : (
            <div className="flex flex-col">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2.5 border-b hairline last:border-0">
                  <span className="mt-1.5">
                    <Dot accent={a.accent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-medium">{a.label}</span>
                      <span className="tag">{a.kind}</span>
                    </div>
                    {a.detail && (
                      <p className="text-[12.5px] text-[var(--muted)] leading-snug">{a.detail}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--faint)] shrink-0">{fmtDay(a.date)}</span>
                </div>
              ))}
            </div>
          )}
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
