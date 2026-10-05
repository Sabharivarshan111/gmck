export function localClock(timezone: string, at = new Date()) {
 const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(at).map(p => [p.type,p.value]));
 const y=+values.year, m=+values.month, d=+values.day;
 const offset = Date.UTC(y,m-1,d,+values.hour,+values.minute,+values.second) - Math.floor(at.getTime()/1000)*1000;
 return { date:`${values.year}-${values.month}-${values.day}`, epochDay:Math.floor((Date.UTC(y,m-1,d)-offset)/86400000), offset, y,m,d };
}
export function nextDelivery(timezone: string, hour: number, at = new Date()) {
 const clock = localClock(timezone, at);
 const target = Date.UTC(clock.y,clock.m-1,clock.d,hour);
 const resolve = (wall: number) => {
  let instant = wall-clock.offset;
  for (let i=0;i<3;i++) instant=wall-localClock(timezone,new Date(instant)).offset;
  return instant;
 };
 let instant=resolve(target);
 if (instant<=at.getTime()) instant=resolve(target+86400000);
 return new Date(instant).toISOString();
}
export function cleanDigest(value: unknown) {
 const d = value && typeof value === 'object' ? value as Record<string, unknown> : {};
 const result: Record<string, unknown> = {};
 for(const key of ['allowExam','allowStreak','allowRevision','allowAttendance','allowPlan','allowMcq']) result[key]=d[key]===true;
 for(const key of ['examDay','lastStudyDay','streak','revisionDueDay','revisionDueCount','mcqDay']) result[key]=typeof d[key]==='number' && Number.isFinite(d[key]) ? Math.max(-1,Math.min(100000,d[key] as number)) : -1;
 for(const key of ['buddyName','planSummary','mcqPreview']) result[key]=typeof d[key]==='string' ? (d[key] as string).slice(0,key==='buddyName'?40:250) : '';
 // Attendance details and exam names stay local; the server needs only opt-in flags.
 return result;
}
export function compose(value: unknown, timezone: string, at = new Date()) {
 const d=cleanDigest(value), today=localClock(timezone,at).epochDay;
 let body='', url='/ask-ai';
 if(d.allowMcq) { body=d.mcqDay===today && d.mcqPreview ? String(d.mcqPreview) : 'Your daily MCQ is ready. Open ORBIT and test your recall.'; url='/'; }
 else if(d.lastStudyDay===today) { if(d.allowAttendance) { body='Check your next clinical posting. One attended day at a time.';url='/progress'; } }
 else if(d.allowExam && Number(d.examDay)>=today && Number(d.examDay)-today<=7) body='Your exam is approaching. Make time for a short revision session.';
 else if(d.allowStreak && Number(d.streak)>=2) body='Keep your study streak going with a few questions today.';
 else if(d.allowRevision && Number(d.revisionDueCount)>0 && Number(d.revisionDueDay)>=0 && Number(d.revisionDueDay)<=today) { body=`${d.revisionDueCount} questions are ready for revision.`;url='/progress'; }
 else if(d.allowAttendance) { body='Check your next clinical posting. One attended day at a time.';url='/progress'; }
 if(!body && d.allowPlan && d.planSummary) { body=String(d.planSummary);url='/ask-ai'; }
 return body ? { title:`${d.buddyName || 'ORBIT'} · ${d.allowMcq ? 'MCQ of the day' : 'study reminder'}`, body,url,tag:'orbit-daily' } : null;
}
export function validSubscription(value: any) {
 try {
  const url=new URL(value.endpoint);
  const host=url.hostname;
  const allowed=host==='fcm.googleapis.com' || host==='updates.push.services.mozilla.com' || host==='push.services.mozilla.com' || /^[a-z0-9-]+\.push\.apple\.com$/.test(host);
  return allowed && url.protocol==='https:' && !url.username && !url.password && !url.port && value.endpoint.length<2048
   && /^[A-Za-z0-9_-]{87}={0,2}$/.test(value.keys?.p256dh) && /^[A-Za-z0-9_-]{22}={0,2}$/.test(value.keys?.auth);
 } catch { return false; }
}
