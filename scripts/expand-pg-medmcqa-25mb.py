#!/usr/bin/env python3
"""Import as many answer-keyed MedMCQA rows as actually available under a firm
compressed pack cap. This is NOT a complete year-labelled PYQ archive.

Always keep question stem + 4 original options + labelled answer + subject and
source for every usable public-labelled 2022-era train/validation record.
Retain full source explanations only as space permits. No invented answer or
exam year, and never import unlabeled AIIMS-PG test rows as solved questions.
"""
import argparse
import importlib.util
import json
import sys
import zlib
from collections import defaultdict
from pathlib import Path
from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq

ROOT=Path(__file__).resolve().parent
def load_module(path,name):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
importer=load_module(ROOT/"import-pg-medmcqa-offline.py","pg_medmcqa_importer")
packer=load_module(ROOT/"build-pg-offline-packs.py","pg_offline_packer")
MAX_BYTES=24_300_000 # margin under the absolute 25MB compressed content budget

def read_split(split):
    filename=f"data/{split}-00000-of-00001.parquet"
    path=hf_hub_download(repo_id="openlifescienceai/medmcqa",
                         repo_type="dataset", filename=filename)
    pf=pq.ParquetFile(path)
    result=[]
    seen=set()
    invalid=[]
    raw_count=0
    for batch in pf.iter_batches(batch_size=3000):
        for row in batch.to_pylist():
            raw_count+=1
            rec=importer.to_record(row,split)
            if rec is None:
                invalid.append(str(row.get("id") or "unknown"))
                continue
            if rec["id"] in seen:
                raise RuntimeError(f"Duplicate source row id {rec['id']}")
            seen.add(rec["id"])
            if split=="train":
                # Source metadata is explicit: train is mock/test series, NOT
                # historical NEET-PG/INI-CET/FMGE exam session material.
                rec["exam"]="GENERAL_MEDICAL"
            result.append(rec)
    return result, {"raw":raw_count,"usable":len(result),
                    "invalid":len(invalid),"sample_invalid_ids":invalid[:10]}

def estimate_bytes(items, per_pack):
    sizes=0
    buckets=defaultdict(list)
    for q in items: buckets[(q["exam"],q.get("exam_year"))].append(q)
    count=0
    for (exam,year),questions in buckets.items():
        for offset in range(0,len(questions),per_pack):
            code=packer.pack_rows(questions[offset:offset+per_pack],exam,year)
            sizes+=len(zlib.compress(code.encode("utf-8"),9))
            count+=1
    # Manifest small but not free; leave margin for it.
    return sizes+count*180,count

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--output",type=Path,required=True)
    ap.add_argument("--report",type=Path,required=True)
    ap.add_argument("--rows-per-pack",type=int,default=2500)
    ap.add_argument("--budget-mb",type=float,default=24.3)
    args=ap.parse_args()
    if args.rows_per_pack < 500 or args.rows_per_pack > 10000:
        ap.error("pack size must be 500–10000")
    budget=min(int(args.budget_mb*1_000_000),MAX_BYTES)
    validation,vr=read_split("validation")
    training,tr=read_split("train")
    print("SOURCE ACCOUNTING",json.dumps({"validation":vr,"train":tr}),flush=True)
    if vr["raw"]!=4183 or tr["raw"]!=182822:
        raise RuntimeError("Dataset unexpectedly changed; review upstream before importing")
    # All usable questions/answers/options are retained. Validation source
    # explanations take precedence over training/mock explanations.
    saved={}
    for q in training:
        if len(q["explanation"].strip())>=20:
            saved[q["id"]]=q["explanation"]
        q["explanation"]=""
    all_rows=validation+training
    base,pack_count=estimate_bytes(all_rows,args.rows_per_pack)
    print(f"ALL {len(all_rows)} LABELLED QUESTION STEMS+OPTIONS+ANSWERS base={base/1e6:.2f} MB",flush=True)
    if base>budget:
        raise RuntimeError("All answered MCQ fields exceed the requested compressed limit; never drop rows silently")
    # Cost-efficient complete source explanations first; no summarizing or
    # fabricating missing explanations. Reserve headroom for compression model
    # differences and per-pack dictionaries.
    candidate=sorted(
        ((len(zlib.compress(v.encode("utf-8"),9)),k) for k,v in saved.items()),
        key=lambda c:(c[0],c[1])
    )
    headroom=max(0, budget-base-350_000)
    used=0
    selected=[]
    for compressed_cost,k in candidate:
        # independent zlib sizes conservatively estimate marginal bytes
        cost=max(10,int(compressed_cost*0.98))
        if used+cost>headroom:
            continue
        used+=cost
        selected.append(k)
    by_id={q["id"]:q for q in training}
    for k in selected: by_id[k]["explanation"]=saved[k]
    measured,pack_count=estimate_bytes(all_rows,args.rows_per_pack)
    print(f"WITH {len(selected)} FULL TRAIN EXPLANATIONS compressed={measured/1e6:.2f} MB",flush=True)
    # If compression did not deliver, remove least cost-effective explanations.
    # Every removed text is counted; questions/options/answers never removed.
    while measured>budget and selected:
        n=max(250,int(len(selected)*0.055))
        for k in selected[-n:]: by_id[k]["explanation"]=""
        del selected[-n:]
        measured,pack_count=estimate_bytes(all_rows,args.rows_per_pack)
        print(f"REBALANCE explanations={len(selected)} compressed={measured/1e6:.3f} MB",flush=True)
    if measured>budget: raise RuntimeError("Cannot fit even with missing explanations")
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open("w",encoding="utf-8") as fh:
        for q in all_rows:
            fh.write(json.dumps(q,ensure_ascii=False,separators=(",",":"))+"\n")
    coverage={
        "source":"MedMCQA 2022 upstream; validation historical NEET PG (years individual UNKNOWN), train MOCK/TEST-SERIES only",
        "not_a_complete_1991_2026_archive":True,
        "all_2023_to_2026_actual_exams_imported":False,
        "raw_validation":vr["raw"],"raw_train":tr["raw"],
        "validation_usable":vr["usable"],"train_usable":tr["usable"],
        "malformed_quarantined":vr["invalid"]+tr["invalid"],
        "offline_usable_answer_labelled":len(all_rows),
        "validation_explanations_available":sum(len(q["explanation"].strip())>=20 for q in validation),
        "training_full_explanations_preserved":len(selected),
        "training_explanations_withheld_for_size":len(saved)-len(selected),
        "training_no_source_explanation":len(training)-len(saved),
        "total_explanations_preserved":sum(len(q["explanation"].strip())>=20 for q in all_rows),
        "predicted_deflate_mb":round(measured/1_000_000,3),
        "upper_limit_mb":25.0,
        "record_years_verified":0,
        "answer_labels_independently_medically_verified":0,
        "eligible_groups":{"NEET_PG_validation":len(validation),"GENERAL_MEDICAL_training":len(training)},
    }
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(coverage,indent=2)+"\n")
    print(json.dumps(coverage,indent=2),flush=True)
    if len(all_rows)<180000: raise RuntimeError("Dataset missing expected answered records")
    if measured>25_000_000: raise RuntimeError("Hard budget breached")

if __name__=="__main__":main()
