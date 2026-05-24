// Domain types for Finn — Case Management.

export type Accent = "blue" | "teal" | "rose" | "amber" | "peach" | "green" | "muted";

export type Stage =
  | "Pleadings"
  | "Discovery"
  | "Motion Practice"
  | "Trial Prep"
  | "Settlement"
  | "Closed";

export const STAGES: Stage[] = [
  "Pleadings",
  "Discovery",
  "Motion Practice",
  "Trial Prep",
  "Settlement",
  "Closed",
];

// Case metadata (global `finn:cases` collection).
export type Case = {
  id: string;
  name: string;
  index: string;
  court: string;
  county: string;
  justice: string;
  stage: Stage;
  opposingCounsel: string;
  supervisingPartner: string;
  role: string; // Finn's role on the matter
  weRepresent: string;
  nextStep: string;
  nextStepDate: string; // ISO date for the next step (CRM-style, editable)
  lastAction: string;
  lastTouched: string; // ISO date
  notes: string[]; // up to 3 short bullets
  summary: string;
  clientNumber?: string; // iTimeKeep client number (case settings)
  matterNumber?: string; // iTimeKeep matter number (case settings)
};

export type TimeEntry = {
  id: string;
  date: string; // yyyy-mm-dd
  caseId: string;
  taskCode: string; // Tier 1 label
  subCode: string; // Tier 2 label
  description: string; // billing narrative
  hours: number;
  savedAt: string; // ISO datetime
};

export type DeadlineType = "US" | "Joint" | "Court";
export type DeadlineStatus = "upcoming" | "due-soon" | "overdue" | "done";
export type Deadline = {
  id: string;
  date: string;
  description: string;
  type: DeadlineType;
  status: DeadlineStatus;
  assignedBy: string; // supervising partner
  hard: boolean; // court-ordered / CPLR deadline
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
  notes: string;
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

// Items Finn has submitted to a partner, awaiting feedback (global `finn:reviews`).
export type Review = {
  id: string;
  caseId: string;
  document: string;
  submittedTo: string; // partner
  submittedDate: string; // ISO date
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
};

export const CASE_SECTIONS = [
  "deadlines",
  "discovery",
  "correspondence",
  "docket",
  "contacts",
  "reports",
] as const;
export type CaseSection = (typeof CASE_SECTIONS)[number];
