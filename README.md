# PatientTriage.ai — Accenture Round 2 Prototype

Live prototype: https://patienttriage-ai-round2.institutiona-8420.chatgpt.site

A safety-first emergency department command center developed for the Accenture Round 2 submission and aligned to the team’s Round 1 concept.

## What judges can test

- 20 synthetic cases including pediatric, geriatric, ambiguous and zero-history presentations
- Explicit confidence on every recommendation
- Low-confidence and missing-data escalation floors
- 3× surge simulation and waiting-room deterioration
- Doctor-only priority override with mandatory clinical justification
- Nurse role showing the override control disabled
- Append-only audit record

## Safety contract

1. Hard red flags establish a non-negotiable urgency floor.
2. Missing data or uncertainty may raise urgency but never lower it.
3. Automated monitoring may escalate but never downgrade priority.
4. Only an authenticated doctor can alter priority.
5. Changes below the computed safety floor are blocked; conservative over-triage is accepted.
6. Every override records actor, reason, prior/new priority, timestamp, record version and model version.

## Architecture alignment

The reference uses Next.js, Express/TypeScript services, MongoDB/Mongoose, JWT role middleware, a rules-first triage service, optimistic locking and immutable audit logging. This implementation preserves those separation-of-concern principles in a deployment-friendly Vinext/Cloudflare architecture: server API routes, durable D1 records, HttpOnly credential sessions, server-enforced role authorization, versioned patient updates and append-only audits. It adds age-aware ESI-style levels, uncertainty and a strict no-undertriage safety floor.

## Demo credentials

- Doctor: `doctor@patienttriage.ai` / `CareFirst#2026`
- Nurse: `nurse@patienttriage.ai` / `CareFirst#2026`
- Viewer: `viewer@patienttriage.ai` / `CareFirst#2026`

These are competition-demo accounts, not production credentials.

## Vercel Postgres / Neon setup

Create a Postgres database through the Vercel Marketplace (Neon is recommended) and expose its connection string as `DATABASE_URL` for Development, Preview and Production.

Run the schema migration once:

```bash
npm run db:migrate
```

## Run locally

```bash
npm install
npm run db:migrate
npm run dev
```

Production build: `npm run build`. Requires Node.js 22.13+ and `DATABASE_URL`.

## Direct GitHub import

1. Create an empty repository and extract this package into its root.
2. Commit the included files.
3. Import the repository into Vercel and keep the detected Next.js build defaults.
4. Connect a Neon Postgres database and confirm `DATABASE_URL` is present.
5. Run `npm run db:migrate` with the production connection string once.
6. Redeploy, then add the URL here and in the submission deck.

No secrets are required for the prototype.

## Four-minute demo

1. Show the risk-ordered queue.
2. Open `PT-1062` for infant + zero-history escalation at 62% confidence.
3. Switch to **Nurse Arjun** and show priority editing is disabled.
4. Switch to **Dr. Meera Rao**, open override, and show reason + escalation-only choices.
5. Simulate deterioration for `PT-1058` and show ESI 3→2 queue movement.
6. Activate surge ×3, then open audit and architecture.

## Disclaimer

Competition prototype with synthetic data. Not clinically validated, not a medical device and not for real patient care.
