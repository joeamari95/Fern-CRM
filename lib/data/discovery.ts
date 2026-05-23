import type { DiscoveryItem } from "@/lib/types";

export const discovery: DiscoveryItem[] = [
  {
    id: "disc-1",
    title: "Plaintiff's First Notice for Discovery & Inspection",
    type: "Document Demand",
    direction: "incoming",
    status: "responses-due",
    dueDate: "2026-05-28",
    note: "Seeks maintenance logs, incident reports, and the Beacon service contract.",
  },
  {
    id: "disc-2",
    title: "Defendant's Demand for Bill of Particulars",
    type: "Bill of Particulars",
    direction: "outgoing",
    status: "to-serve",
    dueDate: "2026-06-05",
    note: "Draft ready for review.",
  },
  {
    id: "disc-3",
    title: "Defendant's Combined Demands (D&I + interrogatories)",
    type: "Document Demand",
    direction: "outgoing",
    status: "to-draft",
    note: "Demand prior medical records, photographs, and witness statements.",
  },
  {
    id: "disc-4",
    title: "HIPAA authorizations — prior treatment (5 yrs)",
    type: "Disclosure",
    direction: "incoming",
    status: "to-serve",
    note: "Plaintiff overdue producing signed authorizations.",
  },
  {
    id: "disc-5",
    title: "Plaintiff's Bill of Particulars",
    type: "Bill of Particulars",
    direction: "incoming",
    status: "received",
    note: "Received 2026-04-30. Alleges $185k specials.",
  },
  {
    id: "disc-6",
    title: "Subpoena — Beacon Facility Services maintenance records",
    type: "Subpoena",
    direction: "outgoing",
    status: "to-draft",
    note: "So-ordered subpoena for snow-removal logs covering Jan 2025.",
  },
];
