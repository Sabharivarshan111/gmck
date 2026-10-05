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
 for(const key of [
  'allowExam','allowStreak','allowRevision','allowAttendance','allowPlan','allowMcq',
  'attendanceActive','attendanceTodayWorking','attendanceMarkedAbsentToday','attendanceUrgent',
 ]) result[key]=d[key]===true;
 for(const key of [
  'examDay','lastStudyDay','streak','revisionDueDay','revisionDueCount','mcqDay',
  'attendancePercent','attendanceOverallPercent','attendanceTarget','attendanceAttended','attendanceHeld',
 ]) result[key]=typeof d[key]==='number' && Number.isFinite(d[key])
   ? Math.max(-1,Math.min(100000,Math.round(d[key] as number)))
   : -1;
 for(const key of ['buddyName','planSummary','mcqPreview','attendanceName']) {
  const limit=key==='buddyName'?40:key==='attendanceName'?60:250;
  result[key]=typeof d[key]==='string' ? (d[key] as string).slice(0,limit) : '';
 }
 // Background delivery stores only a tiny attendance snapshot: active posting
 // name, current percentages/target and status booleans. No attendance history,
 // dates, monthly breakdown or individual class records leave the browser.
 return result;
}
function attendanceMessage(d: Record<string, unknown>) {
 if(!d.allowAttendance || !d.attendanceActive || !d.attendanceTodayWorking) return null;
 const name=String(d.attendanceName || 'your posting').trim().slice(0,60) || 'your posting';
 const percent=Number(d.attendancePercent);
 const overall=Number(d.attendanceOverallPercent);
 const target=Math.max(1,Number(d.attendanceTarget) || 75);
 const attended=Math.max(0,Number(d.attendanceAttended) || 0);
 const held=Math.max(0,Number(d.attendanceHeld) || 0);
 const postingNumbers=percent>=0 && held>0
  ? `${percent}% (${attended}/${held}), target ${target}%.`
  : 'No attendance has been logged for this posting yet.';
 const overallNumbers=overall>=0 ? ` All recorded attendance: ${overall}%.` : '';
 if(d.attendanceMarkedAbsentToday) return {
  title:`Attendance warning — ${name}`,
  body:`You marked today absent. ${postingNumbers}${overallNumbers} Attend the next working posting day.`,
 };
 if(percent>=0 && percent<target) return {
  title:`Go to ${name} today`,
  body:`You are below your attendance target. ${postingNumbers}${overallNumbers}`,
 };
 const projected=held>=0 ? (attended/Math.max(1,held+1))*100 : 100;
 if(d.attendanceUrgent || (percent>=0 && projected<target)) return {
  title:`Do not miss ${name} today`,
  body:`One absence would put you below ${target}%. ${postingNumbers}${overallNumbers}`,
 };
 return {
  title:`${name} today`,
  body:`Keep the attendance buffer. ${postingNumbers}${overallNumbers}`,
 };
}
export function compose(value: unknown, timezone: string, at = new Date()) {
 const d=cleanDigest(value), today=localClock(timezone,at).epochDay;
 const attendance=attendanceMessage(d);
 let title='', body='', url='/ask-ai';

 // Match Android: an actual attendance risk outranks optional engagement
 // reminders, while a healthy posting stays behind MCQ/exam/streak/revision.
 if(d.attendanceUrgent && attendance) {
  ({title,body}=attendance);url='/progress';
 } else if(d.allowMcq) {
  title='MCQ of the day';
  body=d.mcqDay===today && d.mcqPreview
   ? String(d.mcqPreview)
   : 'Your daily MCQ is ready. Open ORBIT and test your recall.';
  url='/';
 } else if(d.lastStudyDay===today) {
  if(attendance) {({title,body}=attendance);url='/progress';}
 } else if(d.allowExam && Number(d.examDay)>=today && Number(d.examDay)-today<=7) {
  title='Exam reminder';body='Your exam is approaching. Make time for a short revision session.';
 } else if(d.allowStreak && Number(d.streak)>=2) {
  title=`${d.streak} day streak`;body='Keep your study streak going with a few questions today.';
 } else if(d.allowRevision && Number(d.revisionDueCount)>0 && Number(d.revisionDueDay)>=0 && Number(d.revisionDueDay)<=today) {
  title='Revision due';body=`${d.revisionDueCount} questions are ready for revision.`;url='/progress';
 } else if(attendance) {
  ({title,body}=attendance);url='/progress';
 }
 if(!body && d.allowPlan && d.planSummary) { title='Your study plan';body=String(d.planSummary);url='/ask-ai'; }
 return body ? { title:`${d.buddyName || 'ORBIT'} · ${title || 'study reminder'}`, body,url,tag:'orbit-daily' } : null;
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
