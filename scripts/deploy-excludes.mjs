// What the website does not need, in one list, because it is enforced twice.
//
// Vercel deploys this repo two different ways and they read different things:
//
//   * a push to `main` goes through the Git integration, which clones the repo
//     on Vercel's side and runs `npm run build`. What reaches the CDN is
//     whatever `dist/` holds — so `PUBLIC_EXCLUDES` is applied by the Vite
//     plugin in `vite.config.ts`, after the build.
//   * `vercel deploy` from a machine — the CLI, and anything driving it, which
//     is how an agent or an IDE publishes — UPLOADS the working tree, and
//     that upload is capped (100 MB on Hobby, 1 GB on Pro). `.vercelignore` is
//     what it reads.
//
// Both lists live here so the two cannot drift, and `npm run check:deploy`
// fails if `.vercelignore` stops matching.
//
// ---------------------------------------------------------------------------
// Why this file exists at all
// ---------------------------------------------------------------------------
//
// There was no `.vercelignore`, and the working tree is 728 MB without `.git`:
// 238 MB of rendered ad videos under `remotion-ad/out/`, 193 MB of scanned
// clinical PDFs under `docs/`, 70 MB of screenshots, and a `public/` that
// carried both `body-N.bin` and `body-N.bin.gz` for all fifteen anatomy chunks
// — the same 2.2 million triangles twice.
//
// So every CLI deployment was ~7x over the Hobby cap and was rejected before
// it started, while pushes to `main` kept working because the Git integration
// never uploads anything. That is the whole shape of "the site updates when
// the owner merges but an agent cannot publish to it": not a build failure, not
// a credential, not a permission. An upload limit, and a repo that grew past it
// with nothing measuring.
//
// `npm run check:deploy` is that measurement now.

/**
 * Directories and files a CLI deployment must not upload.
 *
 * NOTHING in the build imports this module — `npm run check:deploy` is its only
 * reader. That is deliberate: a list of things an ignore file removes must not
 * itself be removable by one.
 */
export const UPLOAD_EXCLUDES = [
  // Rendered video and its workspace. 238 MB, and the site embeds none of it.
  'remotion-ad',
  'hyperframes-ad',
  // The owner's scanned college PDFs and every long-form doc. 193 MB.
  'docs',
  // Captured app screenshots, for handovers and the Play listing. 70 MB.
  'screenshots',
  // The native Android app. It shares `src/data` through an alias, so the
  // dependency runs the other way and the website needs none of it.
  'mobile',
  // Edge functions and migrations: deployed to Supabase, never to Vercel.
  'supabase',
  // Agent rules, skills, queues and state.
  '.agents',
  '.claude',
  '.lovable',
  // CI. (`scripts/` is NOT excluded: `vite.config.ts` imports this very file
  // from it, so an upload without it cannot build. It is 104 KB.)
  '.github',
  // Handover and rules documents.
  //
  // `/*.mjs` and `/*.cjs` USED to be here for the root's one-off maintenance
  // scripts. They are gone, and the reason is worth keeping: a leading slash
  // anchors a pattern to the root in gitignore syntax, but the effective match
  // took `scripts/deploy-excludes.mjs` with it — the file `vite.config.ts`
  // imported — and every Vercel deployment on the branch died before the build
  // started. Those root scripts are about 100 KB against a 37 MB upload. The
  // list stays; the two patterns that could reach into a directory do not.
  '/*.md',
  // A second lockfile for a package manager this project does not build with.
  'bun.lock',
  'bun.lockb',
];

/** The upload budget, in megabytes. Vercel Hobby rejects a CLI deploy above 100. */
export const UPLOAD_BUDGET_MB = 60;
