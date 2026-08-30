import { env } from "cloudflare:workers";import { getSession,unauthorized } from "../_lib";
export async function GET(request:Request){const s=await getSession(request);if(!s)return unauthorized();const rows=await env.DB.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100").all();return Response.json({logs:rows.results});}
