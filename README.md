# Fern — Case Management

A litigation case-management dashboard for Fern (Wilson Elser). v1 tracks a single matter and is the
base template for all future cases.

## What it does
- **Dashboard** — what needs doing next, upcoming deadlines, recent activity.
- **Case Overview** — caption, court, index no., justice, facts, summary.
- **Deadlines** — court-ordered & CPLR deadlines with status/urgency.
- **Discovery** — outgoing demands to serve vs. incoming demands to answer + document exchange.
- **Parties & Contacts** — every party, witness, business, and law firm of record with full contacts.
- **Correspondence** — log of emails/letters/calls between parties; flags what needs a reply.
- **Court Tracking** — NYSCEF / e-Courts docket (manual now; live sync stubbed).
- **Reports** — current status report + superseded history.

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS v4. Deploys to Vercel.

## Editing the data
All content lives in editable, typed files under `lib/data/*.ts` (shapes in `lib/types.ts`).
No database in v1 — edit a data file, redeploy, done. The seed case is *Doe v. Acme*.

## Develop
```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Roadmap (not in v1)
Database + in-app edit forms · live NYSCEF/e-Courts scraping · AI email→supplemental-report
summarization · multi-case selector · auth.
