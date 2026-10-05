import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';
import { cleanDigest, compose, localClock, nextDelivery, validSubscription } from './reminders.ts';

const origins = new Set(['https://orbitmbbs.vercel.app']);
const table='orbit_web_push_subscriptions';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
function equal(a:string,b:string) { if(a.length!==b.length || !b) return false; let n=0; for(let i=0;i<a.length;i++) n|=a.charCodeAt(i)^b.charCodeAt(i); return n===0; }

Deno.serve(async req => {
 const origin=req.headers.get('origin') || '';
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin)) headers['Access-Control-Allow-Origin']=origin;
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS') return new Response(null,{status:origins.has(origin)?204:403,headers:{...headers,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}});
 if(req.method!=='POST' || (origin && !origins.has(origin))) return reply({ok:false},403);
 try {
  const raw=await req.text(); if(raw.length>12000) return reply({ok:false},413);
  const input=JSON.parse(raw);
  const {data:config,error:configError}=await db.rpc('orbit_web_push_config');
  if(configError || !config?.orbit_push_private_key || !config.orbit_push_public_key) return reply({ok:false,error:'Reminders are being set up.'},503);
  const send=async(row:any,payload:any)=>{
   if(!validSubscription(row.subscription)) return 400;
   const details=webpush.generateRequestDetails(row.subscription,JSON.stringify(payload),{vapidDetails:{subject:'https://orbitmbbs.vercel.app',publicKey:config.orbit_push_public_key,privateKey:config.orbit_push_private_key},TTL:3600,urgency:'normal',topic:'orbit-daily',contentEncoding:'aes128gcm'});
   const response=await fetch(details.endpoint,{method:'POST',headers:details.headers,body:new Uint8Array(details.body),redirect:'error',signal:AbortSignal.timeout(10000)});
   await response.body?.cancel();
   if(response.status===404 || response.status===410) await db.from(table).delete().eq('endpoint',row.endpoint);
   return response.status;
  };
  if(input.action==='config') return reply({ok:true,publicKey:config.orbit_push_public_key});
  if(input.action==='dispatch') {
   if(!equal(req.headers.get('x-orbit-cron') || '',config.orbit_push_cron_token || '')) return reply({ok:false},401);
   const {data:rows,error}=await db.rpc('orbit_web_push_claim'); if(error) throw error;
   let sent=0,quiet=0,failed=0;
   await Promise.all((rows || []).map(async(row:any)=>{
    const now=new Date(), date=localClock(row.timezone,now).date;
    const payload=compose(row.digest,row.timezone,now);
    const next=nextDelivery(row.timezone,row.reminder_hour,now);
    if(!payload || row.last_sent_date===date) { quiet++; await db.from(table).update({next_delivery_at:next}).eq('endpoint',row.endpoint);return; }
    try {
     const status=await send(row,payload);
     if(status>=200 && status<300) {sent++;await db.from(table).update({last_sent_date:date,next_delivery_at:next,failures:0}).eq('endpoint',row.endpoint);}
     else {failed++;await db.from(table).update({failures:row.failures+1,enabled:row.failures<4,next_delivery_at:new Date(Date.now()+15*60000).toISOString()}).eq('endpoint',row.endpoint);}
    } catch {failed++;await db.from(table).update({failures:row.failures+1,enabled:row.failures<4,next_delivery_at:new Date(Date.now()+15*60000).toISOString()}).eq('endpoint',row.endpoint);}
   }));
   return reply({ok:true,sent,quiet,failed});
  }
  // Browser operations require a real authenticated/anonymous Supabase user.
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'') || '';
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError || !user) return reply({ok:false},401);
  const endpoint=input.subscription?.endpoint || input.endpoint;
  if(typeof endpoint!=='string' || endpoint.length>2048) return reply({ok:false},400);
  const {data:existing,error:readError}=await db.from(table).select('*').eq('endpoint',endpoint).maybeSingle();
  if(readError) throw readError;
  if(existing && existing.user_id!==user.id) return reply({ok:false},403);
  if(input.action==='unsubscribe') {await db.from(table).delete().eq('endpoint',endpoint).eq('user_id',user.id);return reply({ok:true});}
  if(input.action==='test') {
   if(!existing) return reply({ok:false},404);
   // Atomically reserve the test slot; a repeated tap cannot spam a device.
   const cutoff=new Date(Date.now()-30000).toISOString();
   const {data:reserved,error}=await db.from(table).update({last_test_at:new Date().toISOString()}).eq('endpoint',endpoint).eq('user_id',user.id).or(`last_test_at.is.null,last_test_at.lt.${cutoff}`).select('endpoint');
   if(error) throw error;if(!reserved?.length) return reply({ok:false},429);
   const payload=compose(input.digest || existing.digest,existing.timezone) || {title:'ORBIT · notification test',body:'Background notifications are connected. There is nothing due right now.',url:'/',tag:'orbit-test'};
   const status=await send(existing,payload);
   return reply({ok:status>=200 && status<300,sent:status>=200 && status<300},status>=200 && status<300?200:502);
  }
  if(!['subscribe','update'].includes(input.action)) return reply({ok:false},400);
  if(input.action==='subscribe' && !validSubscription(input.subscription)) return reply({ok:false},400);
  if(input.action==='update' && !existing) return reply({ok:false},404);
  const zone=typeof input.timezone==='string'?input.timezone:'UTC';
  try {localClock(zone);} catch {return reply({ok:false},400);}
  const hour=Number(input.hour); if(!Number.isInteger(hour) || hour<6 || hour>23) return reply({ok:false},400);
  if(!existing) {
   const {count,error}=await db.from(table).select('endpoint',{count:'exact',head:true}).eq('user_id',user.id);
   if(error) throw error;if((count || 0)>=5) return reply({ok:false},429);
  }
  const record={endpoint,user_id:user.id,subscription:existing?.subscription || input.subscription,timezone:zone,reminder_hour:hour,digest:cleanDigest(input.digest),enabled:input.enabled!==false,updated_at:new Date().toISOString(),next_delivery_at:nextDelivery(zone,hour),failures:0};
  // Never let a conflicting endpoint transfer ownership during a concurrent insert.
  const operation=existing ? db.from(table).update(record).eq('endpoint',endpoint).eq('user_id',user.id) : db.from(table).insert(record);
  const {error}=await operation;if(error) throw error;
  return reply({ok:true});
 } catch {return reply({ok:false,error:'Background reminders could not be saved.'},500);}
});
