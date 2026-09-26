import { createClient } from 'npm:@supabase/supabase-js@2';

// A 42-slot pool per year and kind. A slot is generated once for everyone,
// then reused on future rotations without calling Gemini again.
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const model = 'gemini-3.1-flash-lite';
const imagePrefix = 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/';
const labels: Record<string, string> = { 'first-year': 'First Year', 'second-year': 'Second Year', 'third-year': 'Third Year', 'final-year': 'Final Year' };
const poolSize = 42;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
type Card = { question: string; options: string[]; correctIndex: number; explanation: string; subject: string; sourceQuestion: string; imageUrl?: string };

async function loadPicture(url: string) {
  if (!url.startsWith(imagePrefix)) throw new Error('Unexpected diagram URL');
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const mime = response.headers.get('content-type')?.split(';')[0] ?? '';
  const length = Number(response.headers.get('content-length') ?? 0);
  if (!response.ok || !['image/png', 'image/jpeg', 'image/webp'].includes(mime) || length > 3_000_000) throw new Error('Diagram unavailable');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 3_000_000) throw new Error('Diagram too large');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { inlineData: { mimeType: mime, data: btoa(binary) } };
}

async function generate(year: string, kind: string, slot: number): Promise<Card> {
  const base = () => db.from('question_diagrams').select('id,subject,question_text,public_url', { count: 'exact' })
    .eq('year', labels[year]).eq('status', 'approved').eq('reviewed', true).not('public_url', 'is', null);
  const { count, error } = await base().limit(1);
  if (error || !count) throw new Error('No reviewed diagrams for this year');
  const parts: Array<Record<string, unknown>> = [];
  let row: { subject: string; question_text: string; public_url: string } | null = null;
  for (let attempt = 0; attempt < Math.min(6, count); attempt++) {
    const position = (slot * 17 + (kind === 'picture' ? 7 : 0) + attempt) % count;
    const picked = await base().order('id').range(position, position);
    if (picked.error || !picked.data?.[0]) continue;
    const candidate = picked.data[0];
    if (kind === 'picture') {
      try { parts.push(await loadPicture(candidate.public_url)); }
      catch { continue; }
    }
    row = candidate;
    break;
  }
  if (!row) throw new Error('Could not load a reviewed diagram');
  parts.push({ text: `You are an undergraduate medical examiner. Create ONE accurate single-best-answer MCQ for ${labels[year]} MBBS.
Subject: ${row.subject}. Study topic: ${row.question_text.slice(0, 700)}.
${kind === 'picture' ? 'The student sees the attached diagram. Test something visible in that image; do not assume details not visible.' : 'Test one concrete concept in the study topic.'}
Use exactly four concise options, one unequivocal correctIndex from 0 to 3, and a short teaching explanation. Return JSON only.` });
  const responseSchema = { type: 'OBJECT', properties: {
    question: { type: 'STRING' }, options: { type: 'ARRAY', items: { type: 'STRING' } },
    correctIndex: { type: 'INTEGER' }, explanation: { type: 'STRING' },
  }, required: ['question', 'options', 'correctIndex', 'explanation'] };
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Gemini key is not configured');
  const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: {
      temperature: 0.25, responseMimeType: 'application/json', responseSchema, maxOutputTokens: 700,
    } }),
  });
  if (!result.ok) throw new Error(`Gemini status ${result.status}`);
  const data = await result.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('') ?? '';
  const card = JSON.parse(content);
  if (typeof card.question !== 'string' || card.question.length < 10 || card.question.length > 250 ||
      !Array.isArray(card.options) || card.options.length !== 4 ||
      !card.options.every((value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 120) ||
      !Number.isInteger(card.correctIndex) || card.correctIndex < 0 || card.correctIndex > 3 ||
      typeof card.explanation !== 'string' || card.explanation.length < 5 || card.explanation.length > 350) {
    throw new Error('Gemini returned an incomplete daily question');
  }
  return { question: card.question, options: card.options, correctIndex: card.correctIndex,
    explanation: card.explanation, subject: row.subject, sourceQuestion: row.question_text,
    ...(kind === 'picture' ? { imageUrl: row.public_url } : {}) };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const { year, kind, date } = input;
  if (typeof year !== 'string' || !labels[year] || (kind !== 'mcq' && kind !== 'picture') ||
      typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Invalid daily request.' }, 400);
  const day = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date ||
      Math.abs(day - Date.now()) > 2 * 86400_000) return json({ error: 'Invalid study date.' }, 400);
  const slot = Math.floor(day / 86400_000) % poolSize;
  const identity = { year, kind, slot };
  let claim = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data: existing, error } = await db.from('daily_study_cards').select('status,card,claim_token,claimed_at').match(identity).maybeSingle();
    if (error) return json({ error: 'Daily cards are temporarily unavailable.' }, 503);
    if (existing?.status === 'ready' && existing.card) return json(existing.card);
    if (!existing) {
      const token = crypto.randomUUID();
      const { error: insertError } = await db.from('daily_study_cards').insert({ ...identity, claim_token: token, status: 'generating' });
      if (!insertError) { claim = token; break; }
    } else if (Date.now() - Date.parse(existing.claimed_at) > 90_000) {
      const token = crypto.randomUUID();
      const { data: won } = await db.from('daily_study_cards').update({ claim_token: token, claimed_at: new Date().toISOString() })
        .match(identity).eq('claim_token', existing.claim_token).eq('status', 'generating').select('claim_token');
      if (won?.length) { claim = token; break; }
    }
    await sleep(750);
  }
  if (!claim) return json({ error: 'Today’s question is being prepared. Please retry shortly.' }, 503);
  try {
    const card = await generate(year, kind, slot);
    const { data: saved, error } = await db.from('daily_study_cards')
      .update({ card, image_url: card.imageUrl ?? null, status: 'ready' })
      .match(identity).eq('claim_token', claim).select('card').single();
    if (error || !saved) throw new Error('Could not store shared daily card');
    return json(card);
  } catch (error) {
    console.error('daily-study-card generation failed', error);
    await db.from('daily_study_cards').delete().match(identity).eq('claim_token', claim);
    return json({ error: 'Could not prepare today’s question. Please retry later.' }, 503);
  }
});
