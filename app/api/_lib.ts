import { sql } from "./db";

export type Role = "doctor" | "nurse" | "viewer";
export type Session = { token:string; email:string; name:string; role:Role };

export const DEMO_USERS = [
  {email:"doctor@patienttriage.ai",password:"CareFirst#2026",name:"Dr. Meera Rao",role:"doctor" as Role},
  {email:"nurse@patienttriage.ai",password:"CareFirst#2026",name:"Nurse Arjun Nair",role:"nurse" as Role},
  {email:"viewer@patienttriage.ai",password:"CareFirst#2026",name:"Operations Viewer",role:"viewer" as Role},
];

const cookieValue=(request:Request,name:string)=>request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1) ?? null;

export async function getSession(request:Request):Promise<Session|null>{
  const token=cookieValue(request,"pt_session");
  if(!token)return null;
  const rows=await sql<Session[]>`SELECT token,email,name,role FROM sessions WHERE token=${token}`;
  return rows[0]??null;
}

export function unauthorized(message="Sign in required",status=401){return Response.json({error:message},{status});}

export function triage(input: { 
  age: number; 
  heartRate: number; 
  systolic: number; 
  spo2: number; 
  temperature: number; 
  pain: number; 
  complaintTags: string[]; // Replaced raw string with predefined tags
  historyTags: string[];   // Replaced raw string with predefined tags
}) {
  const { age, heartRate: hr, systolic: sys, spo2, temperature: temp, pain, complaintTags, historyTags } = input;
  const reasons: string[] = [];
  let esi = 5, confidence = 95, riskScore = 0;

  // --- HELPERS ---
  const floorEsi = (target: number, msg: string) => { esi = Math.min(esi, target); if (!reasons.includes(msg)) reasons.push(msg); };
  const addRisk = (pts: number, msg?: string) => { riskScore += pts; if (msg && !reasons.includes(msg)) reasons.push(msg); };
  // New helper: simply checks if any of the target tags exist in the input array
  const has = (patientTags: string[], targetTags: string[]) => patientTags.some(tag => targetTags.includes(tag));

  // --- 0. DATA QUALITY & MISSING DATA ---
  if (age < 0 || hr <= 0 || sys <= 0 || spo2 <= 0 || temp < 20 || pain < 0) {
    confidence -= 25; floorEsi(3, "Invalid physiological data; manual check required");
  }
  if (complaintTags.length === 0) { confidence -= 12; floorEsi(3, "Missing chief complaint"); }
  if (historyTags.length === 0) { confidence -= 15; floorEsi(3, "Missing history raises uncertainty"); }

  // --- 1 & 2. STRUCTURED SYMPTOM TRIGGERS ---
  const isThreat = has(complaintTags, ["cardiac_arrest", "apnea", "unconscious", "unresponsive", "severe_hemorrhage"]);
  const isCardiac = has(complaintTags, ["chest_pain", "chest_pressure", "jaw_pain"]);
  const isResp = has(complaintTags, ["shortness_of_breath", "respiratory_distress", "wheezing", "asthma_exacerbation"]);
  const isNeuro = has(complaintTags, ["stroke_symptoms", "facial_droop", "slurred_speech", "focal_weakness", "altered_mental_status"]);
  const isSyncope = has(complaintTags, ["syncope", "seizure", "fainted"]);

  if (isThreat || spo2 < 85 || sys < 70) floorEsi(1, "Immediate life-threat (Vitals or Complaint)");
  if (isCardiac || isResp || isNeuro || isSyncope || has(complaintTags, ["anaphylaxis"])) {
    floorEsi(2, "High-risk acute symptom pattern"); addRisk(5);
  }

  // --- 3. CIRCULATION & SHOCK INDEX ---
  if (spo2 >= 85 && spo2 < 92) { floorEsi(2, "Marked hypoxia"); addRisk(5); }
  else if (spo2 >= 92 && spo2 <= 94) addRisk(2, "Borderline hypoxia");

  if (sys >= 70 && sys < 90) { floorEsi(2, "Significant hypotension"); addRisk(5); }
  else if (sys >= 90 && sys < 100) addRisk(2, "Borderline hypotension");

  if (age >= 16 && sys > 0 && hr / sys >= 0.9) {
    addRisk(hr / sys >= 1.0 ? 4 : 2, "Hemodynamic instability (Shock Index)");
  }

  // --- 4. DYNAMIC AGE-ADJUSTED VITALS ---
  let hrHigh = 110, hrSevere = 140, tempHigh = 38.5, tempSevere = 40.0;
  
  if (age < 3) { 
    hrHigh = 140; hrSevere = 160; tempSevere = 39.0; 
    confidence -= 8; reasons.push("Infant age-adjusted safety check"); 
  } else if (age < 16) { 
    hrHigh = 115; hrSevere = 130; tempHigh = 38.0; tempSevere = 38.5; 
    confidence -= 6; reasons.push("Pediatric age-adjusted safety check"); 
  } else if (age >= 65) { 
    hrHigh = 105; hrSevere = 130; 
    confidence -= 7; reasons.push("Geriatric atypical safeguard"); 
    if (isSyncope || has(complaintTags, ["confusion", "fall"])) { floorEsi(2, "High-risk geriatric presentation"); addRisk(4); }
  }

  if (hr > hrSevere || temp >= tempSevere) { floorEsi(2, "Severe age-adjusted vital abnormality"); addRisk(4); }
  else if (hr > hrHigh || temp >= tempHigh) addRisk(2, "Elevated age-adjusted vital");

  // --- 5. PAIN & HISTORY MODIFIERS ---
  if (pain >= 9) { floorEsi(3, "Extreme pain"); addRisk(3); }
  else if (pain >= 7) { floorEsi(3, "Severe pain"); addRisk(2); }
  else if (pain >= 5) addRisk(1, "Moderate pain");

  if (isCardiac && has(historyTags, ["mi", "heart_failure", "cad", "angina"])) {
    floorEsi(2, "Acute cardiac complaint + cardiac history"); addRisk(2);
  }
  if (isNeuro && has(historyTags, ["prior_stroke", "tia", "seizure_disorder"])) {
    floorEsi(2, "Acute neuro complaint + neuro history"); addRisk(2);
  }

  // --- 6. MULTI-FACTOR ESCALATION & FALLBACK ---
  if (esi > 2 && riskScore >= 7) floorEsi(2, "Multiple concurrent risks escalate acuity");
  else if (esi > 3 && (riskScore >= 3 || pain >= 7)) floorEsi(3, "Moderate risks require urgent evaluation");
  else if (esi === 5 && (riskScore > 0 || pain >= 3)) floorEsi(4, "Stable but symptomatic");
  else if (esi === 5) reasons.push("Stable low-risk presentation");

  if (esi < 3 && hr <= hrHigh && temp < tempHigh && spo2 >= 95 && sys >= 100) confidence -= 4;

  return { esi, confidence: Math.max(55, Math.min(95, confidence)), explanation: reasons.join(" · ") };
}