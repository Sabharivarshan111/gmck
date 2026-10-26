"""Prepare a resumable private review queue; never publish unreviewed OCR as app questions."""
import argparse, collections, csv, hashlib, json, re
from pathlib import Path

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--collection-root', type=Path)
    ap.add_argument('--reviewed', type=Path)
    args=ap.parse_args()
    root=args.collection_root.resolve() if args.collection_root else Path(__file__).resolve().parents[1]
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    records=json.loads((root/'normalized_records.json').read_text())
    reviewed_path=args.reviewed if args.reviewed else root/'APP_BATCH01_REVIEWED_QUESTIONS.json'
    reviewed=json.loads(reviewed_path.read_text()) if reviewed_path.exists() else []
    assert len({r['id'] for r in reviewed})==len(reviewed)
    approved=collections.defaultdict(list)
    for r in reviewed:approved[r['sourceSha256']].append(r)
    seen=set();papers=[];drafts=[]
    for r in records:
        if r.get('document_class') not in ('original_exam_candidate','original_exam_attribution_pending'):continue
        sha=r['sha256']
        if sha in seen:continue
        seen.add(sha);pdf=root/r['local_pdf_path'];textpath=root/'inspection_text'/(sha+'.txt')
        present=pdf.is_file() and hashlib.sha256(pdf.read_bytes()).hexdigest()==sha
        text=textpath.read_text() if textpath.is_file() else ''
        pages=re.split(r'=== PAGE (\d+) ===\n',text)
        count_before=len(drafts)
        for i in range(1,len(pages),2):
            number=int(pages[i]);body=pages[i+1]
            starts=list(re.finditer(r'(?m)^\s*(\d{1,2})[.)]\s*(?=\S|\n)',body))
            occurrences=collections.Counter()
            for j,m in enumerate(starts):
                no=m[1];occurrences[no]+=1
                raw=body[m.end():starts[j+1].start() if j+1<len(starts) else len(body)]
                if len(raw.strip())<3:continue
                suffix='' if occurrences[no]==1 else '-occ'+str(occurrences[no])
                draft_id=f"{r['university'].lower()}-{sha[:12]}-p{number}-q{no}{suffix}"
                drafts.append(dict(id=draft_id,university=r['university'],sourceSha256=sha,pdfPage=number,sourceQuestion=no,rawExtractedBlock=raw,sourceUrl=r['url'],localPdfPath=r['local_pdf_path'],sourceUniversityStatus=r['document_class'],subjectHint=r.get('subject','Unknown'),professionalHint=r.get('professional','Unknown'),examYearHint=r.get('examination_year','Unknown'),topicKey=None,reviewStatus='Needs original-page transcription and chapter review',imported=False))
        papers.append(dict(university=r['university'],sha256=sha,source_url=r['url'],local_pdf_path=r['local_pdf_path'],bytes_verified=present,pages=r.get('pages'),subject=r.get('subject'),professional=r.get('professional'),examination_year=r.get('examination_year'),attribution_status=r['document_class'],draft_blocks=len(drafts)-count_before,reviewed_question_units=len(approved[sha]),status='Reviewed page batch prepared for app' if approved[sha] else 'Awaiting question/page review'))
    assert all(sha in seen for sha in approved),'Reviewed source is absent from candidate manifest'
    assert all(p['bytes_verified'] for p in papers),'Candidate PDF bytes are missing/corrupt'
    assert len({d['id'] for d in drafts})==len(drafts),'Draft identity collision'
    with (out/'PAPER_IMPORT_QUEUE.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(papers[0]));w.writeheader();w.writerows(papers)
    with (out/'QUESTION_REVIEW_QUEUE.jsonl').open('w') as f:
        for d in drafts:f.write(json.dumps(d,ensure_ascii=False)+'\n')
    (out/'REVIEWED_APP_QUESTIONS.json').write_text(json.dumps(reviewed,ensure_ascii=False,indent=2))
    stats=dict(candidate_pdfs_with_verified_local_bytes=len(papers),draft_blocks_requiring_review=len(drafts),reviewed_app_question_units=len(reviewed),reviewed_pdf_pages=sum(bool(p['reviewed_question_units']) for p in papers),university_reviewed_counts=dict(collections.Counter(r['university'] for r in reviewed)),university_candidate_pdf_counts=dict(collections.Counter(p['university'] for p in papers)),published_to_app_automatically=False)
    (out/'IMPORT_SUMMARY.json').write_text(json.dumps(stats,indent=2))
    (out/'README.md').write_text('''# ORBIT university question import staging

The paper queue lists SHA-verified local source PDFs. Draft blocks are only mechanical number-boundary candidates: they may include headers, grouped alternatives, OCR errors or truncated text and require comparison with the actual original page. They are not app questions and are never imported automatically. Unknown chapters remain null. Source-university uncertainty is retained.

REVIEWED_APP_QUESTIONS.json contains the separately page-reviewed first batch, with all grouped WBUHS alternatives retained. The shared app data uses those reviewed rows only. Exam-paper coverage and question-import coverage are different audits; no university/year is complete. No answers were supplied in these four source pages; on-tap AI follows the existing ORBIT flow.

To resume, restore the saved collection, run scripts/prepare_orbit_import.py --output PATH, then review new source pages and append stable rows without changing existing IDs. Keep question wording, subparts, exam references, original question type, marks, source hash and page. Do not promote the mechanical review queue to the published bank. Original PDFs stay unchanged.
''')
    print(json.dumps(stats,indent=2))

if __name__=='__main__':main()
