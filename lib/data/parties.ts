import type { Party } from "@/lib/types";

export const parties: Party[] = [
  {
    id: "p-doe",
    name: "Margaret Doe",
    role: "Plaintiff",
    side: "Plaintiff",
    description: "Alleges fractured right wrist from a fall in the lobby of 480 Lexington Ave.",
    email: "—",
    phone: "—",
    firm: {
      name: "Harrison & Volt, LLP",
      represents: "Plaintiff",
      address: "11 Park Place, Suite 1900, New York, NY 10007",
      phone: "(212) 555-0142",
      attorneys: [
        { name: "Daniel Harrison, Esq.", email: "dharrison@harrisonvolt.com", phone: "(212) 555-0143" },
        { name: "Priya Mehta, Esq.", email: "pmehta@harrisonvolt.com", phone: "(212) 555-0148" },
      ],
    },
  },
  {
    id: "p-acme",
    name: "Acme Property Holdings LLC",
    role: "Our Client",
    side: "Defense",
    description: "Owner of 480 Lexington Ave. Our client. Primary contact: Risk Manager, R. Coyle.",
    email: "rcoyle@acmeholdings.com",
    phone: "(646) 555-0190",
    firm: {
      name: "Wilson Elser Moskowitz Edelman & Dicker LLP",
      represents: "Defendant Acme Property Holdings LLC",
      address: "150 East 42nd Street, New York, NY 10017",
      phone: "(212) 490-3000",
      attorneys: [{ name: "Fern (assigned attorney)", email: "—", phone: "—" }],
    },
  },
  {
    id: "p-beacon",
    name: "Beacon Facility Services Inc.",
    role: "Third Party",
    side: "Neutral",
    description:
      "Managing agent responsible for snow/ice removal under service contract. Potential additional defendant / contractual indemnitor.",
    email: "legal@beaconfs.com",
    phone: "(718) 555-0114",
  },
  {
    id: "p-witness-1",
    name: "James Okafor",
    role: "Witness",
    side: "Neutral",
    description: "Lobby security guard on duty at time of incident. Non-party fact witness.",
    phone: "(917) 555-0177",
  },
  {
    id: "p-expert-1",
    name: "Dr. Helen Brandt, M.D.",
    role: "Expert",
    side: "Defense",
    description: "Retained orthopedic IME expert (defense). Exam not yet scheduled.",
    email: "scheduling@brandtortho.com",
  },
];
