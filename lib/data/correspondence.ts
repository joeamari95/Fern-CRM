import type { Correspondence } from "@/lib/types";

export const correspondence: Correspondence[] = [
  {
    id: "c-1",
    channel: "Email",
    from: "Daniel Harrison (Harrison & Volt)",
    to: "Fern",
    date: "2026-05-21",
    subject: "Doe v. Acme — outstanding document demand",
    summary:
      "Plaintiff's counsel asks for status of our response to the First D&I and proposes EBT dates in June.",
    needsReply: true,
    accent: "rose",
  },
  {
    id: "c-2",
    channel: "Email",
    from: "R. Coyle (Acme Risk Mgmt)",
    to: "Fern",
    date: "2026-05-20",
    subject: "Maintenance logs + Beacon contract",
    summary:
      "Client forwarded Jan 2025 lobby maintenance logs and the executed Beacon service agreement for production review.",
    needsReply: false,
    accent: "teal",
  },
  {
    id: "c-3",
    channel: "Email",
    from: "Fern",
    to: "Beacon Facility Services (legal@beaconfs.com)",
    date: "2026-05-19",
    subject: "Tender of defense & indemnification — Doe matter",
    summary:
      "Sent tender letter demanding defense and indemnification under the service contract. Awaiting response.",
    needsReply: false,
    accent: "amber",
  },
  {
    id: "c-4",
    channel: "Letter",
    from: "Harrison & Volt",
    to: "Wilson Elser",
    date: "2026-04-30",
    subject: "Service of Plaintiff's Bill of Particulars",
    summary: "Verified Bill of Particulars served; alleges $185,000 in special damages.",
    needsReply: false,
    accent: "blue",
  },
];
