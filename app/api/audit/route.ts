import { sql } from "../db";import { getSession,unauthorized } from "../_lib";
export async function GET(request:Request){const s=await getSession(request);if(!s)return unauthorized();const rows=await sql`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100`;return Response.json({logs:rows});}
