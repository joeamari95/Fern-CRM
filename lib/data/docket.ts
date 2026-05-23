import type { DocketEntry } from "@/lib/types";

// Mirrors a NYSCEF docket row. A future scraper can populate this array directly.
export const docket: DocketEntry[] = [
  {
    id: "dk-1",
    docNo: 1,
    date: "2025-02-18",
    type: "Summons + Complaint",
    filedBy: "Harrison & Volt (Plaintiff)",
    summary: "Action commenced. Premises liability / negligence, single cause of action.",
  },
  {
    id: "dk-2",
    docNo: 2,
    date: "2025-03-20",
    type: "Answer",
    filedBy: "Wilson Elser (Defendant)",
    summary: "Answer with 9 affirmative defenses and cross-claim against Beacon Facility Services.",
  },
  {
    id: "dk-3",
    docNo: 3,
    date: "2025-04-02",
    type: "RJI + PC Request",
    filedBy: "Harrison & Volt (Plaintiff)",
    summary: "Request for Judicial Intervention; preliminary conference requested.",
  },
  {
    id: "dk-4",
    docNo: 4,
    date: "2026-04-10",
    type: "Preliminary Conference Order",
    filedBy: "Court",
    summary: "Discovery schedule set: depositions by 7/2026, note of issue by 9/15/2026.",
  },
  {
    id: "dk-5",
    docNo: 5,
    date: "2026-04-30",
    type: "Bill of Particulars",
    filedBy: "Harrison & Volt (Plaintiff)",
    summary: "Verified Bill of Particulars; $185k special damages alleged.",
  },
];
