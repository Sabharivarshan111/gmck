# 94 - Textbook-Grounded Medical Diagram Engine

## Mandatory Workflow for ALL Medical Diagram Generation

Whenever generating an anatomy, physiology, biochemistry, pathology, pharmacology, or microbiology diagram:

### 1. Pre-Generation Textbook Grounding (MANDATORY)
Before calling `generate_image`, always search and extract exact details from standard benchmark MBBS textbooks:
- **Anatomy / Embryology / Histology**: BD Chaurasia, Vishram Singh, IB Singh (`textbooks/anatomy/`)
- **Physiology**: K. Sembulingam, Guyton & Hall (`textbooks/physiology/`)
- **Biochemistry**: DM Vasudevan, Harper (`textbooks/biochemistry/`)
- **Pathology**: Ramadas Nayak, Robbins & Cotran (`textbooks/pathology/`)
- **Pharmacology**: KD Tripathi, Tara Shanbhag (`textbooks/pharmacology/`)
- **Microbiology**: Apurba Sastry, Ananthanarayan (`textbooks/microbiology/`)
- **Community Medicine**: K. Park, SIA (`textbooks/community/`)

### 2. Extract Key Grounding Details:
- Exact textbook diagram title (e.g., `BLOOD SUPPLY OF A LONG BONE`, `TYPES OF SYNOVIAL JOINTS`)
- Key structural parts, layers, relations, and numbered steps
- Specific clinical annotations (e.g., "Hairpin loops - site of osteomyelitis in children", "Direction away from growing end")
- Appropriate palette/stains (e.g., H&E hematoxylin violet & eosin pink for histology, cobalt blue & ruby red for vessels/muscles)

### 3. Image Generation Rules (Antigravity `generate_image` Native Tool):
- **Title**: Bold uppercase title centered at the top of the canvas.
- **Background**: Solid clean white paper background (#FFFFFF) with high contrast.
- **Leaders**: Straight neat leader lines with crisp legible annotations.
- **Art Style**: Colored pencil anatomical/histological sketching standard for university theory and practical exams.
- **Strict Prohibition**: Never use external web scraping or low-quality vector approximations when generating textbook schematics.
