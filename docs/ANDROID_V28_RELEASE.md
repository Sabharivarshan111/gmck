# Android version 28 — fresh rebuild

Published 2026-10-20 from `ae307b7b9e5d90749661544dd8907f7ee3d4aea5`: versionCode **28**, versionName **0.0.0.28**. The owner explicitly requested this increment; no Play upload is implied.

All three hosted-runner jobs cleaned Android outputs **before** generating the required local simulator assets, then compiled with Gradle build caching disabled and tasks forced to rerun. The existing signing, application IDs, ad behaviour and release gates are preserved. Release APK assembly reuses only outputs freshly built for the AAB in that same job.

The offline NEET-PG bank is unchanged: **2,078 questions, 205 existing MBBS chapters and 467 embedded illustrations**, with original supplied options/keys and explanations. Complete original-paper coverage and physical-device testing are not established by this rebuild.

| Package | Download | Bytes | SHA-256 |
|---|---|---:|---|
| release AAB | [app-release.aab](https://github.com/Sabharivarshan111/gmck/releases/download/release-714/app-release.aab) | 105330362 | `a79c4765b7be6fe1ff8c6d2c0c3c36c02f6aaa62a60e468fafbe33f1e636f6ca` |
| release APK | [app-release.apk](https://github.com/Sabharivarshan111/gmck/releases/download/release-714/app-release.apk) | 132784895 | `d8773320b2cf0c6de6f8982291980dea3492de2adbfd373bbccd610b0e76acc7` |
| internal APK | [app-internal.apk](https://github.com/Sabharivarshan111/gmck/releases/download/internal-533/app-internal.apk) | 140420183 | `128de3645d1c945ba85a88ac73981c70278e390dac90c6fef189b330367de3d8` |
| debug APK | [app-preview.apk](https://github.com/Sabharivarshan111/gmck/releases/download/debug-573/app-preview.apk) | 140420191 | `7eb6e69332f033e6b25989b32a491a617db38ded6faebe4b925a4c7e6aa76b98` |

## Verification

- Full offline reader/installer, actual content/import graph, native/web/preview TypeScript, mandatory preflight checks, production web build and network-disabled browser flow: [run 39370309789](https://github.com/Sabharivarshan111/gmck/actions/runs/39370309789) — success.
- Signed AAB/APK: [release run 39370613024](https://github.com/Sabharivarshan111/gmck/actions/runs/39370613024) — success.
- Internal APK: [run 39370614555](https://github.com/Sabharivarshan111/gmck/actions/runs/39370614555) — success.
- Debug APK: [run 39370615995](https://github.com/Sabharivarshan111/gmck/actions/runs/39370615995) — success.
- All four published files were downloaded. Their bytes match GitHub's SHA-256 digests; APK binary XML manifests and AAB protobuf base manifest all declare versionCode 28 and 0.0.0.28, with the expected real/debug package IDs. The existing archive checker passed on every downloaded file: replacement present, retired assets/pg absent.
- Matching public.app_releases row 28 was written and independently read back. The corrected-source iOS web workflow also passed (39370313001). The separate pre-existing web anatomy dossier guard still fails digestive coverage 99/108 (92% versus 95%); it was not weakened.

Initial attempt c119aa3 failed because cleaning in the assemble invocation removed required simulator assets generated earlier in the workflow. No package from that failed attempt was published. Commit ae307b7 moves cleaning before generation and all three corrected native jobs pass. This is a build-order correction, not a missing-assets-check bypass.

## Play Console text

Release name:

```text
28 (0.0.0.28)
```

Release notes:

```text
<en-US>
New
• Study 2,078 NEET-PG questions across 205 MBBS chapters.
• Read questions, options, supplied answers and explanations offline.
• View 467 included illustrations offline.
• Find questions by year, subject, chapter or search.
</en-US>
```

No Play upload or physical Android-device test was performed. See [machine-readable artifact record](ANDROID_V28_ARTIFACTS.json) and PR #104.
