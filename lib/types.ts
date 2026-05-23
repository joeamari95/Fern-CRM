// Shared domain types for the Fern case manager.
// v1 is single-case; every type carries the shape needed to scale to many cases later.

export type Accent = "blue" | "teal" | "rose" | "amber" | "peach" | "green" | "muted";

export type Party = {
  id: string;
  name: string;
  role:
    | "Plaintiff"
    | "Defendant"
    | "Our Client"
    | "Witness"
    | "Expert"
    | "Third Party"
    | "Business";
  side: "Plaintiff" | "Defense" | "Neutral";
  description?: string;
  firm?: LawFirm; // counsel of record, if any
  email?: string;
  phone?: string;
  address?: string;
};

export type LawFirm = {
  name: string;
  represents: string; // e.g. "Plaintiff", "Defendant Acme"
  attorneys: { name: string; email?: string; phone?: string }[];
  address?: string;
  phone?: string;
};

export type DeadlineStatus = "upcoming" | "due-soon" | "overdue" | "done";

export type Deadline = {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  owner: "Us" | "Opposing" | "Court" | "Joint";
  status: DeadlineStatus;
  note?: string;
};

export type DiscoveryDirection = "outgoing" | "incoming";
export type DiscoveryStatus =
  | "to-draft"
  | "to-serve"
  | "served"
  | "responses-due"
  | "received"
  | "complete";

export type DiscoveryItem = {
  id: string;
  title: string; // e.g. "Plaintiff's First Notice for Discovery & Inspection"
  type: "Interrogatories" | "Document Demand" | "Deposition" | "Bill of Particulars" | "Subpoena" | "Disclosure";
  direction: DiscoveryDirection; // outgoing = we serve; incoming = served on us
  status: DiscoveryStatus;
  dueDate?: string;
  note?: string;
};

export type Correspondence = {
  id: string;
  channel: "Email" | "Letter" | "Call" | "Court";
  from: string;
  to: string;
  date: string; // ISO datetime or date
  subject: string;
  summary: string;
  needsReply?: boolean;
  accent?: Accent;
};

export type DocketEntry = {
  id: string;
  docNo: number;
  date: string;
  type: string; // e.g. "Summons + Complaint", "Answer", "RJI"
  filedBy: string;
  summary: string;
};

export type ReportEntry = {
  id: string;
  date: string;
  label: string; // "Initial Report" | "Supplemental Report No. 1" ...
  status: "current" | "superseded";
  sections: { heading: string; body: string }[];
};

export type Task = {
  id: string;
  title: string;
  detail: string;
  priority: "critical" | "high" | "normal";
  due?: string;
  link?: string; // route to the relevant section
};

export type CaseFile = {
  id: string;
  caption: string;
  shortName: string;
  index: string; // index/docket number
  court: string;
  county: string;
  justice: string;
  type: string; // cause of action
  weRepresent: string;
  filed: string;
  status: string;
  rjiFiled?: boolean;
  noteOfIssue?: string;
  summary: string;
};
