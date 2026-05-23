import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Dot } from "@/components/ui";
import { deadlines } from "@/lib/data/deadlines";
import { fmtDate, relativeDue, daysFromToday } from "@/lib/format";
import type { Accent, DeadlineStatus } from "@/lib/types";

const statusAccent: Record<DeadlineStatus, Accent> = {
  overdue: "rose",
  "due-soon": "amber",
  upcoming: "teal",
  done: "green",
};

const statusLabel: Record<DeadlineStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  upcoming: "Upcoming",
  done: "Done",
};

export default function DeadlinesPage() {
  const sorted = [...deadlines].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    return daysFromToday(a.date) - daysFromToday(b.date);
  });

  return (
    <>
      <Header title="Deadlines" />
      <Card>
        <SectionHeader
          title="Case Calendar"
          sub="Court-ordered and CPLR deadlines for this matter"
        />
        <div className="flex flex-col">
          {sorted.map((d) => {
            const accent = statusAccent[d.status];
            return (
              <div
                key={d.id}
                className={`accent-bar bar-${accent === "green" ? "teal" : accent} pl-4 py-3.5 border-b hairline last:border-0 flex items-start justify-between gap-4`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-1.5"><Dot accent={accent} /></span>
                  <div className="min-w-0">
                    <div className={`text-[14px] font-medium ${d.status === "done" ? "line-through text-[var(--faint)]" : ""}`}>
                      {d.title}
                    </div>
                    {d.note && (
                      <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-snug">{d.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="tag">{d.owner}</span>
                      <span className="text-[12px] text-[var(--faint)]">{fmtDate(d.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Pill accent={accent}>{statusLabel[d.status]}</Pill>
                  {d.status !== "done" && (
                    <div className="text-[11px] text-[var(--faint)] mt-1.5">{relativeDue(d.date)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
