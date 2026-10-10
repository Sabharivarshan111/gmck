#!/usr/bin/env python3
"""Compile audited ORBIT PG JSONL into offline Metro/Vite TS chunks.

Usage:
 python scripts/build-pg-offline-packs.py \\
   --input approved.jsonl --out mobile/src/lib/pgPacks --max-compressed-mb 25

Budget is measured using DEFLATE (APK zip-like) and Brotli (web delivery).
No questions are silently dropped. An over-budget pack fails and does not
overwrite a previous successfully built set.
"""
import argparse
import hashlib
import json
import os
import re
import tempfile
import zlib
from collections import defaultdict
from pathlib import Path

try:
    import brotli
except ImportError:
    brotli = None

ALLOWED_EXAMS = {
    "NEET_PG", "INI_CET", "FMGE", "AIIMS_PG", "AIPGMEE",
    "PGIMER_PG", "JIPMER_PG", "GENERAL_MEDICAL"
}
ALLOWED_RECORDS = {"historical_dataset", "verified_pyq", "recalled", "original_exam_style"}
APPROVED = {"licensed", "public_domain", "original"}
MAX_ROWS_PER_PACK = 1000
FILENAME = re.compile(r"[^a-z0-9_]+")

def validate(row):
    if row.get("status") not in ("published", "approved"):
        raise ValueError("Unreviewed row; input must be an approved export")
    if row.get("reuse_status") not in APPROVED or not str(row.get("rights_evidence", "")).strip():
        raise ValueError("Missing verified publication rights")
    if not str(row.get("answer_reference", "")).strip():
        raise ValueError("Missing independent answer verification")
    if row.get("exam") not in ALLOWED_EXAMS or row.get("record_type") not in ALLOWED_RECORDS:
        raise ValueError("Unknown exam or record type")
    if row.get("answer") not in ("A", "B", "C", "D"):
        raise ValueError("Invalid correct option")
    if any(not isinstance(row.get(key), str) or not row[key].strip()
           for key in ("question", "opa", "opb", "opc", "opd", "explanation", "source_url", "id")):
        raise ValueError("Incomplete question/options/explanation/source")
    if len(row["explanation"].strip()) < 20:
        raise ValueError("Missing useful explanation")
    if not row["source_url"].startswith("https://"):
        raise ValueError("Missing HTTPS source")
    y = row.get("exam_year")
    if y is not None and (not isinstance(y, int) or y < 1991 or y > 2026):
        raise ValueError("Invalid exam year")
    if row["record_type"] in ("historical_dataset", "original_exam_style") and y is not None:
        raise ValueError("Unsupported historical / original year attribution")
    if row["record_type"] in ("recalled", "verified_pyq") and y is None:
        raise ValueError("Recalled/verified PYQs need documented year")
    # Avoid storing protected database credentials, unused audit payloads, images,
    # or private notes inside the Android APK / publicly downloadable web JS.
    return row

def pack_rows(items, exam, year):
    sub, topics, urls, refs, types, sessions = ([] for _ in range(6))
    si, ti, ui, ri, vi, ei = ({} for _ in range(6))
    def intern(x, values, keys):
        x = str(x or "")
        if x not in keys:
            keys[x] = len(values)
            values.append(x)
        return keys[x]
    rows = []
    for q in items:
        rows.append([
            q["id"], q["question"], q["opa"], q["opb"], q["opc"], q["opd"],
            "ABCD".index(q["answer"]), q["explanation"],
            intern(q.get("subject"), sub, si),
            intern(q.get("topic"), topics, ti),
            intern(q["source_url"], urls, ui),
            intern(q["answer_reference"], refs, ri),
            intern(q["record_type"], types, vi),
            intern(q.get("exam_session"), sessions, ei)
        ])
    arrays = [json.dumps(arr, ensure_ascii=False, separators=(",", ":"))
              for arr in (sub, topics, urls, refs, types, sessions, rows)]
    # Each imported chunk exports full PgQuestion objects, but compresses repeated
    # field labels and source URLs into small local dictionaries in its source.
    rendered = f'''// Generated offline question asset. Do not hand-edit.
import type {{ PgQuestion }} from '../pgEntranceBank';
const SUBJECTS = {arrays[0]};
const TOPICS = {arrays[1]};
const URLS = {arrays[2]};
const REFERENCES = {arrays[3]};
const RECORD_TYPES = {arrays[4]};
const SESSIONS = {arrays[5]};
const ROWS: (string | number)[][] = {arrays[6]};
const EXAM = {json.dumps(exam)};
const YEAR: number | null = {str(year) if year is not None else "null"};
const data: PgQuestion[] = ROWS.map(r => ({{
  id: String(r[0]), exam: EXAM, year: YEAR,
  question: String(r[1]),
  options: [String(r[2]), String(r[3]), String(r[4]), String(r[5])],
  answer: 'ABCD'[Number(r[6])], explanation: String(r[7]),
  subject: SUBJECTS[Number(r[8])], topic: TOPICS[Number(r[9])],
  source_url: URLS[Number(r[10])],
  answer_reference: REFERENCES[Number(r[11])],
  record_type: RECORD_TYPES[Number(r[12])],
  exam_session: SESSIONS[Number(r[13])],
}));
export default data;
'''
    return rendered

