#!/usr/bin/env python3
"""Build a *labelled*, not independently verified, offline MedMCQA practice set.

Default: validation split ONLY, currently 4,183 historical NEET-PG-labelled
benchmark questions. No exam year is fabricated. No answers for the 6,150
AIIMS-PG test entries are invented. This script does not ingest paid PDFs.

The Hugging Face dataset card declares Apache-2.0; the original repository
LICENSE.md is MIT (code licensing is not proof of every question’s rights). Respect the
underlying materials' rights, preserve attribution, and show dataset-label
limitations in the app. Source content is copied only to the generated local
app build via the explicit CI path; never to Supabase.
"""
import argparse
import json
import sys
from pathlib import Path

from pg_source_quality import preflight

def resolve_revision(requested):
    from huggingface_hub import HfApi
    sha = HfApi().dataset_info("openlifescienceai/medmcqa", revision=requested).sha
    if not sha or len(sha) != 40 or any(c not in "0123456789abcdef" for c in sha.lower()):
        raise RuntimeError("Dataset revision did not resolve to an immutable commit")
    return sha

def download_rows(split, revision):
    from huggingface_hub import hf_hub_download
    import pyarrow.parquet as pq
    path = hf_hub_download(repo_id="openlifescienceai/medmcqa", repo_type="dataset",
                           revision=revision, filename=f"data/{split}-00000-of-00001.parquet")
    return [row for batch in pq.ParquetFile(path).iter_batches(batch_size=2048) for row in batch.to_pylist()]

SOURCE_URL = "https://huggingface.co/datasets/openlifescienceai/medmcqa"
LICENSE_URL = "https://github.com/medmcqa/medmcqa/blob/main/LICENSE.md"
LABEL_EVIDENCE = "MedMCQA dataset label; not independently verified by ORBIT"
LICENSE_EVIDENCE = (
    "Hugging Face dataset card declares Apache-2.0: " + SOURCE_URL + "/blob/main/README.md. "
    "Original repository LICENSE.md is MIT; this describes repository licensing, "
    "not independent clearance of every underlying exam question: " + LICENSE_URL + "."
)

def to_record(row: dict, split: str, revision=None):
    cop = row.get("cop")
    valid_cop = isinstance(cop, int) and not isinstance(cop, bool) and cop in (0, 1, 2, 3)
    options = [str(row.get(key) or "").strip() for key in ("opa", "opb", "opc", "opd")]
    question = str(row.get("question") or "").strip()
    qid = str(row.get("id") or "").strip()
    return {
        "id": f"medmcqa-{split}-{qid}" if qid else "",
        "question": question,
        "opa": options[0], "opb": options[1],
        "opc": options[2], "opd": options[3],
        "answer": "ABCD"[cop] if valid_cop else "",
        "answer_format": "single_label",
        "source_choice_type": row.get("choice_type"),
        "explanation": str(row.get("exp") or "").strip(),
        "subject": str(row.get("subject_name") or "General").strip(),
        "topic": str(row.get("topic_name") or "").strip(),
        "exam": "NEET_PG" if split == "validation" else "GENERAL_MEDICAL",
        "exam_year": None,
        "exam_session": None,
        "record_type": "historical_dataset",
        "source_id": "medmcqa",
        "source_url": SOURCE_URL + ("/tree/" + revision if revision else ""),
        "source_revision": revision,
        "source_data_url": SOURCE_URL + "/resolve/" + (revision or "main") + f"/data/{split}-00000-of-00001.parquet",
        "answer_reference": LABEL_EVIDENCE,
        "status": "dataset_label",  # NOT approved as a clinically verified PYQ
        "reuse_status": "licensed",
        "rights_evidence": LICENSE_EVIDENCE,
    }

def transform_rows(rows, split, revision=None):
    return preflight([to_record(row, split, revision) for row in rows])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", choices=["validation", "train"], default="validation")
    ap.add_argument("--revision", default="main", help="Resolved once to immutable source commit")
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    resolved = resolve_revision(args.revision)
    items, report = transform_rows(download_rows(args.split, resolved), args.split, resolved)
    report.update(split=args.split, requested_revision=args.revision, resolved_revision=resolved,
                  source=SOURCE_URL, no_sufficient_explanation=sum(len(q['explanation']) < 20 for q in items))
    if args.split == "validation" and report['raw'] != 4183:
        raise RuntimeError(f"Unexpected raw validation count {report['raw']}; review dataset revision")
    if not items:
        raise RuntimeError("Dataset fetch yielded zero usable rows")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as fh:
        for item in items:
            fh.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps(report, indent=2), flush=True)

if __name__ == "__main__":
    main()
