import { sql } from "../../db";
import { getSession,unauthorized } from "../../_lib";
export async function PATCH(request:Request){
  const s=await getSession(request);if(!s)return unauthorized();if(s.role!=="doctor")return unauthorized("Only authenticated doctors may override priority",403);
  const b=await request.json() as {id?:string;esi?:number;reason?:string;version?:number};
  if(!b.id||!b.reason?.trim()||!Number.isInteger(b.esi)||!Number.isInteger(b.version))return Response.json({error:"Patient, priority, record version and clinical reason are required"},{status:400});
  const nextEsi=Number(b.esi),expectedVersion=Number(b.version);
  const rows=await sql<{esi:number;version:number}[]>`SELECT esi,version FROM patients WHERE id=${b.id}`;const p=rows[0];if(!p)return Response.json({error:"Patient not found"},{status:404});
  if(nextEsi>p.esi)return Response.json({error:"Downgrade blocked: requested priority is below the current safety floor"},{status:409});
  if(expectedVersion!==p.version)return Response.json({error:"Patient changed since review. Refresh and try again."},{status:409});
  const now=new Date().toISOString();
  const updated=await sql`UPDATE patients SET esi=${nextEsi},version=version+1 WHERE id=${b.id} AND version=${expectedVersion} RETURNING id`;if(!updated.length)return Response.json({error:"Override failed"},{status:409});
  await sql`INSERT INTO audit_logs(patient_id,event,actor_email,actor_role,detail,created_at) VALUES(${b.id},'doctor_override',${s.email},${s.role},${`ESI ${p.esi} → ${nextEsi}. Reason: ${b.reason}`},${now})`;
  return Response.json({ok:true});
}
