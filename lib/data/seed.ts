"use client";

import { PREFIX, caseKey, newId } from "@/lib/store/local";
import { colorForIndex, setCaseColors } from "@/lib/caseColors";
import type {
  Case,
  Contact,
  Correspondence,
  Deadline,
  DiscoveryItem,
  DocketEntry,
  ReportEntry,
  Review,
} from "@/lib/types";

function off(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
const id = () => newId();

type CaseData = {
  deadlines?: Omit<Deadline, "id">[];
  discovery?: Omit<DiscoveryItem, "id">[];
  correspondence?: Omit<Correspondence, "id">[];
  docket?: Omit<DocketEntry, "id">[];
  contacts?: Omit<Contact, "id">[];
  reports?: Omit<ReportEntry, "id">[];
};

const P = "palsgraf-lirr";

const PALSGRAF_DATA: CaseData = {
  deadlines: [
    { date: off(5), description: "Serve responses to plaintiff's first document demand", type: "US", status: "due-soon", assignedBy: "Michael Harrington", hard: true },
    { date: off(-2), description: "Exchange initial disclosures per PC order", type: "Joint", status: "overdue", assignedBy: "Michael Harrington", hard: true },
    { date: off(14), description: "Serve demand for verified bill of particulars", type: "US", status: "upcoming", assignedBy: "Michael Harrington", hard: false },
    { date: off(28), description: "Plaintiff deposition (EBT)", type: "Joint", status: "upcoming", assignedBy: "Michael Harrington", hard: true },
    { date: off(-70), description: "Serve verified answer", type: "US", status: "done", assignedBy: "Michael Harrington", hard: true },
  ],
  discovery: [
    { name: "Plaintiff's First Notice for Discovery & Inspection", type: "Document Demand", direction: "incoming", dueDate: off(5), status: "responses-due", notes: "Seeks platform maintenance records, incident reports, and guard training materials." },
    { name: "Defendant's Demand for Verified Bill of Particulars", type: "Bill of Particulars", direction: "outgoing", dueDate: off(14), status: "to-draft", notes: "Demand particulars on the alleged negligent acts of the guards and the basis for notice." },
    { name: "Defendant's Combined Demands", type: "Document Demand", direction: "outgoing", dueDate: "", status: "to-draft", notes: "Demand prior medical records, photographs, and the names of fact witnesses." },
    { name: "Plaintiff's Verified Bill of Particulars", type: "Bill of Particulars", direction: "incoming", dueDate: off(-20), status: "received", notes: "Alleges nervous shock and physical injuries from the platform scale." },
    { name: "Subpoena — station platform records", type: "Subpoena", direction: "outgoing", dueDate: "", status: "to-draft", notes: "So-ordered subpoena for platform configuration and scale placement records." },
  ],
  correspondence: [
    { date: off(-1), type: "Email", from: "Counsel, Wood & Hartman", to: "Finn O'Connell", summary: "Asks for the status of our document responses and proposes deposition dates next month." },
    { date: off(-3), type: "Email", from: "M. Harrington (Partner)", to: "Finn O'Connell", summary: "Wants the no-duty framing tied to platform measurements before depositions; revise draft responses." },
    { date: off(-5), type: "Letter", from: "LIRR Claims", to: "Finn O'Connell", summary: "Produced the station incident report and guard assignment records for the date of loss." },
    { date: off(-20), type: "Court", from: "Wood & Hartman", to: "Wilson Elser", summary: "Served plaintiff's verified bill of particulars." },
  ],
  docket: [
    { filingNumber: "NYSCEF 1", name: "Summons + Verified Complaint", party: "Plaintiff", date: off(-150), notes: "Action commenced; negligence and failure to maintain a safe platform." },
    { filingNumber: "NYSCEF 2", name: "Verified Answer", party: "Defendant", date: off(-120), notes: "Affirmative defenses including lack of duty and lack of proximate cause." },
    { filingNumber: "NYSCEF 3", name: "RJI + PC Request", party: "Plaintiff", date: off(-95), notes: "Preliminary conference requested." },
    { filingNumber: "NYSCEF 4", name: "Preliminary Conference Order", party: "Court", date: off(-60), notes: "Discovery schedule set; note of issue deadline calendared." },
    { filingNumber: "NYSCEF 5", name: "Verified Bill of Particulars", party: "Plaintiff", date: off(-20), notes: "Particulars of injuries and alleged negligent acts." },
  ],
  contacts: [
    { partyName: "Helen Palsgraf", role: "Plaintiff", firm: "Wood & Hartman, LLP", attorney: "Matthew Wood, Esq.", email: "mwood@woodhartman.com", phone: "(718) 555-0151" },
    { partyName: "The Long Island Railroad Company", role: "Our Client", firm: "—", attorney: "Claims: D. Russo", email: "drusso@lirr-claims.com", phone: "(516) 555-0177" },
    { partyName: "Station Guard A (boarding assist)", role: "Witness", firm: "—", attorney: "—", email: "", phone: "(516) 555-0181" },
    { partyName: "Station Guard B (platform)", role: "Witness", firm: "—", attorney: "—", email: "", phone: "(516) 555-0182" },
    { partyName: "Dr. Alan Pierce, M.D.", role: "Expert", firm: "Pierce Neurology", attorney: "Scheduling", email: "scheduling@pierceneuro.com", phone: "(212) 555-0163" },
  ],
  reports: [
    {
      date: off(-7),
      label: "Supplemental Report No. 1",
      status: "current",
      body:
        "STATUS: Matter is in active discovery. Preliminary Conference Order entered and depositions scheduled.\n\n" +
        "LIABILITY: Defense centers on duty and foreseeability. Plaintiff stood at the far end of the platform " +
        "when a package dropped by a boarding passenger detonated. The question is whether LIRR owed a duty to a " +
        "person outside the zone of foreseeable risk and whether the guards' conduct was a proximate cause.\n\n" +
        "DAMAGES: Plaintiff alleges nervous shock and physical injuries attributed to a falling platform scale.\n\n" +
        "NEXT STEPS: Serve document responses, serve the bill of particulars demand, and prepare for the plaintiff deposition.",
    },
    {
      date: off(-110),
      label: "Initial Report",
      status: "superseded",
      body:
        "New matter accepted. Plaintiff alleges injury at the East New York station from an exploding package " +
        "and a falling scale. Answer served with affirmative defenses on duty and proximate cause. Early " +
        "assessment: foreseeability and the scope of duty are the central questions.",
    },
  ],
};

const PER_CASE: Record<string, CaseData> = { [P]: PALSGRAF_DATA };

type Mk = {
  county: string;
  stage: Case["stage"];
  opposingCounsel: string;
  partner: string;
  role: string;
  represent: string;
  nextStep: string;
  lastAction: string;
  summary: string;
  notes: string[];
  hardDays: number;
  hardDesc: string;
};

function mkCase(slug: string, name: string, m: Mk): Case {
  const plaintiff = name.split(" v. ")[0];
  const client = m.represent.replace(/^Defendant — /, "");
  // Light, "basic" sub-data so every section of a case 2-11 dashboard is populated
  // without matching Palsgraf's full build-out.
  PER_CASE[slug] = {
    deadlines: [
      { date: off(m.hardDays), description: m.hardDesc, type: m.stage === "Pleadings" ? "US" : "Court", status: m.hardDays <= 3 ? "due-soon" : "upcoming", assignedBy: m.partner, hard: true },
      { date: off(m.hardDays + 18), description: m.nextStep, type: "US", status: "upcoming", assignedBy: m.partner, hard: false },
    ],
    discovery: [
      {
        name: m.nextStep,
        type: m.stage === "Pleadings" ? "Disclosure" : "Document Demand",
        direction: m.role.toLowerCase().includes("respond") || m.role.toLowerCase().includes("opposing") ? "incoming" : "outgoing",
        dueDate: off(m.hardDays),
        status: m.hardDays <= 3 ? "to-serve" : "to-draft",
        notes: m.notes[0] ?? "",
      },
    ],
    correspondence: [
      { date: off(-2), type: "Email", from: `Counsel, ${m.opposingCounsel}`, to: "Finn O'Connell", summary: `Inquires about the status of ${m.nextStep.toLowerCase()}.` },
      { date: off(-5), type: "Email", from: `${m.partner} (Partner)`, to: "Finn O'Connell", summary: `Assigned you to ${m.role.toLowerCase()}. ${m.notes[0] ?? ""}` },
    ],
    docket: [
      { filingNumber: "NYSCEF 1", name: "Summons + Verified Complaint", party: "Plaintiff", date: off(-120), notes: "Action commenced; premises liability / negligence." },
      m.stage === "Pleadings"
        ? { filingNumber: "NYSCEF 2", name: "RJI", party: "Plaintiff", date: off(-30), notes: "Request for Judicial Intervention filed." }
        : { filingNumber: "NYSCEF 2", name: "Verified Answer", party: "Defendant", date: off(-90), notes: "Answer with affirmative defenses." },
    ],
    contacts: [
      { partyName: plaintiff, role: "Plaintiff", firm: m.opposingCounsel, attorney: "Lead counsel", email: "", phone: "" },
      { partyName: client, role: "Our Client", firm: "—", attorney: "Claims contact", email: "", phone: "" },
    ],
    reports: [
      {
        date: off(-6),
        label: "Initial Report",
        status: "current",
        body:
          `STATUS: ${m.stage}. ${m.summary}\n\n` +
          `NEXT STEPS: ${m.nextStep}. Supervising partner: ${m.partner}; assigned role: ${m.role}.`,
      },
    ],
  };
  return {
    id: slug,
    name,
    index: `${450000 + Math.floor(Math.random() * 9000)}/2026`,
    court: "Supreme Court of the State of New York",
    county: m.county,
    justice:
      "Hon. " +
      ["Karen Liu", "Marcus Bell", "Nina Alvarez", "Peter Hughes", "Grace Okafor"][
        Math.floor(Math.random() * 5)
      ] +
      ", J.S.C.",
    stage: m.stage,
    opposingCounsel: m.opposingCounsel,
    supervisingPartner: m.partner,
    role: m.role,
    weRepresent: m.represent,
    nextStep: m.nextStep,
    lastAction: m.lastAction,
    lastTouched: off(-Math.floor(Math.random() * 9)),
    notes: m.notes,
    summary: m.summary,
  };
}

export const SEED_CASES: Case[] = [
  {
    id: P,
    name: "Palsgraf v. Long Island Railroad",
    index: "451022/2026",
    court: "Supreme Court of the State of New York",
    county: "Kings County",
    justice: "Hon. Andrew Whitfield, J.S.C.",
    stage: "Discovery",
    opposingCounsel: "Wood & Hartman, LLP",
    supervisingPartner: "Michael Harrington",
    role: "Drafting discovery responses",
    weRepresent: "Defendant — The Long Island Railroad Company",
    nextStep: "Serve responses to plaintiff's first document demand",
    lastAction: "Circulated draft discovery responses to M. Harrington",
    lastTouched: off(-1),
    notes: [
      "Core issue is duty and foreseeability — plaintiff stood far down the platform.",
      "Two LIRR guards assisted a passenger carrying a package that fell and detonated.",
      "Partner wants the no-duty framing supported by scene measurements before EBTs.",
    ],
    summary:
      "Plaintiff Helen Palsgraf alleges she was injured at the East New York station when a package " +
      "dropped by a boarding passenger, assisted by two LIRR guards, exploded and caused a coin-operated " +
      "scale at the far end of the platform to strike her. We represent The Long Island Railroad Company. " +
      "Central issues are whether LIRR owed a duty to a plaintiff outside the zone of foreseeable risk and " +
      "whether the guards' conduct was a proximate cause of the injuries. Matter is in active discovery.",
  },
  mkCase("johnson-425-madison", "Johnson v. 425 Madison Ave LLC", {
    county: "New York County",
    stage: "Discovery",
    opposingCounsel: "Sabatino & Reyes, P.C.",
    partner: "Susan Delgado",
    role: "Document review and log",
    represent: "Defendant — 425 Madison Ave LLC (building owner)",
    nextStep: "Respond to plaintiff's combined discovery demands",
    lastAction: "Logged client incident report and lobby maintenance records",
    summary:
      "Plaintiff alleges a slip and fall on a wet lobby floor at 425 Madison Avenue. We represent the " +
      "building owner. Notice and the porter's mopping schedule are the central facts in discovery.",
    notes: [
      "Lobby porter logged a mopping at 8:10 a.m.; incident reported around 8:45 a.m.",
      "Need CCTV preservation confirmation from building management.",
    ],
    hardDays: 6,
    hardDesc: "Respond to plaintiff's combined discovery demands",
  }),
  mkCase("rodriguez-bronx-housing", "Rodriguez v. Bronx Housing Partners", {
    county: "Bronx County",
    stage: "Pleadings",
    opposingCounsel: "The Cabrera Firm",
    partner: "David Brenner",
    role: "Drafting verified answer",
    represent: "Defendant — Bronx Housing Partners LLC",
    nextStep: "Serve verified answer with affirmative defenses",
    lastAction: "Calendared answer deadline and pulled the lease/management agreement",
    summary:
      "Plaintiff alleges a trip and fall on a broken interior step at a Bronx residential building. " +
      "We represent the property owner. Answer is due; assessing a cross-claim against the contractor.",
    notes: [
      "Step repair work order predates the incident by two weeks — confirm completion date.",
      "Possible contractual indemnity from the masonry contractor.",
    ],
    hardDays: 3,
    hardDesc: "Serve verified answer (CPLR 3012)",
  }),
  mkCase("chen-brooklyn-retail", "Chen v. Brooklyn Retail Properties", {
    county: "Kings County",
    stage: "Motion Practice",
    opposingCounsel: "Goldfarb Weiss LLP",
    partner: "Patricia Wong",
    role: "Drafting summary judgment motion",
    represent: "Defendant — Brooklyn Retail Properties Inc.",
    nextStep: "File motion for summary judgment on the storm-in-progress defense",
    lastAction: "Drafted statement of material facts and pulled certified weather data",
    summary:
      "Plaintiff alleges a fall on an icy exterior sidewalk abutting a Brooklyn retail property. We " +
      "represent the owner. The storm-in-progress doctrine is the basis for a dispositive motion.",
    notes: [
      "Certified NWS data shows precipitation ongoing at the time of the fall.",
      "Sidewalk is flagged under NYC Admin Code 7-210 — abutting-landowner duty applies.",
    ],
    hardDays: 12,
    hardDesc: "File motion for summary judgment (return date set)",
  }),
  mkCase("williams-queens-storage", "Williams v. Queens Storage LLC", {
    county: "Queens County",
    stage: "Discovery",
    opposingCounsel: "Lieberman & Stark LLP",
    partner: "Susan Delgado",
    role: "Preparing deposition outline",
    represent: "Defendant — Queens Storage LLC",
    nextStep: "Prepare and take plaintiff's deposition",
    lastAction: "Drafted EBT outline and assembled exhibits",
    summary:
      "Plaintiff alleges a trip and fall on uneven exterior pavement at a Queens self-storage facility. " +
      "We represent the operator. Notice of the pavement condition is the central issue.",
    notes: [
      "Prior work order references the same pavement area — review for notice exposure.",
      "Plaintiff's bill of particulars alleges a knee meniscus tear.",
    ],
    hardDays: 20,
    hardDesc: "Plaintiff deposition (EBT) per compliance order",
  }),
  mkCase("murphy-manhattan-hotel", "Murphy v. Manhattan Hotel Group", {
    county: "New York County",
    stage: "Pleadings",
    opposingCounsel: "Okonkwo Trial Group",
    partner: "Robert Castellano",
    role: "Drafting verified answer",
    represent: "Defendant — Manhattan Hotel Group LLC",
    nextStep: "Serve verified answer and demand for bill of particulars",
    lastAction: "Opened matter file and confirmed coverage with the carrier",
    summary:
      "Plaintiff alleges a slip in a hotel parking garage in Midtown. We represent the hotel operator. " +
      "Identifying the responsible maintenance vendor for a possible cross-claim.",
    notes: [
      "Garage is operated under a management agreement with a third-party vendor.",
      "Confirm lighting and drainage maintenance responsibility.",
    ],
    hardDays: 5,
    hardDesc: "Serve verified answer (CPLR 3012)",
  }),
  mkCase("davis-staten-island-mall", "Davis v. Staten Island Mall Corp", {
    county: "Richmond County",
    stage: "Motion Practice",
    opposingCounsel: "Finkel & Moss, P.C.",
    partner: "Patricia Wong",
    role: "Opposing plaintiff's motion to compel",
    represent: "Defendant — Staten Island Mall Corp",
    nextStep: "File opposition to plaintiff's motion to compel",
    lastAction: "Drafted affirmation in opposition and assembled discovery responses served",
    summary:
      "Plaintiff alleges a fall on an escalator at a Staten Island shopping mall. We represent the mall. " +
      "Escalator maintenance vendor records are the subject of a pending discovery motion.",
    notes: [
      "Escalator serviced under contract by a national elevator company.",
      "Plaintiff moves to compel maintenance logs already produced in part.",
    ],
    hardDays: 9,
    hardDesc: "File opposition to motion to compel (return date set)",
  }),
  mkCase("garcia-midtown-office", "Garcia v. Midtown Office Tower LLC", {
    county: "New York County",
    stage: "Discovery",
    opposingCounsel: "Delacroix Injury Law",
    partner: "Michael Harrington",
    role: "Drafting discovery responses",
    represent: "Defendant — Midtown Office Tower LLC",
    nextStep: "Serve responses and objections to plaintiff's interrogatories",
    lastAction: "Drafted objections to plaintiff's interrogatories",
    summary:
      "Plaintiff alleges a fall on a lobby floor at a Midtown office tower. We represent the owner. " +
      "Cleaning contractor's schedule and notice are the focus of discovery.",
    notes: [
      "Cleaning is handled by an outside janitorial contractor — tender under review.",
      "No prior incident reports located for the lobby in the preceding two years.",
    ],
    hardDays: 7,
    hardDesc: "Serve interrogatory responses (CPLR 3133)",
  }),
  mkCase("thompson-harlem-residential", "Thompson v. Harlem Residential LLC", {
    county: "New York County",
    stage: "Trial Prep",
    opposingCounsel: "Bauer & Tran LLP",
    partner: "Robert Castellano",
    role: "Assembling trial exhibits",
    represent: "Defendant — Harlem Residential LLC",
    nextStep: "Prepare exhibit binders and witness list for trial",
    lastAction: "Filed note of issue review memo and exchanged expert disclosure",
    summary:
      "Plaintiff alleges a fall in an interior stairwell at a Harlem apartment building. We represent the " +
      "owner. Matter is trial-ready; lighting and handrail condition are disputed.",
    notes: [
      "Plaintiff's expert opines on handrail height; our expert disputes causation.",
      "Confirm building superintendent's availability to testify.",
    ],
    hardDays: 24,
    hardDesc: "Pretrial conference before the trial part",
  }),
  mkCase("kim-les-properties", "Kim v. Lower East Side Properties", {
    county: "New York County",
    stage: "Discovery",
    opposingCounsel: "Mancini Legal Group",
    partner: "Susan Delgado",
    role: "Drafting bill of particulars demand",
    represent: "Defendant — Lower East Side Properties LLC",
    nextStep: "Serve demand for verified bill of particulars",
    lastAction: "Drafted combined discovery demands",
    summary:
      "Plaintiff alleges a slip on an entrance mat at a Lower East Side building. We represent the owner. " +
      "Mat placement and condition are the central facts.",
    notes: [
      "Entrance mat supplied and serviced by a uniform/mat rental company.",
      "Photographs from the day of loss show the mat in place.",
    ],
    hardDays: 16,
    hardDesc: "Serve demand for bill of particulars (PC order)",
  }),
  mkCase("patel-upper-west-realty", "Patel v. Upper West Realty Corp", {
    county: "New York County",
    stage: "Pleadings",
    opposingCounsel: "Rosen & Albright LLP",
    partner: "David Brenner",
    role: "Drafting verified answer",
    represent: "Defendant — Upper West Realty Corp",
    nextStep: "Serve verified answer with affirmative defenses",
    lastAction: "Reviewed complaint and confirmed elevator maintenance vendor",
    summary:
      "Plaintiff alleges a fall at an elevator threshold misleveling at an Upper West Side building. We " +
      "represent the owner. Elevator maintenance and inspection records are key.",
    notes: [
      "Elevator maintained under contract by a national elevator service company.",
      "Last inspection certificate appears current — confirm with DOB records.",
    ],
    hardDays: 4,
    hardDesc: "Serve verified answer (CPLR 3012)",
  }),
];

export const SEED_REVIEWS: Review[] = [
  { id: id(), caseId: P, document: "Draft Responses to Plaintiff's First Document Demand", submittedTo: "Michael Harrington", submittedDate: off(-2) },
  { id: id(), caseId: "chen-brooklyn-retail", document: "Draft MSJ — Statement of Material Facts", submittedTo: "Patricia Wong", submittedDate: off(-4) },
  { id: id(), caseId: "garcia-midtown-office", document: "Draft Objections to Interrogatories", submittedTo: "Michael Harrington", submittedDate: off(-1) },
  { id: id(), caseId: "davis-staten-island-mall", document: "Draft Affirmation in Opposition", submittedTo: "Patricia Wong", submittedDate: off(-6) },
];

export function seedAll() {
  localStorage.setItem(PREFIX + "cases", JSON.stringify(SEED_CASES));
  localStorage.setItem(PREFIX + "reviews", JSON.stringify(SEED_REVIEWS));
  // Assign a consistent color to each case.
  const colors: Record<string, string> = {};
  SEED_CASES.forEach((c, i) => (colors[c.id] = colorForIndex(i)));
  setCaseColors(colors);
  const sections: (keyof CaseData)[] = [
    "deadlines",
    "discovery",
    "correspondence",
    "docket",
    "contacts",
    "reports",
  ];
  for (const [slug, data] of Object.entries(PER_CASE)) {
    for (const s of sections) {
      const rows = (data[s] ?? []).map((r) => ({ id: id(), ...r }));
      localStorage.setItem(PREFIX + caseKey(slug, s), JSON.stringify(rows));
    }
  }
}

export function clearAll() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  try {
    indexedDB.deleteDatabase("fern-files");
  } catch {
    /* ignore */
  }
}
