import { env } from "cloudflare:workers";
import { getSession } from "../../_lib";
export async function POST(request:Request){const s=await getSession(request);if(s)await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(s.token).run();return Response.json({ok:true},{headers:{"Set-Cookie":"pt_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"}});}
