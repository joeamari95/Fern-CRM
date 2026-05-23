import type { Task } from "@/lib/types";

// Curated "what needs to be done next" — drives the dashboard priority cards.
export const tasks: Task[] = [
  {
    id: "t-1",
    title: "Respond to Plaintiff's First Document Demand",
    detail:
      "Due 5/28. Draft objections and assemble responsive maintenance logs + Beacon contract from client.",
    priority: "critical",
    due: "2026-05-28",
    link: "/discovery",
  },
  {
    id: "t-2",
    title: "Chase overdue HIPAA authorizations",
    detail:
      "Initial disclosure exchange was due 5/12. Plaintiff still owes signed authorizations for 5 yrs prior treatment.",
    priority: "critical",
    due: "2026-05-12",
    link: "/discovery",
  },
  {
    id: "t-3",
    title: "Reply to D. Harrison re: EBT dates",
    detail: "Plaintiff's counsel proposed June deposition dates and asked for response status.",
    priority: "high",
    link: "/correspondence",
  },
  {
    id: "t-4",
    title: "Serve Demand for Bill of Particulars",
    detail: "Draft is ready for review — serve by 6/5.",
    priority: "high",
    due: "2026-06-05",
    link: "/discovery",
  },
  {
    id: "t-5",
    title: "Follow up on Beacon defense/indemnity tender",
    detail: "Tender letter sent 5/19. No response yet — follow up before compliance conference.",
    priority: "normal",
    link: "/correspondence",
  },
];
