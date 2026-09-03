# PatientTriage.ai

**Safety-first emergency department triage and prioritization prototype**

PatientTriage.ai is a full-stack clinical decision-support prototype that assigns an **Emergency Severity Index (ESI) priority from 1–5** using a deterministic, explainable rule engine. The system combines vital-sign severity, age-adjusted thresholds, structured complaint/history risk tags, cumulative risk scoring, hemodynamic instability, uncertainty handling, and doctor-controlled escalation.

> **Disclaimer:** This is a competition/research prototype using synthetic or demonstration data. It is **not clinically validated, not a medical device, and not intended for real patient care**.

---

## Key Features

- **Explainable ESI-style triage** from ESI 1 (highest urgency) to ESI 5 (lowest urgency)
- **Age-adjusted vital thresholds** for infants, pediatric patients, adults, and geriatric patients
- **Multi-factor risk scoring** so several moderate abnormalities can combine into a higher priority
- **Shock Index** derived from existing heart-rate and systolic-BP inputs for patients aged 16+
- **Confidence / assessment certainty score** with penalties for missing or questionable data
- **No-undertriage safety floor:** automated logic can escalate urgency but does not silently downgrade it
- **Role-based access control:** Doctor, Nurse, and Viewer
- **Doctor-only priority override** with mandatory clinical justification
- **Optimistic locking** using patient record versions to prevent stale updates
- **Risk-ordered live queue** sorted by ESI first, then arrival time
- **Append-style audit trail** for patient creation and doctor priority actions
- **PostgreSQL persistence** with Next.js server API routes

---

## Recent Triage Engine Updates

This README reflects the updated code introduced in the following commits:

