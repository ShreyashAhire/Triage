import { sql } from "../db";
import { getSession,triage,unauthorized } from "../_lib";
export async function GET(request:Request){
  const s=await getSession(request);if(!s)return unauthorized();
  const rows=await sql`SELECT * FROM patients ORDER BY esi ASC, created_at ASC`;
  return Response.json({patients:rows});
}
export async function POST(request:Request){
  const s=await getSession(request);if(!s)return unauthorized();if(s.role==="viewer")return unauthorized("Viewer accounts cannot add patients",403);
  const b=await request.json() as Record<string,unknown>;
  const required=["name","age","sex","complaint","heartRate","systolic","diastolic","spo2","temperature","pain"];
  if(required.some(k=>b[k]===undefined||b[k]===""))return Response.json({error:"Complete all required patient and vital fields"},{status:400});
  const complaintText = String(b.complaint ?? "");
  const historyText = String(b.history ?? "");
  const result = triage({
    age: Number(b.age),
    heartRate: Number(b.heartRate),
    systolic: Number(b.systolic),
    spo2: Number(b.spo2),
    temperature: Number(b.temperature),
    pain: Number(b.pain),
    complaintTags: complaintText ? [complaintText] : [],
    historyTags: historyText ? [historyText] : [],
  });
  const id=`PT-${Date.now().toString().slice(-6)}`,now=new Date().toISOString();
  await sql`INSERT INTO patients(id,name,age,sex,phone,complaint,symptoms,history,allergies,medications,heart_rate,systolic,diastolic,spo2,temperature,pain,esi,confidence,explanation,status,created_at,created_by,version) VALUES(${id},${String(b.name)},${Number(b.age)},${String(b.sex)},${String(b.phone??"")},${String(b.complaint)},${String(b.symptoms??"")},${String(b.history??"")},${String(b.allergies??"")},${String(b.medications??"")},${Number(b.heartRate)},${Number(b.systolic)},${Number(b.diastolic)},${Number(b.spo2)},${Number(b.temperature)},${Number(b.pain)},${result.esi},${result.confidence},${result.explanation},'waiting',${now},${s.email},1)`;
  await sql`INSERT INTO audit_logs(patient_id,event,actor_email,actor_role,detail,created_at) VALUES(${id},'patient_created',${s.email},${s.role},${`Initial triage ESI ${result.esi}`},${now})`;
  return Response.json({id,triage:result},{status:201});
}
