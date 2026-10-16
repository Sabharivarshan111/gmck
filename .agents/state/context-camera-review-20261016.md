# Additional visual release blockers — 2026-10-16

Raw Android/Vercel screenshots from anatomy group4 part0 exposed two shared defects after the first brain repair builds finished. Do not publish those e7 builds as the final reviewed release.

- connection309 (ileal artery) and connection313 (ileal vein, part1) fit a tiny vessel while the visible small-intestine context filled the viewport. Camera bounds previously included context only for relations. Now all visible connection context contributes to fitting; hiding organ context still frames the vessel alone.
- Generic liver relations122/246/262/274 resolved only FJ2816, the caudate lobe. Actual source parenchyma also contains nine hepatovenous segments. The generator now resolves all ten source parenchyma pieces for generic liver relations. The explicitly named caudate-lobe relation197 stays unchanged. No source geometry or positions were invented or changed.

Root TypeScript, organ-resolution/model-asset/real-GLB brain checks passed before this checkpoint. All430 source connection entries and225 registered selections remain present. Source-data checks verify the four repaired liver relations select all ten parenchyma meshes.

Require new debug/internal/release APKs+AAB and installed Android/Vercel rechecks of all85 registered vascular connections, four changed liver relations and26 Z-Anatomy reference targets. Old exhaustive groups remain evidence for unchanged branches; affected screenshots need explicit replacement. Old pending partition/brain runs should finish, not be duplicated or cancelled. Preserve the observed failures in evidence.

Publication authorization is already explicit. Publication remains blocked pending new builds and review. Do not update main/production or claim completion yet. Candidate workflows suppress automatic release publication on this branch.
