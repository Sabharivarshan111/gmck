#!/usr/bin/env node

/**
 * Autonomous Pre-Generation Engine for Orbit MBBS Handwritten Notes
 *
 * Automatically "triple-taps" and pre-generates textbook-grounded handwritten
 * notes for all past university exam questions in a subject, saving them
 * into Supabase's `handwritten_notes` table.
 *
 * Pacing & Rate Limit Protection:
 * - Gemini 3.1 Flash-Lite free tier is ~15 RPM.
 * - This engine runs at a safe ~12-13 RPM (4.5s interval).
 * - Automatic exponential backoff on HTTP 429 quota limits.
 * - Upfront bulk-cache check: questions already generated are skipped instantly.
 * - Persistent State Checkpointing: Stores exact index and last generated question
 *   in `scripts/pre_gen_state.json` so you can seamlessly resume the next day.
 *
 * Usage:
 *   node scripts/auto_generate_triple_tap_notes.mjs
 *   node scripts/auto_generate_triple_tap_notes.mjs --subject general-medicine --year final-year
 *   node scripts/auto_generate_triple_tap_notes.mjs --subject general-surgery --year final-year
 *   node scripts/auto_generate_triple_tap_notes.mjs --limit 50
 *   node scripts/auto_generate_triple_tap_notes.mjs --status
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { build } from 'esbuild';

const SUPABASE_URL = "pmtgeydtqypwrypshhsx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U";

const STATE_FILE = path.join(process.cwd(), 'scripts', 'pre_gen_state.json');
const BASE_DELAY_MS = 4500; // 4.5 seconds between generations (~13.3 RPM, safe under 15 RPM)
const MAX_RETRIES = 5;

let activeState = null;

function hashKey(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      version: 1,
      lastRunAt: new Date().toISOString(),
      subjects: {}
    };
  }
}

async function saveState(state) {
  try {
    state.lastRunAt = new Date().toISOString();
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[state save error]:`, e.message);
  }
}

function registerSignalHandlers() {
  const flushAndExit = async (sig) => {
    console.log(`\n\n🛑 Caught ${sig}. Saving checkpoint state to ${STATE_FILE}...`);
    if (activeState) {
      await saveState(activeState);
      console.log(`💾 Checkpoint saved. You can safely resume next time!`);
    }
    process.exit(0);
  };
  process.on('SIGINT', () => flushAndExit('SIGINT'));
  process.on('SIGTERM', () => flushAndExit('SIGTERM'));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    subjects: ['general-medicine', 'general-surgery'],
    year: 'final-year',
    limit: Infinity,
    showStatus: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--subject' && args[i + 1]) {
      options.subjects = [args[i + 1]];
      i++;
    } else if (args[i] === '--year' && args[i + 1]) {
      options.year = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--status') {
      options.showStatus = true;
    } else if (args[i] === '--all-final') {
      options.subjects = ['general-medicine', 'general-surgery', 'obstetrics-gynaecology', 'paediatrics', 'ent', 'ophthalmology'];
      options.year = 'final-year';
    }
  }
  return options;
}

async function extractQuestions(yearKey, subjectKey) {
  const rootDir = process.cwd();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-extract-'));
  const entry = path.join(tmpDir, 'entry.ts');
  const out = path.join(tmpDir, 'out.mjs');

  await fs.writeFile(
    entry,
    `
    import { QUESTION_BANK_DATA } from '${path.join(rootDir, 'src/data/questionBankData.ts')}';
    import { collectQuestions } from '${path.join(rootDir, 'src/lib/question-progress.ts')}';

    export function getSubjectData(yKey, sKey) {
      const yearNode = QUESTION_BANK_DATA[yKey];
      if (!yearNode || !yearNode.subtopics) return { subjectName: sKey, yearName: yKey, questions: [] };
      const subjectNode = yearNode.subtopics[sKey];
      if (!subjectNode) return { subjectName: sKey, yearName: yearNode.name || yKey, questions: [] };
      const essays = collectQuestions(subjectNode, 'essay') || [];
      const shorts = collectQuestions(subjectNode, 'short-notes') || [];
      const unique = Array.from(new Set([...essays, ...shorts])).filter(Boolean);
      return {
        subjectName: subjectNode.name || sKey,
        yearName: yearNode.name || yKey,
        questions: unique,
      };
    }
    `
  );

  await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
  });

  const { getSubjectData } = await import(out);
  const data = getSubjectData(yearKey, subjectKey);
  await fs.rm(tmpDir, { recursive: true, force: true });
  return data;
}

async function fetchCachedKeys(subjectKey) {
  try {
    const url = `https://${SUPABASE_URL}/rest/v1/handwritten_notes?select=subtopic_key&subtopic_key=like.single::${subjectKey}::*`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Range': '0-3000'
      }
    });
    if (!res.ok) return new Set();
    const list = await res.json();
    if (Array.isArray(list)) {
      return new Set(list.map(row => row.subtopic_key));
    }
  } catch (e) {
    console.warn(`[cache fetch warning]:`, e.message);
  }
  return new Set();
}

async function generateSingleNote(subtopicKey, yearName, subjectName, questionText) {
  const clean = questionText.trim();
  const clampedQuestion = clean.length > 950 ? clean.slice(0, 950) : clean;
  const payload = {
    subtopicKey,
    year: yearName,
    subject: subjectName,
    subtopicName: clean.slice(0, 80),
    questions: [clampedQuestion],
    singleMode: true,
    regenerate: false
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(`https://${SUPABASE_URL}/functions/v1/generate-handwritten-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 200) {
      const data = await res.json();
      return { success: true, data, statusCode: 200 };
    }

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        is429: true,
        retryAfter: data.retryAfterSeconds || 35,
        error: data.error || 'Rate limited (429)',
        statusCode: 429
      };
    }

    const errText = await res.text().catch(() => '');
    return {
      success: false,
      error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
      statusCode: res.status
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      error: isTimeout ? 'Request timed out after 90s' : err.message,
      statusCode: 0
    };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function formatDuration(ms) {
  const totalSecs = Math.round(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

async function run() {
  registerSignalHandlers();
  const opts = parseArgs();
  const state = await loadState();
  activeState = state;

  if (opts.showStatus) {
    console.log(`\n📊 Orbit MBBS Note Pre-Generation Status Checkpoint`);
    console.log(`📁 State file: ${STATE_FILE}`);
    console.log(`⏱️ Last run at: ${state.lastRunAt || 'Never'}\n`);
    for (const [key, info] of Object.entries(state.subjects || {})) {
      console.log(`📘 Subject: ${key} (${info.year})`);
      console.log(`   Status: ${info.status}`);
      console.log(`   Progress: ${info.lastProcessedIndex || 0} / ${info.totalQuestions || 0} questions (${info.completedCount || 0} cached)`);
      console.log(`   Last question: "${info.lastQuestion || 'N/A'}"`);
      console.log(`   Last updated: ${info.lastUpdated}\n`);
    }
    return;
  }

  console.log(`\n===============================================================`);
  console.log(`🚀 Orbit MBBS Autonomous Note Pre-Generation Engine`);
  console.log(`📚 Target Subjects: ${opts.subjects.join(', ')} | Year: ${opts.year}`);
  console.log(`⚡ Rate Limit Pacing: ~13 RPM (Safe Gemini 3.1 Flash-Lite)`);
  console.log(`💾 State Persistence: Active -> ${STATE_FILE}`);
  console.log(`===============================================================\n`);

  const startTime = Date.now();
  let totalGenerated = 0;
  let totalFailed = 0;

  for (const subjectKey of opts.subjects) {
    console.log(`\n🔍 Loading questions for: ${subjectKey}...`);
    const { subjectName, yearName, questions } = await extractQuestions(opts.year, subjectKey);
    console.log(`📖 Found ${questions.length} total exam questions in ${subjectName} (${yearName}).`);

    console.log(`🔎 Checking Supabase cache for existing notes...`);
    const cachedSet = await fetchCachedKeys(subjectKey);
    console.log(`💾 Already cached in Supabase: ${cachedSet.size} notes.`);

    const subjectCheckpoint = state.subjects[subjectKey] || {
      year: opts.year,
      totalQuestions: questions.length,
      lastProcessedIndex: 0,
      lastQuestion: '',
      completedCount: cachedSet.size,
      failedCount: 0,
      status: 'pending',
      lastUpdated: new Date().toISOString()
    };
    subjectCheckpoint.totalQuestions = questions.length;
    subjectCheckpoint.completedCount = cachedSet.size;
    state.subjects[subjectKey] = subjectCheckpoint;

    const toProcess = questions.filter(q => {
      const key = `single::${subjectKey}::${hashKey(q.trim())}`;
      return !cachedSet.has(key);
    });

    console.log(`🎯 Remaining to generate: ${toProcess.length} questions.`);
    if (subjectCheckpoint.lastQuestion && toProcess.length > 0) {
      console.log(`🔄 Checkpoint memory: Last handled was "${subjectCheckpoint.lastQuestion.slice(0, 45)}..."`);
    }
    console.log('');

    const batchToRun = toProcess.slice(0, opts.limit);
    let currentInSubject = 0;
    subjectCheckpoint.status = 'in-progress';
    const deferredQueue = [];

    for (const q of batchToRun) {
      currentInSubject++;
      const clean = q.trim();
      const subtopicKey = `single::${subjectKey}::${hashKey(clean)}`;
      const preview = clean.length > 55 ? clean.slice(0, 52) + '...' : clean;

      let attempt = 0;
      let generated = false;

      while (attempt < MAX_RETRIES && !generated) {
        attempt++;
        const res = await generateSingleNote(subtopicKey, yearName, subjectName, clean);

        if (res.success) {
          totalGenerated++;
          generated = true;
          const sectionCount = res.data.content.sections?.length || 0;
          const elapsed = Date.now() - startTime;
          const avgPerItem = elapsed / (totalGenerated || 1);
          const remainingItems = batchToRun.length - currentInSubject + deferredQueue.length;
          const eta = formatDuration(remainingItems * avgPerItem);

          // Update checkpoint in state
          subjectCheckpoint.lastProcessedIndex = questions.indexOf(q) + 1;
          subjectCheckpoint.lastQuestion = clean;
          subjectCheckpoint.completedCount++;
          subjectCheckpoint.lastUpdated = new Date().toISOString();
          subjectCheckpoint.status = 'in-progress';
          await saveState(state);

          console.log(`✅ [${currentInSubject}/${batchToRun.length}] Generated (${sectionCount} sec): "${preview}" | ETA: ${eta}`);
          await sleep(BASE_DELAY_MS);
        } else if (res.is429) {
          const waitTime = (res.retryAfter || 35) + 3;
          console.log(`⏳ [429 Quota Pause] Gemini free-tier pacing. Pausing for ${waitTime}s before retry (Attempt ${attempt}/${MAX_RETRIES})...`);
          
          subjectCheckpoint.status = 'rate-limited-paused';
          subjectCheckpoint.lastUpdated = new Date().toISOString();
          await saveState(state);

          await sleep(waitTime * 1000);
        } else {
          console.warn(`⚠️ [Attempt ${attempt}] Failed for "${preview}": ${res.error}`);
          if (attempt < MAX_RETRIES) {
            await sleep(5000);
          } else {
            console.warn(`📌 [Queued for Retry Pass] Temporarily deferred "${preview}". Will re-attempt after other questions.`);
            deferredQueue.push(q);
          }
        }
      }
    }

    // --- Deferred Retry Passes (Zero-Drop Guarantee) ---
    let pass = 1;
    const MAX_DEFERRED_PASSES = 5;
    while (deferredQueue.length > 0 && pass <= MAX_DEFERRED_PASSES) {
      console.log(`\n🔁 [Deferred Retry Pass ${pass}/${MAX_DEFERRED_PASSES}] Re-attempting ${deferredQueue.length} deferred questions in ${subjectName}...`);
      const currentQueue = [...deferredQueue];
      deferredQueue.length = 0;
      let defIdx = 0;

      for (const q of currentQueue) {
        defIdx++;
        const clean = q.trim();
        const subtopicKey = `single::${subjectKey}::${hashKey(clean)}`;
        const preview = clean.length > 55 ? clean.slice(0, 52) + '...' : clean;
        let attempt = 0;
        let generated = false;

        while (attempt < MAX_RETRIES && !generated) {
          attempt++;
          const res = await generateSingleNote(subtopicKey, yearName, subjectName, clean);

          if (res.success) {
            totalGenerated++;
            generated = true;
            const sectionCount = res.data.content.sections?.length || 0;
            subjectCheckpoint.completedCount++;
            subjectCheckpoint.lastUpdated = new Date().toISOString();
            await saveState(state);

            console.log(`✅ [Retry ${defIdx}/${currentQueue.length}] Generated (${sectionCount} sec): "${preview}"`);
            await sleep(BASE_DELAY_MS);
          } else if (res.is429) {
            const waitTime = (res.retryAfter || 35) + 3;
            console.log(`⏳ [429 Quota Pause] Pausing for ${waitTime}s before retry...`);
            await sleep(waitTime * 1000);
          } else {
            console.warn(`⚠️ [Retry Attempt ${attempt}] Failed for "${preview}": ${res.error}`);
            if (attempt < MAX_RETRIES) await sleep(5000);
          }
        }

        if (!generated) {
          deferredQueue.push(q);
        }
      }
      pass++;
    }

    if (deferredQueue.length === 0 && batchToRun.length === toProcess.length) {
      subjectCheckpoint.status = 'completed';
      console.log(`🎉 100% of questions in ${subjectName} generated and cached (Zero Missed)!`);
    } else if (deferredQueue.length > 0) {
      subjectCheckpoint.failedCount = deferredQueue.length;
      subjectCheckpoint.status = 'pending-retries';
      console.warn(`⚠️ ${deferredQueue.length} questions remaining in retry queue for next session.`);
    }
    await saveState(state);
  }

  const totalTime = formatDuration(Date.now() - startTime);
  console.log(`\n===============================================================`);
  console.log(`🎉 Pre-Generation Batch Complete!`);
  console.log(`⏱️ Total Time Elapsed: ${totalTime}`);
  console.log(`✅ Newly Generated & Cached in Supabase: ${totalGenerated}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`💾 Checkpoint state saved to: ${STATE_FILE}`);
  console.log(`===============================================================\n`);
}

run().catch(console.error);
