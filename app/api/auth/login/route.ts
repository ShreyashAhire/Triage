import { DEMO_USERS } from "../../_lib";
import { env } from "cloudflare:workers";
export async function POST(request:Request){
  const body=await request.json() as {email?:string,password?:string};
  const user=DEMO_USERS.find(x=>x.email===body.email?.toLowerCase()&&x.password===body.password);
  if(!user)return Response.json({error:"Invalid email or password"},{status:401});
  const token=crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO sessions(token,email,name,role,created_at) VALUES(?,?,?,?,?)").bind(token,user.email,user.name,user.role,now).run();
  return Response.json({user:{email:user.email,name:user.name,role:user.role}},{headers:{"Set-Cookie":`pt_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`}});
}
