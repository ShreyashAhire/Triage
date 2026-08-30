# PatientTriage.ai — 4-minute demo narration

**0:00–0:25 — Problem and promise**  
“Emergency triage is not a one-time label. PatientTriage.ai turns the waiting room into a continuously monitored, explainable safety system. It assists the nurse; it never replaces clinical judgment.”

**0:25–1:05 — Realistic queue and uncertainty**  
“Here are 20 synthetic arrivals across pediatric, adult, and geriatric populations. Every recommendation includes confidence and reasons. Let us open PT-1062: a one-year-old, first-time patient with poor feeding. The information is incomplete, so confidence is only 62%. Our system does not become falsely reassuring. The infant and zero-history safety floor escalates the case to ESI 2.”

**1:05–1:35 — Ambiguity and age awareness**  
“PT-1033 reports jaw discomfort and fatigue—not classic chest pain. In a 70-year-old with diabetes, the assistant recognizes an ambiguous ACS pattern and exposes why it escalated. The same inputs would not receive the same weights in every age group.”

**1:35–2:05 — Surge**  
“Now the department receives three times normal volume. Surge mode never downgrades clinical safety. It tightens uncertainty escalation from 75 to 82 percent, shortens reassessment intervals by 30 percent, and activates a fast-track lane so scarce clinician time is protected.”

**2:05–2:40 — Deterioration interrupt**  
“PT-1058 was stable enough to wait at ESI 3. We now simulate a repeat observation: heart rate rises, blood pressure falls, and fever worsens. The monitoring engine interrupts, moves the patient to ESI 2, and reorders the queue. This solves the core Round 1 blind spot: a waiting patient is not a static label.”

**2:40–3:15 — Human control and audit**  
“The nurse can accept and route, or override. An override requires a reason and captures the actor, timestamp, original recommendation, final decision, and model version. This feedback supports governance and learning—but is never used to retrain automatically without review.”

**3:15–3:45 — Architecture and scalability**  
“Our hybrid architecture combines transparent safety rules with calibrated risk scoring. It can begin as a standalone tablet at a rural hospital, add one-way FHIR context at a mid-maturity site, and integrate beds and staffing at a large center. Capacity configuration can change; safety floors cannot.”

**3:45–4:00 — Close**  
“PatientTriage.ai changes the question from ‘who arrived first?’ to ‘who needs us now?’ It is safety-biased, age-aware, uncertainty-explicit, auditable, and always clinician-controlled.”
