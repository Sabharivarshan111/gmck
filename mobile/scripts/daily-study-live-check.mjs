import fs from 'node:fs';

// The anon key is the same public key bundled with the app. The Gemini key is server-side.
const source = fs.readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8');
const anon = source.match(/'eyJhbGciOi[^']+'/)?.[0]?.slice(1, -1);
if (!anon) throw new Error('Could not read the public Supabase anon key');
const endpoint = 'https://pmtgeydtqypwrypshhsx.supabase.co/functions/v1/daily-study-card';
for (const [kind, body] of [
  ['mcq', { kind: 'mcq', year: 'second-year', date: new Date().toISOString().slice(0, 10) }],
  ['picture', { kind: 'picture', year: 'second-year', date: new Date().toISOString().slice(0, 10) }],
]) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
    body: JSON.stringify(body), signal: globalThis.AbortSignal.timeout(55000),
  });
  const data = await response.json();
  if (!response.ok || typeof data.question !== 'string' || !Array.isArray(data.options) || data.options.length !== 4 ||
      !Number.isInteger(data.correctIndex) || data.correctIndex < 0 || data.correctIndex > 3 || !data.explanation) {
    throw new Error(`${kind} live check failed (${response.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  console.log(`${kind} generated: ${data.question}`);
}
