# 94 - Textbook-Grounded Medical Diagram Engine (Antigravity Exclusive)

## Core Architecture & 10-Diagram Batch Workflow

This skill and pipeline is **exclusive to Antigravity** using its native `generate_image` (Gemini image generator) tool. Claude does not have native `generate_image` capabilities.

---

### 1. Mandatory Pre-Generation Supabase Duplicate Check
Before generating ANY diagram:
1. **Query Supabase**: Check `question_diagrams` (`WHERE subject = ... AND storage_path IS NOT NULL`) and Supabase Storage `diagrams/` to see if a diagram for that topic or structure already exists.
2. **Strict Rule**: NEVER regenerate an existing diagram. Only select questions where `storage_path IS NULL` or `public_url IS NULL`.

---

### 2. Pre-Generation Textbook Grounding
Extract authentic schematics, specific annotations, branches, relations, and clinical mnemonics from benchmark Indian MBBS textbooks:
- **Anatomy / Embryology / Histology**: BD Chaurasia, Vishram Singh, Inderbir Singh
- **Physiology**: K. Sembulingam, Guyton & Hall
- **Biochemistry**: DM Vasudevan, Harper
- **Pathology**: Ramadas Nayak, Robbins & Cotran
- **Pharmacology**: KD Tripathi, Tara Shanbhag
- **Microbiology**: Apurba Sastry, Ananthanarayan
- **Community Medicine**: K. Park (PSM)

---

### 3. Diagram Generation Specifications (Antigravity Native `generate_image`)
- **Title**: Bold uppercase title centered at the top of the canvas matching the exact university exam question.
- **Background**: Solid clean white paper background (`#FFFFFF`) with high contrast and zero clutter.
- **Leader Lines**: Crisp, straight horizontal pointer lines with legible bold anatomical/biochemical labels.
- **Art Style**: Colored pencil anatomical/histological sketching standard for university theory and practical exams.
- **Aspect Ratio**: `4:3` (optimal for mobile and desktop viewports).

---

### 4. 10-Diagram Cloud Upload & DB Upsert Pipeline
For every batch of 10 diagrams:
1. **Generate**: Create 10 missing images with `generate_image`.
2. **Upload**: Upload binary files to Supabase Storage bucket `diagrams/` under `<subject>/<slug>.jpg` with `x-upsert: true` on active project URL `https://pmtgeydtqypwrypshhsx.supabase.co`.
3. **Database Upsert**: Insert or update rows in `question_diagrams` table with:
   - `question_id`, `year`, `subject`, `subtopic_key`, `question_text`, `question_type`
   - `diagram_kind` (`'anatomy'`, `'histology_plate'`, `'flowchart'`, etc.)
   - `status` = `'approved'`
   - `storage_path` = `<subject>/<slug>.jpg`
   - `public_url` = `https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/<subject>/<slug>.jpg`
