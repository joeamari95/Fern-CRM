import type { ReportEntry } from "@/lib/types";

// Append-only dated summaries. The most recent "current" report supersedes prior ones.
// Future: an AI step turns new docket/email events into a fresh supplemental report
// and marks the previous one "superseded".
export const reports: ReportEntry[] = [
  {
    id: "rpt-2",
    date: "2026-05-15",
    label: "Supplemental Report No. 1",
    status: "current",
    sections: [
      {
        heading: "Status",
        body: "Matter is in active discovery. Preliminary Conference Order entered 4/10/2026; note of issue due 9/15/2026.",
      },
      {
        heading: "Liability",
        body: "Plaintiff's Bill of Particulars (served 4/30) alleges failure to remedy a wet lobby floor. Defense centers on lack of actual/constructive notice and delegation of snow-removal duty to Beacon Facility Services. Tender of defense/indemnity sent to Beacon 5/19; response pending.",
      },
      {
        heading: "Damages",
        body: "Plaintiff alleges fractured right wrist with ORIF surgery and $185,000 in special damages. Defense IME (Dr. Brandt, ortho) to be scheduled after records exchange.",
      },
      {
        heading: "Next Steps",
        body: "Respond to Plaintiff's First D&I by 5/28. Serve Demand for Bill of Particulars and combined discovery demands. Obtain plaintiff's HIPAA authorizations. Plaintiff EBT targeted for 6/18.",
      },
    ],
  },
  {
    id: "rpt-1",
    date: "2025-03-22",
    label: "Initial Report",
    status: "superseded",
    sections: [
      {
        heading: "Summary",
        body: "New matter accepted. Plaintiff alleges 1/9/2025 slip-and-fall in lobby of 480 Lexington Ave. Answer served 3/20/2025 with cross-claim against managing agent Beacon Facility Services.",
      },
      {
        heading: "Early Assessment",
        body: "Notice and delegation of maintenance duties are the central liability questions. Recommend tendering to Beacon and securing maintenance logs early.",
      },
    ],
  },
];
