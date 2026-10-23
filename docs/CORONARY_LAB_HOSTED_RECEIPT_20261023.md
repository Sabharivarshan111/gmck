# Coronary Lab hosted verification — 23 October 2026

PR: https://github.com/Sabharivarshan111/gmck/pull/123
Tested runtime commit: 6c72f3e0bad15b26f3d91a6d4b91b5ee40d730e1

- Coronary Lab geometry and native UI: run39947547174, job120393787763, SUCCESS. Geometry/native+preview types/full source lint, actual-component browser tests, Android JavaScript release bundle and screenshots all passed on the GitHub runner.
- Browser evidence: artifact12499183128, coronary-lab-browser-evidence; SHA256 342cb15fee93f1537a471e4dae154406411bff8921ce92163976752e50718918.
- Production-style web build: run39947547183, job120393788195, SUCCESS.
- Vercel preview status: SUCCESS; deployment L9x5akGoPLpb6xhbBsxHfkabippP. A ready deployment does not prove the native-only discovery route is exposed by the legacy browser simulator.
- Broader Web build job120393787850 failed dossier-format-check: digestive99/108=92%, below the existing95% coverage requirement. No gate was weakened.
- iOS setup/attendance run39947547180 was CANCELLED and is not reported passing.

The dossier failure predates this feature. Comparing the complete root Git trees for base806d4aa9dbb6d4d5fa7ce720e4c72e37e5f46c69 and tested feature6c72f3e0bad15b26f3d91a6d4b91b5ee40d730e1 proves the failing check's code and source inputs are byte-identical:

| Directory | Identical Git tree SHA in base and feature |
| --- | --- |
| scripts | ab9954a1a76452265114ced9d401eb9ed402d6a1 |
| src | d40abd00f846ea8746208477fa3df21a8f578aa8 |
| public | 34ab65e448c7c0c6d722c18b34517e8bb48d314e |

The feature remains in the open PR while that existing anatomy gate is unresolved. There is no new signed APK/AAB or Play publication. Native-device rendering, performance, TalkBack and cardiologist review remain unverified. The schematic geometry, UI and copy were authored independently; provenance review is not legal clearance.
