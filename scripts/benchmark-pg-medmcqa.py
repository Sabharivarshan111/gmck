#!/usr/bin/env python3
"""Measure MedMCQA compression without distributing any exam questions.

This is a benchmark ONLY, not an app importer or a grant of reuse permission.
Requires: pip install pyarrow huggingface_hub brotli
"""
import json
import zlib
from collections import Counter
from pathlib import Path
import brotli
import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download

from importlib.machinery import SourceFileLoader
packer = SourceFileLoader('pg_pack_compiler', str(Path(__file__).with_name('build-pg-offline-packs.py'))).load_module()

STATS = {}
for split in ('train','validation','test'):
    path=hf_hub_download(repo_id='openlifescienceai/medmcqa',
                         filename=f'data/{split}-00000-of-00001.parquet',
                         repo_type='dataset')
    pf=pq.ParquetFile(path)
    stats=Counter()
    total_br=0
    total_deflate=0
    total_raw=0
    packet=[]
    pack_i=0

    def flush():
        global total_br,total_deflate,total_raw,pack_i
        if not packet:
            return
        code=packer.pack_rows(packet, 'GENERAL_MEDICAL' if split == 'train' else 'NEET_PG' if split == 'validation' else 'AIIMS_PG', None)
        b=code.encode('utf-8')
        total_raw+=len(b)
        total_br+=len(brotli.compress(b,quality=8))
        total_deflate+=len(zlib.compress(b,9))
        packet.clear()
        pack_i+=1

    for batch in pf.iter_batches(batch_size=2048):
        for row in batch.to_pylist():
            stats['all_rows']+=1
            a=row.get('cop')
            # AIIMS test split may have null answer labels; they cannot be shown as solved.
            if a not in (0,1,2,3):
                stats['no_answer_key']+=1
                continue
            options=[row.get(k) or '' for k in ('opa','opb','opc','opd')]
            if not row.get('question') or not all(options):
                stats['incomplete']+=1
                continue
            exp=row.get('exp') or ''
            if len(exp.strip()) < 20:
                stats['no_useful_explanation']+=1
            packet.append(dict(id=str(row.get('id') or stats['all_rows']),
                               question=row['question'],opa=options[0],opb=options[1],
                               opc=options[2],opd=options[3],answer='ABCD'[a],
                               explanation=exp,source_url='https://huggingface.co/datasets/openlifescienceai/medmcqa',
                               answer_reference='NOT_INDEPENDENTLY_VERIFIED',
                               record_type='historical_dataset',subject=row.get('subject_name'),
                               topic=row.get('topic_name'),exam_session=None))
            stats['keyed_rows']+=1
            if len(packet)>=1000:
                flush()
    flush()
    STATS[split]=dict(stats)
    STATS[split].update(raw_mb=round(total_raw/1e6,2),
                        deflate_mb=round(total_deflate/1e6,2),
                        brotli_mb=round(total_br/1e6,2),packs=pack_i)
    print('BENCHMARK SPLIT '+split+': '+json.dumps(STATS[split]),flush=True)
summed={metric:round(sum(v.get(metric,0) for v in STATS.values()),3)
        for metric in ('raw_mb','deflate_mb','brotli_mb','keyed_rows','no_useful_explanation')}
print('BENCHMARK TOTAL (2022-era only; NOT RIGHTS-CLEARED): '+json.dumps(summed),flush=True)
print('25MB FIT - DEFLATE: '+str(summed['deflate_mb']<=25),flush=True)
print('50MB FIT - DEFLATE: '+str(summed['deflate_mb']<=50),flush=True)
