import https from 'node:https';

const SUPABASE_URL = "pmtgeydtqypwrypshhsx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";

function hashKey(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const question = "Aetiology, clinical features, investigations and management of Acute Myocardial Infarction. (Page No: 120)*****";
const clean = question.trim();
const subjectKey = "general-medicine";
const subtopicKey = `single::${subjectKey}::${hashKey(clean)}`;

const payload = JSON.stringify({
  subtopicKey,
  year: "Final Year",
  subject: "General Medicine",
  subtopicName: clean.slice(0, 80),
  questions: [clean],
  singleMode: true,
  regenerate: false
});

const req = https.request({
  hostname: SUPABASE_URL,
  path: '/functions/v1/generate-handwritten-notes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const data = JSON.parse(body);
      console.log('Response keys:', Object.keys(data));
      if (data.content) {
        console.log('High yield tip:', data.content.highYieldTip);
        console.log('Sections count:', data.content.sections?.length);
      } else {
        console.log('Body:', body.slice(0, 300));
      }
    } catch (e) {
      console.log('Raw body:', body.slice(0, 300));
    }
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
