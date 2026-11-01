#!/usr/bin/env python3
"""Independently benchmark fully lossless MedMCQA answer-bearing record payloads.

Do not publish or commit question content. Keep all question stems, A-D, answer
labels, explanations, subject, topic and identifiers. This is NOT a release
import or an assertion that the dataset can legally be redistributed.

Compares 1000 vs 10000-record independently decompressible blocks, plus a
25k block maximum-compression probe for 2022-era data only.
"""
from __future__ import annotations

from collections import Counter
from hashlib import sha256
from io import BytesIO
import json
import lzma
import time
import zlib

import brotli
from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq
import zstandard as zstd

def compact(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

def build_block(records):
    subjects, topics = [], []
    si, ti = {}, {}
    out = []
    def intern(name, strings, names):
        name = name or ""
        if name not in names:
            names[name] = len(strings)
            strings.append(name)
        return names[name]

    for r in records:
        out.append([
            str(r["id"]), r["question"], r["opa"], r["opb"], r["opc"], r["opd"],
            int(r["cop"]), r.get("exp") or "",
            intern(r.get("subject_name"), subjects, si),
            intern(r.get("topic_name"), topics, ti)
        ])
    return compact([subjects, topics, out])

def main():
    stats = Counter()
    records = []
    hashes = set()
    duplicates = 0

    start = time.monotonic()
    for split in ("train", "validation", "test"):
        file = hf_hub_download(repo_id="openlifescienceai/medmcqa", repo_type="dataset",
                               filename=f"data/{split}-00000-of-00001.parquet")
        pf = pq.ParquetFile(file)
        for batch in pf.iter_batches(batch_size=4096):
            for r in batch.to_pylist():
                stats["rows"] += 1
                if r.get("cop") not in (0, 1, 2, 3):
                    stats["no_answer"] += 1
                    continue
                if not r.get("question") or any(not r.get(k) for k in ("opa","opb","opc","opd")):
                    stats["invalid_options"] += 1
                    continue
                if len((r.get("exp") or "").strip()) < 20:
                    stats["no_useful_explanation"] += 1
                sig = sha256(compact([r["question"],r["opa"],r["opb"],r["opc"],r["opd"]])).hexdigest()
                if sig in hashes:
                    duplicates += 1
                else:
                    hashes.add(sig)
                records.append(r)
    stats["keyed_records"] = len(records)
    stats["exact_duplicate_stems_choices"] = duplicates
    stats["unique_stems_choices"] = len(hashes)
    print("DATA AUDIT", json.dumps(stats), flush=True)

    methods = {
        "brotli9": lambda b: brotli.compress(b, quality=9),
        "brotli11": lambda b: brotli.compress(b, quality=11),
        "deflate9": lambda b: zlib.compress(b, 9),
        "zstd19": lambda b: zstd.ZstdCompressor(level=19).compress(b),
        "lzma9": lambda b: lzma.compress(b, preset=9),
    }
    outputs = {}
    for block_size, variants in ((1000,("brotli9","deflate9")),
                                 (10000,("brotli9","zstd19","lzma9")),
                                 (25000,("brotli11",))):
        results = {k:0 for k in variants}
        raw = 0
        n_blocks=0
        for i in range(0,len(records),block_size):
            block=build_block(records[i:i+block_size])
            raw += len(block)
            n_blocks += 1
            for method in variants:
                results[method] += len(methods[method](block))
        sizes={k:round(v/1e6,3) for k,v in results.items()}
        outputs[str(block_size)] = {"blocks":n_blocks,"raw_MB":round(raw/1e6,3),
                                    "compressed_MB":sizes,
                                    "under_25_MB":{k:v<=25 for k,v in sizes.items()}}
        print("COMPRESS PROBE",block_size,json.dumps(outputs[str(block_size)]),flush=True)

    # How much storage would the full, no-explanation textbook/Q+answer mode use?
    # This never changes the full benchmark or the bundle: it isolates the
    # explanation-size contribution, not a proposal to discard explanations.
    pieces = []
    for r in records:
        pieces.append([r["question"],r["opa"],r["opb"],r["opc"],r["opd"],int(r["cop"])])
    without_exp = compact(pieces)
    q_opt_answer_only_MB = round(len(brotli.compress(without_exp, quality=9))/1e6,3)
    print("DIAGNOSTIC WITHOUT EXPLANATIONS (NOT FULL CONTENT)",
          json.dumps({"brotli9_MB":q_opt_answer_only_MB}),flush=True)
    print("FINAL", json.dumps({"rows":stats["rows"],"keyed_records":len(records),
                                "results":outputs,
                                "runtime_seconds":round(time.monotonic()-start,1)}), flush=True)

if __name__=="__main__":
    main()
