import { sql } from "../../db";
import { getSession } from "../../_lib";
export async function POST(request:Request){const s=await getSession(request);if(s)await sql`DELETE FROM sessions WHERE token=${s.token}`;return Response.json({ok:true},{headers:{"Set-Cookie":"pt_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"}});}
