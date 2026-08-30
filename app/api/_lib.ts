import { env } from "cloudflare:workers";

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
  return await env.DB.prepare("SELECT token,email,name,role FROM sessions WHERE token = ?").bind(token).first<Session>();
}

export function unauthorized(message="Sign in required",status=401){return Response.json({error:message},{status});}

export function triage(input:{age:number;heartRate:number;systolic:number;spo2:number;temperature:number;pain:number;complaint:string;history:string}){
  const reasons:string[]=[]; let esi=5; let confidence=92;
  const text=(input.complaint+" "+input.history).toLowerCase();
  const pediatric=input.age<16, geriatric=input.age>=65;
  const hard=input.spo2<85||input.systolic<70||/unconscious|cardiac arrest|severe bleeding/.test(text);
  if(hard){esi=1;reasons.push("Immediate life-threat rule triggered");}
  else {
    if(input.spo2<92||input.systolic<90||/chest pain|shortness of breath|stroke|anaphylaxis/.test(text)){esi=2;reasons.push("High-risk vital or symptom pattern");}
    else if(input.pain>=7||input.temperature>=38.5||input.heartRate>110){esi=3;reasons.push("Abnormal vital, fever or severe pain");}
    else if(input.pain>=3){esi=4;reasons.push("Stable presentation requiring one resource");}
    else reasons.push("Stable low-resource presentation");
  }
  if(pediatric){confidence-=8;reasons.push("Pediatric age-adjusted safety check");if(input.temperature>=38.5||input.heartRate>130)esi=Math.min(esi,2);}
  if(geriatric){confidence-=7;reasons.push("Geriatric atypical-presentation safeguard");if(/weakness|confusion|jaw|fall/.test(text))esi=Math.min(esi,2);}
  if(!input.history.trim()){confidence-=15;reasons.push("Missing history raises uncertainty; urgency cannot be reduced");esi=Math.min(esi,3);}
  return {esi,confidence:Math.max(55,confidence),explanation:reasons.join(" · ")};
}
