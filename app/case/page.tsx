import Header from "@/components/Header";
import { Card, SectionHeader, Tag } from "@/components/ui";
import { activeCase } from "@/lib/data/case";
import { fmtDate } from "@/lib/format";

export default function CasePage() {
  const c = activeCase;
  const facts: [string, string][] = [
    ["Index No.", c.index],
    ["Court", c.court],
    ["County", c.county],
    ["Assigned", c.justice],
    ["Cause of Action", c.type],
    ["We Represent", c.weRepresent],
    ["Filed", fmtDate(c.filed)],
    ["Status", c.status],
    ["RJI Filed", c.rjiFiled ? "Yes" : "No"],
    ["Note of Issue Due", c.noteOfIssue ? fmtDate(c.noteOfIssue) : "—"],
  ];

  return (
    <>
      <Header title="Case Overview" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title={c.caption} sub={`Index No. ${c.index}`} />
            <p className="text-[14px] leading-relaxed text-[var(--muted)]">{c.summary}</p>
          </Card>
        </div>
        <Card>
          <SectionHeader title="Case Facts" />
          <dl className="flex flex-col gap-2.5">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b hairline pb-2.5 last:border-0">
                <dt className="text-[12px] text-[var(--faint)]">{k}</dt>
                <dd className="text-[13px] text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
      <div className="mt-3">
        <Tag>Single-matter view · v1</Tag>
      </div>
    </>
  );
}
