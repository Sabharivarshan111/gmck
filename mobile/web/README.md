# Android components on the web

This is the production browser entry for `mobile/App.tsx`. It shares the
Android screens, layouts, themes, gestures, motion, question banks, note
readers, Anki renderer/scheduler, attendance, timer, and AI clients.
`mobile/preview/main.tsx` and its demo fixtures are never deployed.

Run `npm ci --legacy-peer-deps` at the repository root, then
`npm --prefix mobile ci --legacy-peer-deps` and `npm run build:vercel`.
Vercel serves the native browser entry on study routes and the original
web application on `/simulator` and existing informational routes. The
patient simulator source and model assets are not edited by this port.

Browser adapters implement persistent IndexedDB storage, private imported
files/media, PDF pages, actual Anki import/export, audio/video, speech
recognition where supported, Supabase Google OAuth, browser history, and
offline caching. Android Noto emoji artwork is bundled for built-in icons
so missing system emoji fonts do not hide them. Artwork licenses are in
`emoji/`.

Browser differences are explicit: file attachments are private copies;
daily reminders require an open page and notification permission; the
browser cannot run Android AdMob, Play Billing, APK updates, Keystore,
RuntimeShader, or guaranteed background timers. The native glass fallback
is used. Cloud features still require connectivity, real authentication,
and the existing backend entitlements. No adapter fabricates a successful
sign-in, purchase, transcript, or cloud response.

Verification:

```sh
npm --prefix mobile run typecheck:web
npm --prefix mobile run lint -- --quiet
CHROME_PATH=/path/to/chromium node mobile/web/smoke.mjs
```

The production smoke test imports all three supported Anki package formats,
checks saved media/progress, history, offline question browsing, timer,
fresh guest onboarding, and the unchanged simulator shell. External requests
are deliberately blocked in this local test. It does not certify Google
login, paid AI generation, payment, or simulator WebGL rendering.

### Install ORBIT on a phone

The production page offers an install banner and a permanent **Menu → Install
ORBIT** action. Chromium's `beforeinstallprompt` is captured early and invoked
only after a tap; cancellation never reports a successful install. iPhone and
iPad show Safari Share → Add to Home Screen instructions. Standalone mode and
`appinstalled` hide the banner. Dismissal lasts seven days and does not hide the
menu action. The manifest has a stable ID, scope, standalone launch mode and
real branded PNGs (192/512, separate maskable 512, Apple touch 180). The missing
icons previously made Android offer a generic shortcut. No Android source or
simulator components were modified.

`node mobile/web/install-check.mjs` checks Chromium manifest parsing, real icon
dimensions, install help/menu/dismiss persistence, a simulated native prompt,
cancellation and installed events, and iPhone instructions. The simulated prompt
and user agent checks do not certify actual iOS Home Screen or Android WebAPK
installation; those need a physical device/browser. Chrome decides when its
native prompt is available. Offline AI/cloud sync still require internet.
