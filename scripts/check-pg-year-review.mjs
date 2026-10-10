#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const bank=read("mobile/src/lib/pgEntranceBank.ts");
const ui=read("mobile/src/components/PgEntranceBankModal.tsx");
const form=read("mobile/src/components/PgRecentAnswerReview.tsx");
const server=read("supabase/functions/pg-answer-review/index.ts");
const manifest=read("mobile/src/lib/pgPacks/generatedManifest.ts");
const m=bank.match(/PG_SOURCES: PgSource\[\] = (\[[\s\S]*?\]);\s*export const PG_ORIGINAL_PRACTICE/);
assert.ok(m,"Source array remains JSON-parseable");
const sources=JSON.parse(m[1]);
const exams=["NEET_PG","INI_CET","FMGE"];
for(const exam of exams){
  for(let year=2023;year<=2026;year++){
    const matches=sources.filter(s=>s.exam===exam && s.from<=year && s.to>=year);
    assert.ok(matches.length, "Missing external source for "+exam+" "+year);
    for(const s of matches) {
      assert.match(s.url,/^https:\/\//,"Source URL must be HTTPS");
      assert.ok(s.kind!=="Official key","Never declare all recall sources official");
    }
  }
}
assert.match(ui,/PgRecentAnswerReview/);
assert.match(ui,/setYearText\(String\(y\)\)/);
assert.match(form,/supabase\.functions\.invoke\('pg-answer-review'/);
assert.match(form,/Sign in with Google first/);
assert.match(form,/independently verified/);
assert.match(server,/auth\.auth\.getUser\(token\)/);
assert.match(server,/consume_edge_quota/);
assert.match(server,/buildTextbookContext/);
assert.match(server,/source_year_verified:false/);
assert.match(server,/independently_medically_reviewed:false/);
assert.match(server,/answer:"UNRESOLVED"/);
assert.ok(!server.includes("verify_jwt: false"),"Do not allow anonymous unmetered textbook requests");
const total=[...manifest.matchAll(/count: (\d+), load:/g)].reduce((sum,x)=>sum+Number(x[1]),0);
assert.equal(total,4180,"Historic pack remains intact");
assert.match(read("scripts/import-pg-medmcqa-offline.py"),/\"exam_year\": None/);
console.log(JSON.stringify({
  recent_source_coverage:exams.flatMap(exam=>
    [2023,2024,2025,2026].map(year=>({exam,year,
      count:sources.filter(s=>s.exam===exam&&s.from<=year&&s.to>=year).length}))),
  bundled_medmcqa_questions:total,
  individually_verified_dataset_years:0,
  added_2023_to_2026_official_exams:0,
  supabase_answer_review:"JWT required, review labelled provisional, server-side textbooks",
  source_papers_redistributed:false
},null,2));
