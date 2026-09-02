---
name: triple-tap-pregen
description: Autonomous pre-generation of textbook-grounded handwritten notes into Supabase cache across MBBS subjects and years with Gemini 3.1 Flash-Lite rate limit protection.
---

# Autonomous Triple-Tap Note Pre-Generation Skill

Use this skill when you need to batch pre-generate textbook-grounded handwritten notes for all previous year university questions in any MBBS subject or year, ensuring 100% instant cache hits when students triple-tap questions in the mobile or web app.

## Engine Architecture

- **Script**: `scripts/auto_generate_triple_tap_notes.mjs`
- **Cache Table**: `handwritten_notes` in Supabase (`pmtgeydtqypwrypshhsx`)
- **Key Hash Algorithm**: `single::<subjectKey>::<hashKey>`
- **Edge Function**: `generate-handwritten-notes` with `gemini-3.1-flash-lite`

## Pacing & Rate Limit Protection (Gemini 3.1 Flash-Lite)

- **Free Tier Constraint**: ~15 Requests Per Minute (RPM).
- **Execution Pace**: 4.5 seconds between generations (~12-13 RPM), safe under 15 RPM.
- **Quota Pause & Backoff**: Automatically catches HTTP 429 quota exhaustion, pauses for the server's `retryAfterSeconds` (or default 35s), and resumes with jitter.
- **Bulk Cache Bypass**: Pre-queries Supabase for existing `single::<subjectKey>::*` keys and skips cached questions immediately.

## State Persistence & Auto-Resume Memory

- **Checkpoint File**: `scripts/pre_gen_state.json`
- **What is Remembered**:
  - Exact last processed question index & question string.
  - Completed note count and failed count.
  - Overall status (`in-progress`, `rate-limited-paused`, or `completed`).
- **Resuming Next Day / After Rate Limit**:
  - The script automatically reads the checkpoint file and queries Supabase cache on startup.
  - Any previously generated questions are skipped with zero delay and zero token cost.
  - Generation picks up right from where it left off.
- **Checking Progress at Any Time**:
  ```bash
  node scripts/auto_generate_triple_tap_notes.mjs --status
  ```

## Running the Pre-Generation Engine

### 1. General Medicine (Final Year)
```bash
node scripts/auto_generate_triple_tap_notes.mjs --subject general-medicine --year final-year
```

### 2. General Surgery (Final Year)
```bash
node scripts/auto_generate_triple_tap_notes.mjs --subject general-surgery --year final-year
```

### 3. Check Live Status & Checkpoint Memory
```bash
node scripts/auto_generate_triple_tap_notes.mjs --status
```

### 3. Obstetrics & Gynaecology (Final Year)
```bash
node scripts/auto_generate_triple_tap_notes.mjs --subject obstetrics-gynaecology --year final-year
```

### 4. Any Subject / Year
```bash
node scripts/auto_generate_triple_tap_notes.mjs --subject <subject-key> --year <year-key>
```
Supported Years: `first-year`, `second-year`, `third-year`, `final-year`.

### 5. Running with Question Limit (e.g. Test / Daily Batch)
```bash
node scripts/auto_generate_triple_tap_notes.mjs --subject general-medicine --year final-year --limit 50
```
