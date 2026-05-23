import type { Deadline } from "@/lib/types";

// Dates chosen relative to the seed "today" (2026-05-23) so the dashboard shows live urgency.
export const deadlines: Deadline[] = [
  {
    id: "d-1",
    title: "Respond to Plaintiff's First Document Demand",
    date: "2026-05-28",
    owner: "Us",
    status: "due-soon",
    note: "30-day response window under CPLR 3120. Draft objections + responsive docs from client.",
  },
  {
    id: "d-2",
    title: "Serve Defendant's Demand for Bill of Particulars",
    date: "2026-06-05",
    owner: "Us",
    status: "upcoming",
    note: "Demand particulars on notice and specific defect alleged.",
  },
  {
    id: "d-3",
    title: "Plaintiff deposition (EBT)",
    date: "2026-06-18",
    owner: "Joint",
    status: "upcoming",
    note: "Per PC order. Confirm location + court reporter.",
  },
  {
    id: "d-4",
    title: "Compliance Conference",
    date: "2026-07-09",
    owner: "Court",
    status: "upcoming",
  },
  {
    id: "d-5",
    title: "File / serve Answer",
    date: "2025-03-20",
    owner: "Us",
    status: "done",
    note: "Answer with affirmative defenses + cross-claim against Beacon served.",
  },
  {
    id: "d-6",
    title: "Exchange initial disclosures (PC order)",
    date: "2026-05-12",
    owner: "Joint",
    status: "overdue",
    note: "Plaintiff has not yet produced authorizations for prior medical records.",
  },
];
