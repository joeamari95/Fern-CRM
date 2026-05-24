// Task (Tier 1) and Sub (Tier 2) codes for the billable hours system.
// `l` / `a` are UTBMS-style codes used in the iTimeKeep export. These are
// reasonable defaults; a firm may use different codes — edit here in one place.

export type TaskCode = { label: string; l: string; a: string };

export const TASK_CODES: TaskCode[] = [
  { label: "Document Review", l: "L320", a: "A104" },
  { label: "Draft / Revise", l: "L250", a: "A103" },
  { label: "Research", l: "L110", a: "A102" },
  { label: "Communication", l: "L150", a: "A106" },
  { label: "Deposition", l: "L330", a: "A109" },
  { label: "Motion Practice", l: "L240", a: "A103" },
  { label: "Discovery", l: "L310", a: "A104" },
  { label: "Court Appearance", l: "L450", a: "A109" },
  { label: "Conference", l: "L160", a: "A106" },
];

export const SUB_CODES: Record<string, string[]> = {
  "Document Review": ["Medical records", "IME report", "Deposition transcript", "Discovery documents"],
  "Draft / Revise": ["Motion", "Letter", "Discovery demands", "Discovery responses", "Pleading", "Report"],
  Research: ["Case law", "Statute", "Procedural rules"],
  Communication: ["Email", "Phone call", "Letter", "Internal conference"],
  Deposition: ["Prepare", "Attend", "Review transcript"],
  "Motion Practice": ["Draft", "Revise", "Research", "Review", "File"],
  Discovery: ["Draft demands", "Respond to demands", "Review documents", "Meet and confer"],
  "Court Appearance": ["Prepare", "Attend"],
  Conference: ["Client", "Partner", "Opposing counsel"],
};

export function codesFor(label: string): TaskCode | undefined {
  return TASK_CODES.find((t) => t.label === label);
}
