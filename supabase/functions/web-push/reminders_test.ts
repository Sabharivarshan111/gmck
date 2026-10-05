import { cleanDigest, compose, localClock, nextDelivery, validSubscription } from './reminders.ts';
function assert(value: unknown) { if(!value) throw new Error('Assertion failed'); }
Deno.test('local midnight matches native epochDay in India', () => {
 const clock=localClock('Asia/Kolkata',new Date('2026-10-05T19:00:00Z'));
 assert(clock.date==='2026-10-06');assert(clock.epochDay===Math.floor(Date.parse('2026-10-05T18:30:00Z')/86400000));
});
Deno.test('schedule advances across daylight saving transitions', () => {
 assert(nextDelivery('America/New_York',19,new Date('2026-03-08T00:30:00Z'))==='2026-03-08T23:00:00.000Z');
 assert(nextDelivery('America/New_York',19,new Date('2026-10-31T23:30:00Z'))==='2026-11-02T00:00:00.000Z');
 assert(nextDelivery('Asia/Kolkata',19,new Date('2026-10-05T13:30:00Z'))==='2026-10-06T13:30:00.000Z');
});
Deno.test('quiet by default and after studying, allowed reminders only', () => {
 const at=new Date('2026-10-05T13:30:00Z'), today=localClock('Asia/Kolkata',at).epochDay;
 assert(compose({},'Asia/Kolkata',at)===null);
 assert(compose({allowStreak:true,streak:4,lastStudyDay:today},'Asia/Kolkata',at)===null);
 assert(compose({allowStreak:true,streak:4,lastStudyDay:today-1},'Asia/Kolkata',at)?.body.includes('streak'));
 assert(compose({allowMcq:true,mcqDay:today-1,mcqPreview:'stale'},'Asia/Kolkata',at)?.body.includes('daily MCQ'));
 assert(!('examName' in cleanDigest({examName:'private',allowExam:'true'})));
 assert(cleanDigest({allowExam:'true'}).allowExam===false);
});
Deno.test('push endpoints cannot send to arbitrary servers or credential URLs', () => {
 const value=(endpoint:string)=>({endpoint,keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}});
 assert(validSubscription(value('https://fcm.googleapis.com/fcm/send/example')));
 assert(validSubscription(value('https://web.push.apple.com/Qexample')));
 for(const endpoint of ['http://fcm.googleapis.com/a','https://fcm.googleapis.com.evil.test/a','https://127.0.0.1/a','https://user:pass@fcm.googleapis.com/a','https://fcm.googleapis.com:444/a']) assert(!validSubscription(value(endpoint)));
 assert(!validSubscription({endpoint:'https://fcm.googleapis.com/a',keys:{p256dh:'bad',auth:'bad'}}));
});
