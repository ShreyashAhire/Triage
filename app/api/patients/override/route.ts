import { env } from "cloudflare:workers";
import { getSession,unauthorized } from "../../_lib";
export async function PATCH(request:Request){
  const s=await getSession(request);if(!s)return unauthorized();if(s.role!=="doctor")return unauthorized("Only authenticated doctors may override priority",403);
  const b=await request.json() as {id?:string;esi?:number;reason?:string;version?:number};
  if(!b.id||!b.reason?.trim()||!Number.isInteger(b.esi))return Response.json({error:"Patient, priority and clinical reason are required"},{status:400});
  const p=await env.DB.prepare("SELECT esi,version FROM patients WHERE id=?").bind(b.id).first<{esi:number;version:number}>();if(!p)return Response.json({error:"Patient not found"},{status:404});
  if(Number(b.esi)>p.esi)return Response.json({error:"Downgrade blocked: requested priority is below the current safety floor"},{status:409});
  if(b.version!==p.version)return Response.json({error:"Patient changed since review. Refresh and try again."},{status:409});
  const now=new Date().toISOString();
  const updated=await env.DB.prepare("UPDATE patients SET esi=?,version=version+1 WHERE id=? AND version=?").bind(b.esi,b.id,b.version).run();if(!updated.success)return Response.json({error:"Override failed"},{status:500});
  await env.DB.prepare("INSERT INTO audit_logs(patient_id,event,actor_email,actor_role,detail,created_at) VALUES(?,?,?,?,?,?)").bind(b.id,"doctor_override",s.email,s.role,`ESI ${p.esi} → ${b.esi}. Reason: ${b.reason}`,now).run();
  return Response.json({ok:true});
}
