import Header from "@/components/Header";
import { Card, SectionHeader, Pill, Tag } from "@/components/ui";
import { parties } from "@/lib/data/parties";
import type { Accent, Party } from "@/lib/types";

const sideAccent: Record<Party["side"], Accent> = {
  Plaintiff: "rose",
  Defense: "blue",
  Neutral: "teal",
};

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12.5px]">
      <span className="text-[var(--faint)] w-14 shrink-0">{label}</span>
      <span className="text-[var(--muted)] break-all">{value}</span>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <>
      <Header title="Parties & Contacts" />
      <p className="text-[13px] text-[var(--muted)] -mt-3 mb-5">
        Every party, witness, business, and law firm of record — in one place.
      </p>
      <div className="grid lg:grid-cols-2 gap-5">
        {parties.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-[15px] font-semibold">{p.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Tag>{p.role}</Tag>
                  <Pill accent={sideAccent[p.side]}>{p.side}</Pill>
                </div>
              </div>
            </div>
            {p.description && (
              <p className="text-[12.5px] text-[var(--muted)] leading-snug mb-3">{p.description}</p>
            )}
            <div className="flex flex-col gap-1.5 mb-3">
              <Field label="Email" value={p.email} />
              <Field label="Phone" value={p.phone} />
              <Field label="Address" value={p.address} />
            </div>

            {p.firm && (
              <div className="card-2 p-3.5">
                <SectionHeader title={p.firm.name} sub={`Counsel for ${p.firm.represents}`} />
                <div className="flex flex-col gap-1.5 mb-2.5">
                  <Field label="Office" value={p.firm.address} />
                  <Field label="Phone" value={p.firm.phone} />
                </div>
                <div className="flex flex-col gap-2">
                  {p.firm.attorneys.map((a) => (
                    <div key={a.name} className="border-t hairline pt-2 first:border-0 first:pt-0">
                      <div className="text-[13px] font-medium">{a.name}</div>
                      <Field label="Email" value={a.email} />
                      <Field label="Phone" value={a.phone} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