- [`e2e9cd96fc38c16e016a3ebce265b8527697f019`](https://github.com/ShreyashAhire/Triage/commit/e2e9cd96fc38c16e016a3ebce265b8527697f019)  
  Reworked the triage priority function with structured symptom/history tags, age-specific vital thresholds, Shock Index, cumulative risk scoring, confidence handling, and multi-factor escalation.

- [`a1c84cd8cc0525c3a2153ea686344063ffb2c7e6`](https://github.com/ShreyashAhire/Triage/commit/a1c84cd8cc0525c3a2153ea686344063ffb2c7e6)  
  Updated the patient creation API so the existing frontend complaint/history fields continue to work with the revised triage function without changing the intake form or database schema.

---

# 1. System Architecture

```text
                         ┌──────────────────────┐
                         │     Next.js UI       │
                         │  Queue / Intake /    │
                         │  Audit / Override    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js API Routes │
                         │ Auth / Patients /    │
                         │ Audit / Override     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
         ┌──────────────────────┐          ┌─────────────────────┐
         │  Triage Rule Engine  │          │  Session / RBAC     │
         │  app/api/_lib.ts     │          │  Doctor/Nurse/View  │
         └──────────┬───────────┘          └──────────┬──────────┘
                    │                                 │
                    └───────────────┬─────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │     PostgreSQL       │
                         │ patients / sessions │
                         │ audit_logs          │
                         └──────────────────────┘
```

---

# 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Next.js server API routes |
| Database | PostgreSQL |
| Database Client | `postgres` |
| Authentication | Database-backed session token in HttpOnly cookie |
| Authorization | Server-enforced Doctor / Nurse / Viewer roles |
| Styling | Tailwind CSS / application CSS |
| Deployment | Next.js-compatible hosting such as Vercel |
| Runtime | Node.js 22.13+ |

---

# 3. Patient Prioritization and Override Logic

## Patient Prioritization

The triage engine starts every patient at **ESI 5** and applies progressively more urgent safety floors whenever a rule is triggered.

Lower ESI values represent **higher urgency**:

| ESI | Meaning in Prototype |
|---|---|
| **ESI 1** | Immediate life threat |
| **ESI 2** | High-risk / emergent |
| **ESI 3** | Urgent / significant abnormality |
| **ESI 4** | Stable but symptomatic |
| **ESI 5** | Stable low-risk presentation |

The engine also maintains:

- `confidence` — starts at **95**
- `riskScore` — starts at **0**
- `reasons[]` — stores every explanation contributing to the result

The final output remains:

```ts
{
  esi: number,
  confidence: number,
  explanation: string
}
```

---

## 3.1 ESI 1 — Immediate Life Threat

The patient is escalated to **ESI 1** when an immediate life-threat condition is detected.

### Extreme vital rules

- **SpO₂ < 85%**
- **Systolic BP < 70 mmHg**

### Immediate-threat complaint tags

- `cardiac_arrest`
- `apnea`
- `unconscious`
- `unresponsive`
- `severe_hemorrhage`

Triggered explanation:

```text
Immediate life-threat (Vitals or Complaint)
```

The engine uses a safety-floor approach:

```ts
esi = Math.min(esi, target);
```

Therefore, once a patient reaches a more urgent ESI level, later rules cannot make the patient less urgent.

---

## 3.2 ESI 2 — High-Risk Presentation

A patient is escalated to at least **ESI 2** when a major physiological abnormality or high-risk complaint pattern is detected.

### High-risk complaint categories

**Cardiac**

- `chest_pain`
- `chest_pressure`
- `jaw_pain`

**Respiratory**

- `shortness_of_breath`
- `respiratory_distress`
- `wheezing`
- `asthma_exacerbation`

**Neurological**

- `stroke_symptoms`
- `facial_droop`
- `slurred_speech`
- `focal_weakness`
- `altered_mental_status`

**Syncope / Seizure**

- `syncope`
- `seizure`
- `fainted`

**Other high-risk**

- `anaphylaxis`

A high-risk complaint contributes **+5 risk points** in addition to establishing an ESI 2 safety floor.

---

## 3.3 Oxygen Saturation Segmentation

The updated engine uses severity bands rather than one isolated SpO₂ threshold.

| SpO₂ | Action |
|---|---|
| **< 85%** | ESI 1 |
| **85–91%** | ESI 2 + 5 risk points |
| **92–94%** | +2 risk points |
| **≥ 95%** | No hypoxia risk added |

This allows borderline oxygen abnormalities to contribute to cumulative risk instead of being ignored.

---

## 3.4 Blood Pressure Segmentation

Systolic blood pressure is similarly segmented.

| Systolic BP | Action |
|---|---|
| **< 70** | ESI 1 |
| **70–89** | ESI 2 + 5 risk points |
| **90–99** | +2 risk points |
| **≥ 100** | No hypotension risk added |

---

## 3.5 Shock Index

For patients aged **16 or older**, the engine derives a Shock Index using data already collected by the prototype:

```text
Shock Index = Heart Rate / Systolic Blood Pressure
```

| Shock Index | Risk Contribution |
|---|---|
| **≥ 1.0** | +4 risk points |
| **0.9–0.99** | +2 risk points |
| **< 0.9** | No additional risk |

The Shock Index does not independently assign an ESI level. It contributes to the cumulative risk model and can help identify concerning HR/BP combinations that might otherwise appear only moderately abnormal in isolation.

---

## 3.6 Dynamic Age-Adjusted Vitals

The updated model divides patients into four physiological groups.

### Infant / Toddler — Age < 3

- Elevated HR threshold: **> 140**
- Severe HR threshold: **> 160**
- Elevated temperature threshold: **≥ 38.5°C**
- Severe temperature threshold: **≥ 39.0°C**
- Confidence penalty: **−8**

A severe age-adjusted HR or temperature abnormality forces the patient to at least **ESI 2** and adds **4 risk points**.

Moderate abnormality adds **2 risk points**.

---

### Pediatric — Age 3–15

- Elevated HR threshold: **> 115**
- Severe HR threshold: **> 130**
- Elevated temperature threshold: **≥ 38.0°C**
- Severe temperature threshold: **≥ 38.5°C**
- Confidence penalty: **−6**

Severe abnormalities force the patient to at least **ESI 2**.

---

### Adult — Age 16–64

- Elevated HR threshold: **> 110**
- Severe HR threshold: **> 140**
- Elevated temperature threshold: **≥ 38.5°C**
- Severe temperature threshold: **≥ 40.0°C**

---

### Geriatric — Age ≥ 65

- Elevated HR threshold: **> 105**
- Severe HR threshold: **> 130**
- Elevated temperature threshold: **≥ 38.5°C**
- Severe temperature threshold: **≥ 40.0°C**
- Confidence penalty: **−7**

Additional geriatric safeguards are applied for:

- `syncope`
- `seizure`
- `fainted`
- `confusion`
- `fall`

A qualifying high-risk geriatric presentation forces the patient to at least **ESI 2** and adds additional risk weight.

---

## 3.7 Pain Weighting

Pain is no longer treated as a single binary threshold.

| Pain Score | Action |
|---|---|
| **9–10** | ESI ≤ 3 and +3 risk |
| **7–8** | ESI ≤ 3 and +2 risk |
| **5–6** | +1 risk |
| **3–4** | Can contribute to ESI 4 fallback |
| **0–2** | No pain-based escalation |

This lets pain contribute to overall acuity while keeping severe physiological abnormalities dominant.

---

## 3.8 History-Based Modifiers

Current complaint risk and relevant history can reinforce one another.

### Cardiac history modifier

When an acute cardiac complaint is present together with:

- `mi`
- `heart_failure`
- `cad`
- `angina`

the engine applies:

- ESI floor of **2**
- **+2 risk points**

### Neurological history modifier

When an acute neurological complaint is present together with:

- `prior_stroke`
- `tia`
- `seizure_disorder`

the engine applies:

- ESI floor of **2**
- **+2 risk points**

History therefore acts as a **risk modifier**, not as a replacement for current presentation.

---

## 3.9 Multi-Factor Risk Escalation

A major improvement in the revised engine is that several moderate abnormalities can now combine into a higher-acuity recommendation.

### Cumulative escalation rules

```text
riskScore >= 7
        ↓
ESI 2
```

when the patient has not already been assigned ESI 1 or 2.

```text
riskScore >= 3
OR
pain >= 7
        ↓
ESI 3
```

when the patient has not already been assigned a more urgent level.

```text
riskScore > 0
OR
pain >= 3
        ↓
ESI 4
```

when the patient would otherwise remain ESI 5.

This means borderline SpO₂, borderline hypotension, elevated HR, fever, pain, history modifiers, and Shock Index can work together instead of being evaluated independently.

---

## 3.10 ESI 5 — Stable Low Risk

If no critical rule, high-risk presentation, abnormal-vital contribution, pain escalation, history modifier, or cumulative risk threshold is triggered, the patient remains:

```text
ESI 5 — Stable low-risk presentation
```

---

# 4. Confidence and Data-Quality Safeguards

The engine starts with:

```text
95% rule-confidence score
```

This value is a **prototype heuristic / assessment-certainty indicator**, not a clinically calibrated probability.

### Confidence penalties

| Condition | Penalty |
|---|---:|
| Invalid physiological input | −25 |
| Missing complaint tag | −12 |
| Missing history tag | −15 |
| Age < 3 | −8 |
| Age 3–15 | −6 |
| Age ≥ 65 | −7 |
| High-risk ESI result with otherwise normal vitals | −4 |

Final confidence is bounded to:

```text
55% ≤ confidence ≤ 95%
```

### Missing-data safety floors

- Missing complaint → at least **ESI 3**
- Missing history → at least **ESI 3**
- Invalid physiological data → at least **ESI 3**

The principle is:

> **Uncertainty may increase urgency, but it must not make the patient appear safer.**

---

# 5. Existing Input Contract

The revised triage logic does **not require a new frontend form or database schema**.

The current intake form still collects:

- Age
- Chief complaint
- Medical history
- Heart rate
- Systolic BP
- Diastolic BP
- SpO₂
- Temperature
- Pain score
- Other patient information already present in the prototype

The triage engine directly uses:

```ts
age
heartRate
systolic
spo2
temperature
pain
complaintTags
historyTags
```

The patient API adapts the existing complaint/history strings before calling the triage function:

```ts
complaintTags: complaintText ? [complaintText] : [],
historyTags: historyText ? [historyText] : [],
```

This preserves the existing UI and database contract.

### Current prototype implementation note

The `has()` helper performs **exact tag membership matching**. Therefore, structured symptom/history rules are triggered when the array value matches one of the canonical tags listed above.

The current UI still stores complaint and history as text and the API wraps each value into a one-element array. This keeps the prototype backward-compatible without changing the form or schema, but canonical tag normalization is a future integration improvement.

---

# 6. Live Queue Prioritization

Authenticated users retrieve the patient queue using:

```http
GET /api/patients
```

Patients are ordered by:

```sql
ORDER BY esi ASC, created_at ASC
```

Therefore:

1. More urgent patients appear first.
2. Patients with the same ESI are ordered by arrival time.

Example:

```text
ESI 1
ESI 2
ESI 2
ESI 3
ESI 4
ESI 5
```

This ensures the queue is **clinical-priority-first rather than FIFO-only**.

---

# 7. Doctor Override and Safety Protection

Priority override is available through:

```http
PATCH /api/patients/override
```

Only authenticated users with the role:

```text
doctor
```

may perform an override.

The request requires:

```json
{
  "id": "PT-XXXXXX",
  "esi": 1,
  "reason": "Clinical justification",
  "version": 1
}
```

## No-Downgrade Rule

Because smaller ESI values represent higher urgency:

```text
ESI 3 → ESI 2   allowed
ESI 2 → ESI 1   allowed

ESI 2 → ESI 3   blocked
ESI 3 → ESI 4   blocked
```

The server rejects any attempt to numerically increase the ESI:

```text
Downgrade blocked: requested priority is below the current safety floor
```

This safety check is enforced on the backend, not only in the UI.

---

# 8. Optimistic Locking

Every patient record includes a:

```text
version
```

field.

When a doctor submits an override, the API checks that the submitted version is still the current version.

If another update occurred after the doctor loaded the patient:

```text
expectedVersion != currentVersion
```

the update is rejected and the doctor must refresh.

Successful updates execute:

```text
version = version + 1
```

This prevents stale clinical decisions from silently overwriting newer ones.

---

# 9. Role-Based Access Control

Three demonstration roles are included.

| Capability | Doctor | Nurse | Viewer |
|---|---:|---:|---:|
| View patient queue | Yes | Yes | Yes |
| View patient details | Yes | Yes | Yes |
| View audit trail | Yes | Yes | Yes |
| Add patient | Yes | Yes | No |
| Override / escalate ESI | Yes | No | No |

Authorization is checked again on the backend for protected operations.

---

# 10. Audit Trail

The application stores an audit event whenever:

- a patient is created
- a doctor performs a priority override

Audit data includes:

```text
patient_id
event
actor_email
actor_role
detail
created_at
```

A doctor override records the previous ESI, new ESI, and clinical justification.

The audit endpoint returns the latest 100 events:

```http
GET /api/audit
```

---

# 11. Database Model

The PostgreSQL migration creates three main tables.

## `sessions`

Stores authenticated demonstration sessions.

```text
token
email
name
role
created_at
```

## `patients`

Stores demographics, presentation, vital signs, triage result, confidence, explanation, status, creator, and version.

Important fields include:

```text
id
name
age
sex
complaint
history
heart_rate
systolic
diastolic
spo2
temperature
pain
esi
confidence
explanation
status
created_at
created_by
version
```

## `audit_logs`

Stores patient-related audit events.

```text
id
patient_id
event
actor_email
actor_role
detail
created_at
```

Queue and audit indexes are included for common query patterns.

---

# 12. API Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate demo user |
| `POST` | `/api/auth/logout` | End current session |
| `GET` | `/api/auth/session` | Retrieve authenticated user |
| `GET` | `/api/patients` | Retrieve urgency-ordered patient queue |
| `POST` | `/api/patients` | Run triage and add patient |
| `PATCH` | `/api/patients/override` | Doctor-only ESI escalation |
| `GET` | `/api/audit` | Retrieve recent audit events |

---

# 13. Demo Credentials

The repository contains three competition/demo accounts:

### Doctor

```text
Email: doctor@patienttriage.ai
Password: CareFirst#2026
```

### Nurse

```text
Email: nurse@patienttriage.ai
Password: CareFirst#2026
```

### Viewer

```text
Email: viewer@patienttriage.ai
Password: CareFirst#2026
```

> These credentials are for prototype/demo use only.

---

# 14. Local Setup

## Prerequisites

- Node.js **22.13+**
- npm
- PostgreSQL database
- `DATABASE_URL`

Clone the repository:

```bash
git clone https://github.com/ShreyashAhire/Triage.git
cd Triage
```

Install dependencies:

```bash
npm install
```

Set the PostgreSQL connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Run the schema migration:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 15. Project Structure

```text
Triage/
├── app/
│   ├── api/
│   │   ├── _lib.ts                 # Session helpers + triage engine
│   │   ├── db.ts                   # PostgreSQL connection
│   │   ├── audit/
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── session/
│   │   └── patients/
│   │       ├── route.ts            # Queue + patient creation
│   │       └── override/
│   │           └── route.ts
│   ├── page.tsx                    # Main application UI
│   └── ...
│
├── db/
│   └── migrations/
│       └── 001_initial.sql
│
├── docs/
│   └── ARCHITECTURE.md
│
├── scripts/
│   └── migrate.mjs
│
├── package.json
└── README.md
```

---

# 16. Example Triage Scenarios

## Scenario A — Immediate threat

```text
Age: 45
HR: 125
SBP: 65
SpO₂: 82
Temperature: 37.0
Pain: 5
```

Systolic BP and SpO₂ cross the immediate-threat thresholds.

**Expected priority: ESI 1**

---

## Scenario B — Marked hypoxia

```text
Age: 35
HR: 108
SBP: 110
SpO₂: 89
Temperature: 37.4
Pain: 3
```

SpO₂ between 85–91 establishes a high-risk floor.

**Expected priority: ESI 2**

---

## Scenario C — Pediatric severe vital abnormality

```text
Age: 10
HR: 135
SBP: 105
SpO₂: 97
Temperature: 38.6
Pain: 3
```

For age 3–15:

```text
Severe HR threshold: >130
Severe temperature threshold: >=38.5
```

**Expected priority: ESI 2**

---

## Scenario D — Multi-factor escalation

```text
Age: 42
HR: 120
SBP: 95
SpO₂: 93
Temperature: 38.7
Pain: 6
```

No single immediate-threat rule is required for escalation. Borderline hypotension, borderline hypoxia, elevated age-adjusted vital signs, pain, and Shock Index contributions accumulate in `riskScore`.

The cumulative score can escalate the patient beyond the level suggested by any single measurement.

---

## Scenario E — Stable low-risk patient

```text
Age: 30
HR: 75
SBP: 120
SpO₂: 98
Temperature: 37.0
Pain: 1
```

With no high-risk complaint/history tag and no significant physiological abnormality:

**Expected priority: ESI 5**

---

# 17. Core Safety Invariants

The prototype is designed around the following rules:

1. **Immediate threats establish non-negotiable urgency floors.**
2. **Lower ESI numbers always represent greater urgency.**
3. **Multiple moderate abnormalities can combine into a higher-risk result.**
4. **Missing or invalid information may increase urgency but does not reduce it.**
5. **Age changes how vital-sign abnormalities are interpreted.**
6. **Automated triage uses escalation-only safety floors.**
7. **Only authenticated doctors can manually change priority.**
8. **Doctor changes can escalate urgency but cannot downgrade below the existing safety floor.**
9. **Every successful doctor override requires a reason and current record version.**
10. **Patient creation and doctor overrides are recorded in the audit trail.**

---

# 18. Prototype Limitations

This repository intentionally remains a deterministic decision-support prototype.

Current limitations include:

- The triage rules and risk weights are **heuristic and not clinically validated**.
- The displayed confidence score is a **rule-confidence / completeness heuristic**, not a calibrated probability of medical correctness.
- The current complaint/history adapter wraps existing free-text values into arrays; exact structured tag normalization is limited.
- ESI 3/4/5 resource utilization is not modeled because the current patient form does not collect predicted resource requirements.
- No trained machine-learning model is used in the current triage calculation.
- Demo users and credentials are hard-coded for competition use.
- Patient IDs use a timestamp-derived prototype format rather than a production-grade identifier strategy.
- Audit logging is append-style at the application level; a production system would require stronger database-level immutability and governance.
- The prototype must not be used for clinical decision-making without formal medical validation, security review, and regulatory assessment.

---

# 19. Repository

**GitHub:** https://github.com/ShreyashAhire/Triage

---

## License / Usage

This repository is provided as a prototype and demonstration project. Review the repository and project requirements before reuse or deployment.
