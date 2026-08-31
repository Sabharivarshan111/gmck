# 95 - Release and Pipeline Engine

## How Releases Work on Orbit MBBS

Releases on GitHub for the Orbit MBBS native application are automated via GitHub Actions workflows:

### 1. Workflows
- `.github/workflows/android-release.yml`: Builds signed `app-release.aab` (Google Play) and `app-release.apk` (direct sideload), then automatically creates a GitHub Release with both binaries attached.
- `.github/workflows/android-internal.yml`: Builds the Internal APK with live package and real keys.
- `.github/workflows/android-debug.yml`: Builds the debug APK with ads disabled.

### 2. Pre-Release Verification (Mandatory before dispatch)
Before triggering a build, ALWAYS run:
```bash
cd mobile
npm run typecheck
npm run lint
npm run check:fanout
npm run check:mcq
npm run check:notes-limits
npm run check:notes-schema
npm run check:sync
npm run check:cloud-ids
npm run check:android-res
npm run check:theme-from-image
npm run check:glass
npm run check:sounds
npm run check:agent-docs
npm run check:payments
npm run check:native-sound
npm run check:subject-cards
npm run check:contrast
npm run check:anki
npm run check:textbooks
npm run check:one-app
npm run check:flashcard-size
npm run check:streak
npm run check:supabase-queue
npm run check:keyboard
```

### 3. Triggering a Release via GitHub Actions API
```javascript
import https from 'https';
const token = process.env.GITHUB_TOKEN || 'ghp_...';

function triggerRelease(ref = 'main') {
  const payload = JSON.stringify({ ref, inputs: { build_apk: true } });
  const options = {
    hostname: 'api.github.com',
    path: '/repos/Sabharivarshan111/gmck/actions/workflows/android-release.yml/dispatches',
    method: 'POST',
    headers: {
      'User-Agent': 'Node.js',
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  const req = https.request(options, (res) => console.log('Dispatch status:', res.statusCode));
  req.write(payload);
  req.end();
}
```

### 4. Continuous Agent Synchronization
Whenever a new rule is added or updated in `.agents/rules/`, run `cd mobile && npm run sync:agent-docs` so `CLAUDE.md` and `AGENTS.md` indexes remain synchronized.
