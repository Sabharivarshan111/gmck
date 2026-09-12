import fs from 'node:fs/promises';

/**
 * Where Chromium is, or undefined.
 *
 * ## Undefined is an answer, not a failure
 *
 * Returning nothing means "let Playwright use the browser it installed
 * itself", which is what a GitHub runner needs. Every harness here therefore
 * spreads it rather than passing it straight in:
 *
 *     const executablePath = await findChromium();
 *     chromium.launch({ ...(executablePath ? { executablePath } : {}) });
 *
 * ## Why this is a file rather than a copy in each harness
 *
 * It was a copy in each harness, and the copies drifted. `shoot.mjs` had the
 * full chain; the newer ones had a one-line `readdir('/opt/pw-browsers')` with
 * no fallback, because that path is where the agent sandbox keeps it and the
 * sandbox is where they were written.
 *
 * A runner has no `/opt/pw-browsers`, so the moment one of those harnesses was
 * wired into CI it died with ENOENT — after every screenshot had already been
 * taken, and it took the whole fifty-six-job ad render with it.
 */
export async function findChromium() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  // The agent sandboxes keep a versioned Chromium here.
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [dir] = entries
      .filter(entry => entry.startsWith('chromium-'))
      .sort()
      .reverse();
    if (dir) {
      return `/opt/pw-browsers/${dir}/chrome-linux/chrome`;
    }
  } catch {
    // Not a sandbox. Fall through.
  }
  for (const candidate of [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ]) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Next.
    }
  }
  // Nothing found: Playwright's own install is the right answer on a runner.
  return undefined;
}
