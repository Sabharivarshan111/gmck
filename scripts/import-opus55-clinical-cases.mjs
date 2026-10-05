#!/usr/bin/env node
/**
 * Stream the Opus 5.5 doctor-patient dataset into ORBIT's review queue.
 *
 * Safety / licensing rules:
 * - raw data is never bundled into the mobile/web client;
 * - every imported record starts as review_status='pending';
 * - the mobile app's RLS policy exposes only review_status='approved';
 * - set OPUS55_LICENSE_ACK=1 only after confirming the redistribution terms.
 *
 * Required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPUS55_LICENSE_ACK=1
 *
 * Optional:
 *   OPUS55_DATASET_URL
 *   OPUS55_EXPECTED_SHA256
 *   OPUS55_LIMIT=20
 *   OPUS55_DRY_RUN=1
 */
import { createHash } from 'node:crypto';

const DATASET =
  'nisten/opus5-5-doctor-patient-conversations-all-human-diseases';
const DEFAULT_URL =
  'https://huggingface.co/datasets/nisten/opus5-5-doctor-patient-conversations-all-human-diseases/resolve/main/opus5-5diseaseconversations.jsonl?download=true';
const DEFAULT_SHA256 =
  'f828c30cee7006a3cf5b88909f9b865688f98b11d4c886108b9b9a39e5402e0b';

const url = process.env.OPUS55_DATASET_URL || DEFAULT_URL;
const expectedSha = (process.env.OPUS55_EXPECTED_SHA256 || DEFAULT_SHA256).toLowerCase();
const dryRun = process.env.OPUS55_DRY_RUN === '1';
const limit = Number(process.env.OPUS55_LIMIT || 0);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.OPUS55_LICENSE_ACK !== '1') {
  throw new Error(
    'Import blocked: set OPUS55_LICENSE_ACK=1 only after resolving/accepting the dataset license and provenance terms.',
  );
}
if (!dryRun && (!supabaseUrl || !serviceKey)) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required unless OPUS55_DRY_RUN=1.');
}

const REQUIRED_KEYS = [
  '_type',
  'name',
  'aliases',
  'search',
  'description',
  'related_drugs',
  'drug_interactions',
  'food_interactions',
  'pubmed_refs',
  'icd10',
  'prevalence',
  'body_systems',
  'source_disease',
  'clinician_persona',
  'patient_scenario',
  'conversation',
  'common_mistakes',
  'differential_diagnosis',
  'related_diseases',
  'executive_summary',
];

function strings(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function objects(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
}

function validate(record, lineNo) {
  const missing = REQUIRED_KEYS.filter(key => !(key in record));
  if (missing.length) throw new Error(`line ${lineNo}: missing ${missing.join(', ')}`);
  if (record._type !== 'disease_chatml') throw new Error(`line ${lineNo}: unexpected _type`);
  if (typeof record.name !== 'string' || !record.name.trim()) {
    throw new Error(`line ${lineNo}: empty disease name`);
  }
  if (typeof record.patient_scenario !== 'string' || record.patient_scenario.length < 20) {
    throw new Error(`line ${lineNo}: invalid patient_scenario`);
  }
  const conversation = objects(record.conversation);
  if (conversation.length < 15) throw new Error(`line ${lineNo}: conversation too short`);
  if (
    conversation.some(
      turn =>
        typeof turn.role !== 'string' ||
        typeof turn.content !== 'string' ||
        !turn.content.trim(),
    )
  ) {
    throw new Error(`line ${lineNo}: malformed conversation turn`);
  }
}

function normalizedName(name) {
  return name
    .split('|')[0]
    .trim()
    .replace(/\s+/g, ' ');
}

function rowFrom(record, sha) {
  const canonical = normalizedName(record.name);
  const aliases = Array.from(
    new Set([
      ...strings(record.aliases),
      ...record.name.split('|').slice(1).map(part => part.trim()).filter(Boolean),
    ]),
  );
  const searchTerms = strings(record.search);
  const bodySystems = strings(record.body_systems);
  const searchText = [
    canonical,
    record.name,
    ...aliases,
    ...searchTerms,
    typeof record.icd10 === 'string' ? record.icd10 : '',
    ...bodySystems,
    typeof record.description === 'string' ? record.description : '',
    typeof record.patient_scenario === 'string' ? record.patient_scenario : '',
    typeof record.executive_summary === 'string' ? record.executive_summary : '',
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return {
    source_dataset: DATASET,
    source_record_name: record.name,
    canonical_name: canonical,
    aliases,
    search_terms: searchTerms,
    search_text: searchText,
    icd10: typeof record.icd10 === 'string' && record.icd10.trim() ? record.icd10.trim() : null,
    body_systems: bodySystems,
    description: typeof record.description === 'string' ? record.description : null,
    prevalence: typeof record.prevalence === 'string' ? record.prevalence : null,
    patient_scenario: record.patient_scenario,
    conversation: objects(record.conversation),
    common_mistakes: objects(record.common_mistakes),
    differential_diagnosis: objects(record.differential_diagnosis),
    related_diseases: objects(record.related_diseases),
    executive_summary:
      typeof record.executive_summary === 'string' ? record.executive_summary : null,
    pubmed_refs: objects(record.pubmed_refs),
    related_drugs: objects(record.related_drugs),
    drug_interactions: objects(record.drug_interactions),
    food_interactions: objects(record.food_interactions),
    source_sha256: sha,
    source_license:
      'Apache-2.0 in Hugging Face metadata; README also says MIT. Seed/source provenance must be retained.',
    review_status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
  };
}

async function upsert(batch) {
  if (!batch.length || dryRun) return;
  const endpoint =
    `${supabaseUrl}/rest/v1/clinical_dataset_cases?on_conflict=source_dataset,source_record_name`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    throw new Error(`Supabase upsert failed (${res.status}): ${await res.text()}`);
  }
}

const response = await fetch(url, { redirect: 'follow' });
if (!response.ok || !response.body) {
  throw new Error(`Dataset download failed (${response.status})`);
}

const hash = createHash('sha256');
const decoder = new TextDecoder();
const reader = response.body.getReader();
let buffer = '';
let lineNo = 0;
let accepted = 0;
let batch = [];
const staged = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  hash.update(value);
  buffer += decoder.decode(value, { stream: true });

  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    lineNo += 1;
    const record = JSON.parse(line);
    validate(record, lineNo);
    staged.push(record);
    if (limit && staged.length >= limit) {
      await reader.cancel();
      buffer = '';
      break;
    }
  }
  if (limit && staged.length >= limit) break;
}

if (buffer.trim() && (!limit || staged.length < limit)) {
  lineNo += 1;
  const record = JSON.parse(buffer.trim());
  validate(record, lineNo);
  staged.push(record);
}

const digest = hash.digest('hex');
if (!limit && expectedSha && digest !== expectedSha) {
  throw new Error(`SHA256 mismatch. Expected ${expectedSha}, got ${digest}. Refusing import.`);
}
if (limit) {
  console.warn('OPUS55_LIMIT is set: SHA256 cannot validate a partial download.');
}

for (const record of staged) {
  batch.push(rowFrom(record, limit ? expectedSha : digest));
  if (batch.length >= 20) {
    await upsert(batch);
    accepted += batch.length;
    batch = [];
    console.log(`staged/imported ${accepted}`);
  }
}
await upsert(batch);
accepted += batch.length;

console.log(
  JSON.stringify(
    {
      dataset: DATASET,
      records: accepted,
      dryRun,
      sha256: limit ? 'partial-download-not-verified' : digest,
      reviewStatus: 'pending',
    },
    null,
    2,
  ),
);
