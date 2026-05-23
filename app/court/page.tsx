import Header from "@/components/Header";
import { Card, SectionHeader, Tag } from "@/components/ui";
import { docket } from "@/lib/data/docket";
import { activeCase } from "@/lib/data/case";
import { fmtDate } from "@/lib/format";

export default function CourtPage() {
  const sorted = [...docket].sort((a, b) => b.docNo - a.docNo);

  return (
    <>
      <Header title="Court Tracking" />

      <div
        className="card-2 p-4 mb-5 flex items-center justify-between gap-3"
        style={{ borderColor: "rgba(122,168,255,0.3)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="dot dot-blue" />
            <span className="text-[13.5px] font-medium">NYSCEF / e-Courts sync</span>
            <Tag>Coming soon</Tag>
          </div>
          <p className="text-[12.5px] text-[var(--muted)] mt-1">
            Docket below is entered manually. Live sync will auto-pull new filings and flag them for
            a supplemental report.
          </p>
        </div>
        <Tag>Index {activeCase.index}</Tag>
      </div>

      <Card>
        <SectionHeader title="Docket — NYSCEF" sub={`${docket.length} filings`} />
        <div className="flex flex-col">
          {sorted.map((d) => (
            <div key={d.id} className="flex items-start gap-4 py-3 border-b hairline last:border-0">
              <div className="w-9 shrink-0 text-center">
                <div className="tag">#{d.docNo}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium">{d.type}</span>
                  <Tag>{d.filedBy}</Tag>
                </div>
                <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-snug">{d.summary}</p>
              </div>
              <span className="text-[11px] text-[var(--faint)] shrink-0">{fmtDate(d.date)}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
