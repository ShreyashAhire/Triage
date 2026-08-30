# Architecture and production extension

The reference repository is a TypeScript monorepo: Next.js frontend, Express backend organized into routes/controllers/services/Mongoose models, and a shared contract package. Its triage order is hard flags, doctor override, AI escalation, weighted score, time escalation and downgrade protection. JWT roles distinguish doctor, nurse and viewer.

## Round 2 flow

```text
Intake/FHIR → completeness + age band → hard safety floor
→ rules + risk + uncertainty → queue + reassessment
→ doctor review → versioned record + append-only audit
```

## Production invariant

Every priority mutation endpoint must require authenticated doctor middleware and repeat authorization in the service layer. On each request: re-run hard-red-flag rules, reject a lower-urgency result than the safety floor, require a clinical reason, enforce `expectedVersion`, then append an audit event.

Suggested endpoint:

```text
PATCH /api/patients/:patientId/doctor-override
Body: { priority, reason, expectedVersion }
```

For ESI, smaller numbers are more urgent. The effective result is the most urgent of the model, uncertainty, wait-time and doctor inputs. Automated processes must never numerically increase ESI (downgrade urgency).
