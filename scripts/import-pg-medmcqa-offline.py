#!/usr/bin/env python3
"""Build a *labelled*, not independently verified, offline MedMCQA practice set.

Default: validation split ONLY, currently 4,183 historical NEET-PG-labelled
benchmark questions. No exam year is fabricated. No answers for the 6,150
AIIMS-PG test entries are invented. This script does not ingest paid PDFs.

The MedMCQA authors publish their repository under Apache-2.0. Respect the
underlying materials' rights, preserve attribution, and show dataset-label
limitations in the app. Source content is copied only to the generated local
app build via the explicit CI path; never to Supabase.
"""
import argparse
import json
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq

SOURCE_URL = "https://huggingface.co/datasets/openlifescienceai/medmcqa"
LICENSE_URL = "https://github.com/medmcqa/medmcqa/blob/main/LICENSE"
LABEL_EVIDENCE = "MedMCQA dataset label; not independently verified by ORBIT"
LICENSE_EVIDENCE = (
    "Dataset distributed by MedMCQA authors under Apache License 2.0. "
    "Source: " + LICENSE_URL + ". Underlying third-party items need rights review."
)

def to_record(row: dict, split: str):
    cop = row.get("cop")
    if cop not in (0, 1, 2, 3):
        return None
    options = [str(row.get(key) or "").strip() for key in ("opa", "opb", "opc", "opd")]
    question = str(row.get("question") or "").strip()
    if len(question) < 9 or not all(options):
        return None
    qid = str(row.get("id") or "").strip()
    if not qid:
        return None
    return {
        "id": f"medmcqa-{split}-{qid}",
        "question": question,
        "opa": options[0], "opb": options[1],
        "opc": options[2], "opd": options[3],
        "answer": "ABCD"[cop],
        "explanation": str(row.get("exp") or "").strip(),
        "subject": str(row.get("subject_name") or "General").strip(),
        "topic": str(row.get("topic_name") or "").strip(),
        "exam": "NEET_PG" if split == "validation" else "GENERAL_MEDICAL",
        "exam_year": None,
        "exam_session": None,
        "record_type": "historical_dataset",
        "source_id": "medmcqa",
        "source_url": SOURCE_URL,
        "answer_reference": LABEL_EVIDENCE,
        "status": "dataset_label",  # NOT approved as a clinically verified PYQ
        "reuse_status": "licensed",
        "rights_evidence": LICENSE_EVIDENCE,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", choices=["validation", "train"], default="validation")
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    input_path = hf_hub_download(repo_id="openlifescienceai/medmcqa",
                                 repo_type="dataset",
                                 filename=f"data/{args.split}-00000-of-00001.parquet")
    pf = pq.ParquetFile(input_path)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    seen = set()
    count = missing = no_explanation = 0
    with args.output.open("w", encoding="utf-8") as fh:
        for batch in pf.iter_batches(batch_size=2048):
            for r in batch.to_pylist():
                item = to_record(r, args.split)
                if item is None:
                    missing += 1
                    continue
                if item["id"] in seen:
                    raise RuntimeError("Duplicate dataset ID " + item["id"])
                seen.add(item["id"])
                if len(item["explanation"]) < 20:
                    no_explanation += 1
                fh.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")
                count += 1
    print(json.dumps({"split": args.split, "question_count":count,
                     "missing_or_invalid":missing,
                     "no_sufficient_explanation":no_explanation,
                     "source":SOURCE_URL}, indent=2),flush=True)
    if args.split == "validation" and count != 4183:
        raise RuntimeError(f"Unexpected validation count {count}; review dataset revision")
    if count == 0:
        raise RuntimeError("Dataset fetch yielded zero rows")

if __name__ == "__main__":
    main()