def write_packs(args):
    if not args.input.is_file():
        raise SystemExit("Missing approved JSONL: " + str(args.input))
    grouped = defaultdict(list)
    row_count = 0
    hashes = set()
    with args.input.open(encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            if not line.strip():
                continue
            try:
                item = validate(json.loads(line))
            except (ValueError, TypeError) as ex:
                raise SystemExit(f"Line {i}: {ex}") from ex
            ident = item["id"]
            if ident in hashes:
                raise SystemExit(f"Duplicate question id at line {i}: {ident}")
            hashes.add(ident)
            grouped[(item["exam"], item.get("exam_year"))].append(item)
            row_count += 1

    output = args.out
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="pg-build-", dir=output.parent) as temp:
        target = Path(temp)
        all_specs = []
        deflate_size = 0
        brotli_size = 0
        raw_size = 0
        chunks = 0
        for (exam, year), items in sorted(grouped.items(), key=lambda x: (x[0][0], str(x[0][1]))):
            for index in range(0, len(items), args.rows_per_pack):
                chunk = items[index:index + args.rows_per_pack]
                name = f"{exam.lower()}_{year if year is not None else 'undated'}_{index // args.rows_per_pack:04d}"
                name = FILENAME.sub("", name)
                module = pack_rows(chunk, exam, year)
                buf = module.encode("utf-8")
                (target / (name + ".ts")).write_bytes(buf)
                raw_size += len(buf)
                deflate_size += len(zlib.compress(buf, 9))
                brotli_size += len(brotli.compress(buf, quality=11)) if brotli else 0
                chunks += 1
                all_specs.append(
                    "  { id: " + json.dumps(name) + ", exam: " + json.dumps(exam) +
                    ", year: " + (str(year) if year is not None else "null") +
                    ", count: " + str(len(chunk)) +
                    ", load: () => import('./" + name + "') },"
                )
        manifest = (
            "/** Auto-generated offline manifest. No API calls or runtime fetching. */\n"
            "import type { PgOfflinePack } from '../pgLocalBank';\n"
            "export const GENERATED_PG_PACKS: PgOfflinePack[] = [\n" +
            "\n".join(all_specs) + "\n];\n"
        )
        (target / "generatedManifest.ts").write_text(manifest, encoding="utf-8")
        raw_size += len(manifest.encode())
        deflate_size += len(zlib.compress(manifest.encode(), 9))
        if brotli:
            brotli_size += len(brotli.compress(manifest.encode(), quality=11))

        report = {
            "total_questions": row_count, "chunk_count": chunks,
            "budget_mb": args.max_compressed_mb,
            "raw_mb": round(raw_size / 1_000_000, 3),
            "deflate_mb": round(deflate_size / 1_000_000, 3),
            "brotli_mb": round(brotli_size / 1_000_000, 3) if brotli else None,
            "fits_native_budget": deflate_size <= args.max_compressed_mb * 1_000_000,
            "note": "DEFLATE is a source-assets estimate, not a measured Play Store AAB/APK delta."
        }
        print(json.dumps(report, indent=2))
        if not report["fits_native_budget"]:
            raise SystemExit(
                "OFFLINE BUDGET EXCEEDED: not omitting questions or overwriting prior packs. "
                "Use optional per-exam packs or explicitly raise the size budget."
            )
        (target / "packing-report.json").write_text(json.dumps(report, indent=2) + "\n")
        output.mkdir(parents=True, exist_ok=True)
        for old in output.iterdir():
            if old.name != "README.md" and old.is_file() and (
                old.name == "generatedManifest.ts" or old.suffix == ".ts" or old.name == "packing-report.json"
            ):
                old.unlink()
        for f in target.iterdir():
            os.replace(f, output / f.name)
        return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True, help="Published, cleared JSONL produced by the offline audit pipeline")
    parser.add_argument("--out", type=Path, default=Path("mobile/src/lib/pgPacks"))
    parser.add_argument("--max-compressed-mb", type=float, default=25)
    parser.add_argument("--rows-per-pack", type=int, default=MAX_ROWS_PER_PACK)
    args = parser.parse_args()
    if args.max_compressed_mb <= 0 or args.rows_per_pack < 1 or args.rows_per_pack > 10000:
        parser.error("Budget must be positive; pack size must be 1–10000")
    write_packs(args)
