// This repository must NOT have a `.vercelignore`, and this is why.
//
// `npm run check:deploy` fails if one comes back. Read this before adding one.
//
// ---------------------------------------------------------------------------
// What happened
// ---------------------------------------------------------------------------
//
// The working tree is ~728 MB without `.git`, and `vercel deploy` — the CLI,
// which is how an agent or an IDE publishes — uploads that tree against a
// 100 MB cap on Hobby. So a `.vercelignore` looked obviously right, and it was
// added. Every Vercel deployment on the branch failed from that commit
// onwards, while `main` kept deploying fine.
//
// The failure could not be read from an agent sandbox: the Vercel connector
// authenticates as the owner but 403s on the team that owns the project, and
// `vercel.com` is refused by the egress proxy. So it was bisected by pushing,
// six trials:
//
//   main @ 6721b26c        no .vercelignore, no dist prune     DEPLOYED
//   b674da3d .. e212219d   .vercelignore + dist prune          FAILED x5
//   ca852434               neither                             DEPLOYED
//   3eff5bce               .vercelignore (minus /*.mjs) + prune FAILED
//   e4cae891               dist prune only                     DEPLOYED
//
// The Vite `dist` prune is innocent and stays — it is what takes the published
// site from 186 MB to 39 MB. **The mere presence of `.vercelignore` is what
// failed the deployment**, and not through the mechanism first suspected: the
// `/*.mjs` pattern reaching `scripts/deploy-excludes.mjs`, which
// `vite.config.ts` used to import, was a real hazard and was fixed, and the
// deployment failed anyway. Which pattern, or whether the file is read at all
// on this project's Git integration, is not established.
//
// ---------------------------------------------------------------------------
// What this means for the thing it was meant to solve
// ---------------------------------------------------------------------------
//
// **The 100 MB CLI cap was never confirmed as the cause of anything.** It was
// inferred from the published limit and the size of the tree. It fits, and it
// remains the most likely explanation for a CLI deploy failing — but no log
// was ever read that said so, and the fix for it broke the route that actually
// publishes this site. That is the wrong trade, so it is reverted.
//
// Pushing to `main` still publishes, which is how the site has always been
// updated and is unaffected by any of this.
//
// **To settle it**, from anywhere with the Vercel CLI signed in:
//
//   npx vercel inspect <deployment-id> --logs
//
// A failed deployment id is in the `Vercel` commit status on any of the five
// failing commits above. One line of that log would say which pattern it was,
// and a `.vercelignore` could then be written that omits it.
//
// Until then: no `.vercelignore`. `UPLOAD_EXCLUDES` below is kept as the list
// that WOULD go in one, with the reason for each entry, so whoever reads that
// log does not have to derive it again.

/** What a `.vercelignore` would exclude, if this project could have one. */
export const UPLOAD_EXCLUDES = [
  // Rendered ad video and its workspace — 238 MB, none of it embedded
  'remotion-ad',
  'hyperframes-ad',
  // Scanned clinical PDFs and the long-form documentation — 193 MB
  'docs',
  // Captured app screenshots — 70 MB
  'screenshots',
  // The native Android app. src/data is shared with it through an alias, so
  // the dependency runs the other way and the website needs none of it.
  'mobile',
  // Edge functions and migrations: these deploy to Supabase, never to Vercel
  'supabase',
  // Agent rules, skills, queues and state
  '.agents',
  '.claude',
  '.lovable',
  // CI
  '.github',
  // Handover and rules documents
  '/*.md',
  // A second lockfile, for a package manager this project does not build with
  'bun.lock',
  'bun.lockb',
];

/** The upload budget in megabytes, for the report `check:deploy` prints. */
export const UPLOAD_BUDGET_MB = 60;
