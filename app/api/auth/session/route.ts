import { getSession } from "../../_lib";
export async function GET(request:Request){const session=await getSession(request);return session?Response.json({user:session}):Response.json({user:null},{status:401});}
