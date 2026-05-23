// Entry shapes for the live (localStorage-backed) app. Each entry has an `id`.

export type DeadlineType = "US" | "Joint" | "Court";
export type DeadlineStatus = "upcoming" | "due-soon" | "overdue" | "done";
export type Deadline = {
  id: string;
  date: string;
  description: string;
  type: DeadlineType;
  status: DeadlineStatus;
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
  name: string;
  type: string;
  direction: DiscoveryDirection;
  dueDate: string;
  status: DiscoveryStatus;
};

export type CorrespondenceType = "Email" | "Letter" | "Call" | "Court";
export type Correspondence = {
  id: string;
  date: string;
  type: CorrespondenceType;
  from: string;
  to: string;
  summary: string;
};

export type DocketEntry = {
  id: string;
  filingNumber: string;
  name: string;
  party: string;
  date: string;
  notes: string;
};

export type Contact = {
  id: string;
  partyName: string;
  role: string;
  firm: string;
  attorney: string;
  email: string;
  phone: string;
};

export type ReportStatus = "current" | "superseded";
export type ReportEntry = {
  id: string;
  date: string;
  label: string;
  status: ReportStatus;
  body: string;
};

export type CaseProfile = {
  caption: string;
  index: string;
  court: string;
  county: string;
  justice: string;
  type: string;
  weRepresent: string;
  status: string;
  summary: string;
};

// File attachment metadata (the blob itself lives in IndexedDB, keyed by `id`).
export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
};

export type Accent = "blue" | "teal" | "rose" | "amber" | "peach" | "green" | "muted";
