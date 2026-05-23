import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Tag } from "@/components/ui";
import { discovery } from "@/lib/data/discovery";
import { fmtDate, relativeDue } from "@/lib/format";
import type { Accent, DiscoveryItem, DiscoveryStatus } from "@/lib/types";

const statusAccent: Record<DiscoveryStatus, Accent> = {
  "to-draft": "rose",
  "to-serve": "amber",
  served: "blue",
  "responses-due": "rose",
  received: "teal",
  complete: "green",
};

const statusLabel: Record<DiscoveryStatus, string> = {
  "to-draft": "To Draft",
  "to-serve": "To Serve",
  served: "Served",
  "responses-due": "Responses Due",
  received: "Received",
  complete: "Complete",
};

function Column({ title, sub, items }: { title: string; sub: string; items: DiscoveryItem[] }) {
  return (
    <Card>
      <SectionHeader title={title} sub={sub} right={<Tag>{items.length}</Tag>} />
      <div className="flex flex-col gap-2.5">
        {items.map((d) => (
          <div key={d.id} className={`card-2 p-3.5 accent-bar bar-${statusAccent[d.status] === "green" ? "teal" : statusAccent[d.status]} pl-4`}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13.5px] font-medium leading-snug">{d.title}</span>
              <Pill accent={statusAccent[d.status]}>{statusLabel[d.status]}</Pill>
            </div>
            {d.note && <p className="text-[12px] text-[var(--muted)] mt-1.5 leading-snug">{d.note}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Tag>{d.type}</Tag>
              {d.dueDate && (
                <span className="text-[11px] text-[var(--faint)]">
                  {fmtDate(d.dueDate)} · {relativeDue(d.dueDate)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DiscoveryPage() {
  const outgoing = discovery.filter((d) => d.direction === "outgoing");
  const incoming = discovery.filter((d) => d.direction === "incoming");

  return (
    <>
      <Header title="Discovery" />
      <p className="text-[13px] text-[var(--muted)] -mt-3 mb-5">
        Demands to send out and the status of document exchange between parties.
      </p>
      <div className="grid lg:grid-cols-2 gap-5">
        <Column
          title="Our Demands (Outgoing)"
          sub="Discovery we serve on plaintiff / third parties"
          items={outgoing}
        />
        <Column
          title="Served On Us (Incoming)"
          sub="Demands we must respond to"
          items={incoming}
        />
      </div>
    </>
  );
}
