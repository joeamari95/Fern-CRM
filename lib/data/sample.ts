"use client";

import { PREFIX, newId } from "@/lib/store/local";
import type {
  CaseProfile,
  Contact,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
  ReportEntry,
} from "@/lib/types";

// Date relative to today (yyyy-mm-dd) so the demo always looks current.
function off(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const collectionKeys = [
  "deadlines",
  "discovery",
  "correspondence",
  "docket",
  "contacts",
  "reports",
  "case",
];
const attachmentKeys = [
  "attachments:deadlines",
  "attachments:discovery",
  "attachments:correspondence",
  "attachments:court",
];

function write(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function seedSampleData() {
  const caseProfile: CaseProfile = {
    caption: "Margaret Doe v. Acme Property Holdings LLC",
    index: "720202/2025",
    court: "Supreme Court of the State of New York",
    county: "New York County",
    justice: "Hon. Eleanor Vance, J.S.C.",
    type: "Premises Liability — Slip & Fall",
    weRepresent: "Defendant — Acme Property Holdings LLC",
    status: "Discovery",
    summary:
      "Plaintiff alleges she slipped on a wet interior lobby floor at 480 Lexington Ave on " +
      "Jan. 9, 2025, sustaining a fractured right wrist requiring surgery. We represent the " +
      "building owner, Acme Property Holdings LLC. Central issues: actual/constructive notice " +
      "of the wet condition and whether snow-removal duties were delegated to the managing " +
      "agent, Beacon Facility Services. Preliminary Conference order entered; discovery ongoing.",
  };

  const deadlines: Deadline[] = [
    { id: newId(), date: off(-11), description: "Exchange initial disclosures (PC order)", type: "Joint", status: "overdue" },
    { id: newId(), date: off(5), description: "Respond to Plaintiff's First Document Demand", type: "US", status: "due-soon" },
    { id: newId(), date: off(13), description: "Serve Defendant's Demand for Bill of Particulars", type: "US", status: "upcoming" },
    { id: newId(), date: off(26), description: "Plaintiff deposition (EBT)", type: "Joint", status: "upcoming" },
    { id: newId(), date: off(47), description: "Compliance Conference", type: "Court", status: "upcoming" },
    { id: newId(), date: off(-64), description: "Serve Verified Answer + cross-claim", type: "US", status: "done" },
  ];

  const discovery: DiscoveryItem[] = [
    { id: newId(), name: "Plaintiff's First Notice for Discovery & Inspection", type: "Document Demand", direction: "incoming", dueDate: off(5), status: "responses-due", notes: "Seeks maintenance logs, incident reports, and the Beacon service contract." },
    { id: newId(), name: "Defendant's Demand for Bill of Particulars", type: "Bill of Particulars", direction: "outgoing", dueDate: off(13), status: "to-serve", notes: "Draft ready for review." },
    { id: newId(), name: "Defendant's Combined Demands (D&I + interrogatories)", type: "Document Demand", direction: "outgoing", dueDate: "", status: "to-draft", notes: "Demand prior medical records, photographs, and witness statements." },
    { id: newId(), name: "HIPAA authorizations — prior treatment (5 yrs)", type: "Disclosure", direction: "incoming", dueDate: "", status: "to-serve", notes: "Plaintiff overdue producing signed authorizations." },
    { id: newId(), name: "Plaintiff's Verified Bill of Particulars", type: "Bill of Particulars", direction: "incoming", dueDate: off(-23), status: "received", notes: "Received; alleges $185k in special damages." },
  ];

  const correspondence: Correspondence[] = [
    { id: newId(), date: off(-2), type: "Email", from: "Daniel Harrison (Harrison & Volt)", to: "Fern", summary: "Asks status of our document-demand response and proposes June deposition dates." },
    { id: newId(), date: off(-3), type: "Email", from: "R. Coyle (Acme Risk Mgmt)", to: "Fern", summary: "Forwarded Jan. 2025 lobby maintenance logs and the executed Beacon service agreement for review." },
    { id: newId(), date: off(-4), type: "Letter", from: "Fern (Wilson Elser)", to: "Beacon Facility Services", summary: "Tender of defense & indemnification under the service contract. Awaiting response." },
    { id: newId(), date: off(-23), type: "Court", from: "Harrison & Volt", to: "Wilson Elser", summary: "Served Plaintiff's Verified Bill of Particulars; $185,000 specials alleged." },
  ];

  const docket: DocketEntry[] = [
    { id: newId(), filingNumber: "NYSCEF 1", name: "Summons + Verified Complaint", party: "Plaintiff", date: "2025-02-18", notes: "Action commenced; premises liability / negligence." },
    { id: newId(), filingNumber: "NYSCEF 2", name: "Verified Answer", party: "Defendant", date: "2025-03-20", notes: "9 affirmative defenses + cross-claim against Beacon." },
    { id: newId(), filingNumber: "NYSCEF 3", name: "RJI + PC Request", party: "Plaintiff", date: "2025-04-02", notes: "Request for Judicial Intervention; preliminary conference requested." },
    { id: newId(), filingNumber: "NYSCEF 4", name: "Preliminary Conference Order", party: "Court", date: off(-43), notes: "Discovery schedule set; note of issue due in ~4 months." },
    { id: newId(), filingNumber: "NYSCEF 5", name: "Verified Bill of Particulars", party: "Plaintiff", date: off(-23), notes: "$185k special damages alleged." },
  ];

  const contacts: Contact[] = [
    { id: newId(), partyName: "Margaret Doe", role: "Plaintiff", firm: "Harrison & Volt, LLP", attorney: "Daniel Harrison, Esq.", email: "dharrison@harrisonvolt.com", phone: "(212) 555-0143" },
    { id: newId(), partyName: "Acme Property Holdings LLC", role: "Our Client", firm: "—", attorney: "Robert Coyle (Risk Manager)", email: "rcoyle@acmeholdings.com", phone: "(646) 555-0190" },
    { id: newId(), partyName: "Beacon Facility Services Inc.", role: "Third Party", firm: "—", attorney: "Legal Department", email: "legal@beaconfs.com", phone: "(718) 555-0114" },
    { id: newId(), partyName: "James Okafor", role: "Witness", firm: "—", attorney: "—", email: "", phone: "(917) 555-0177" },
    { id: newId(), partyName: "Dr. Helen Brandt, M.D.", role: "Expert", firm: "Brandt Orthopedics", attorney: "Scheduling", email: "scheduling@brandtortho.com", phone: "" },
  ];

  const reports: ReportEntry[] = [
    {
      id: newId(),
      date: off(-8),
      label: "Supplemental Report No. 1",
      status: "current",
      body:
        "STATUS: Matter is in active discovery; Preliminary Conference Order entered.\n\n" +
        "LIABILITY: Plaintiff's Bill of Particulars alleges a wet lobby floor. Defense centers on " +
        "lack of actual/constructive notice and delegation of snow-removal duty to Beacon. Tender " +
        "of defense/indemnity sent to Beacon; response pending.\n\n" +
        "DAMAGES: Plaintiff alleges a fractured right wrist with ORIF surgery and $185,000 in " +
        "special damages. Defense IME to be scheduled after records exchange.\n\n" +
        "NEXT STEPS: Respond to Plaintiff's First D&I; serve BP demand and combined demands; obtain " +
        "HIPAA authorizations; take plaintiff EBT.",
    },
    {
      id: newId(),
      date: "2025-03-22",
      label: "Initial Report",
      status: "superseded",
      body:
        "New matter accepted. Plaintiff alleges a 1/9/2025 slip-and-fall in the lobby of 480 " +
        "Lexington Ave. Answer served with cross-claim against managing agent Beacon Facility " +
        "Services. Early assessment: notice and delegation are the central liability questions.",
    },
  ];

  write("case", caseProfile);
  write("deadlines", deadlines);
  write("discovery", discovery);
  write("correspondence", correspondence);
  write("docket", docket);
  write("contacts", contacts);
  write("reports", reports);
}

export function clearAllData() {
  [...collectionKeys, ...attachmentKeys].forEach((k) => localStorage.removeItem(PREFIX + k));
  // Best-effort: drop uploaded file blobs too.
  try {
    indexedDB.deleteDatabase("fern-files");
  } catch {
    /* ignore */
  }
}
