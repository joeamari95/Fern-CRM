import type { CaseFile } from "@/lib/types";

// The single seed case. Duplicate this shape per matter to scale to many cases.
export const activeCase: CaseFile = {
  id: "doe-v-acme",
  caption: "Margaret Doe v. Acme Property Holdings LLC",
  shortName: "Doe v. Acme",
  index: "152431/2025",
  court: "Supreme Court of the State of New York",
  county: "New York County",
  justice: "Hon. Eleanor Vance, J.S.C.",
  type: "Premises Liability — Slip & Fall",
  weRepresent: "Defendant — Acme Property Holdings LLC",
  filed: "2025-02-18",
  status: "Discovery",
  rjiFiled: true,
  noteOfIssue: "2026-09-15",
  summary:
    "Plaintiff alleges she slipped on an unsalted interior lobby floor at 480 Lexington Ave on 2025-01-09, " +
    "sustaining a fractured wrist. We represent the building owner, Acme Property Holdings LLC. Key issues: " +
    "actual/constructive notice of the wet condition and whether snow-removal duties were delegated to the " +
    "managing agent (Beacon Facility Services). Preliminary Conference order entered; discovery ongoing.",
};
