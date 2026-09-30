import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const client = await fs.readFile('src/integrations/supabase/client.ts', 'utf8');
const url = client.match(/const SUPABASE_URL = "([^"]+)"/)?.[1];
const key = client.match(/const SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
assert.ok(url && key, 'Public client configuration missing');
const cases = [
  ['nickname-suggest', {}, 200, 'invalid-token-audit-fixture'],
  ['play-verify-purchase', {}, 400],
  ['ask-gemini', {}, 200],
  ['quiz-from-subtopic', {}, 400],
  ['generate-handwritten-notes', {}, 400],
  ['generate-flashcards', {}, 400],
  ['tag-diagram-questions', {}, 401],
  ['generate-svg-diagram', {}, 401],
  ['generate-ai-diagram', {}, 401],
  ['ingest-textbook-sign', {}, 410],
  ['migrate-textbooks', {}, 410],
  ['generate-handwritten-notes', {
    subtopicKey:'security-audit-guest-no-write',year:'first',subject:'Anatomy',
    subtopicName:'Audit fixture',questions:['Audit fixture'],saveContent:true,
    content:{highYieldTip:'Audit fixture',pyqYears:[],sections:[]}
  }, 200],
];
// Validations and visitor no-write path only: no paid model calls, no saved data.
for (const [slug, body, status, bearer = key] of cases) {
  const response = await fetch(url + '/functions/v1/' + slug, {
    method:'POST',headers:{authorization:'Bearer '+bearer,apikey:key,'content-type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(30000),
  });
  assert.equal(response.status,status,slug+' status');
  const result=await response.json();
  if(slug==='nickname-suggest') assert.ok(Array.isArray(result.names) && result.names.length > 0);
  else if(slug==='generate-handwritten-notes' && body.saveContent) assert.equal(result.saved,false);
  else assert.ok(result.error,slug+' must reject fixture without generation');
  console.log('PASS '+slug+' '+status);
}
console.log('12 live validation/no-write cases passed');
