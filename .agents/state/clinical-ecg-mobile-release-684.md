# Verified clinical and ECG mobile release

PR #73 merged as 54ed56cf36767a6ce4dd626a0b1419447f9c0feb. Production deployment dpl_9gYrSvboXLDW8zmkLACeP843z8Me is READY. Live https://orbitmbbs.vercel.app/simulator?tool=ecg12 opened in browser and guided tutorial confirmed, including the three collapsed advanced/reference sections.

Main focused production UX run 38300510672: SUCCESS for native Vault at 360/390/430px, eye model/instrument checks, ECG learning/captured sheet checks, studio checks, all four ultrasound views/reference decodes/controls, 3D bedside examination, MRI planes/measurements, heart isolation and seven anatomy interactions. This is the focused suite; do not imply every legacy exhaustive test passed.

Android release run 38300510278 succeeded including typecheck, lint, checks, signed AAB, APK and publication. Release-684: app-release.apk 114146427 bytes (114.1 MB decimal); app-release.aab 92417917 bytes (92.4 MB decimal). https://github.com/Sabharivarshan111/gmck/releases/tag/release-684 . Internal no-ads run 38300510653 also succeeded, tag internal-500. No physical-device or Play Store upload performed.

Scope: uniform compact native Vault; isolated Heart View 3D and collapsed camera views; schematic real 3D edema and scleral inspection; locally hosted credited ultrasound references; chest X-ray and brain MRI viewer; static captured ECG groups plus SVG guided learning and optional paused/playable/scrubbable teaching animations. Legacy ECG reference wording was corrected and advanced content retained as expandable sections. Preserve unrelated UI, theme, functions and PG bank changes.
