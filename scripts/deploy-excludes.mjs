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

/** Directories and files a CLI deployment must not upload. */
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
  // Handover and rules documents. Anchored at the root — an unanchored glob
  // matches at any depth in this syntax, and `/scripts/*.mjs` has to survive.
  '/*.md',
  // One-off maintenance scripts that live at the repo root.
  '/*.mjs',
  '/*.cjs',
  // A second lockfile for a package manager this project does not build with.
  'bun.lock',
  'bun.lockb',
];

/**
 * Paths under `public/` that Vite would otherwise copy into `dist/` verbatim.
 *
 * These are excluded from BOTH routes, because a Git build serves them too.
 * Each one is here because nothing in `src/` fetches it — checked, not assumed;
 * `npm run check:deploy` greps for every one of them and fails if a reference
 * appears, which is what turns this from a guess into a rule.
 */
export const PUBLIC_EXCLUDES = [
  // 51 MB of exam plates. These are the staging area for the Supabase
  // `diagrams` bucket — `.github/workflows/supabase-tasks.yml` uploads from
  // here — and every app reads them back from the bucket's public URL. They
  // have never been served from this site. They stay in the repo because the
  // upload workflow reads them from exactly this path.
  'diagrams',

  // The v8.0 model engine, superseded by the 2,234-part BodyParts3D binary
  // atlas that `AnatomicalBody3D` streams as `body-N.bin.gz`. 28 MB, and no
  // file in `src/` has loaded any of them since. Kept in the repo, because
  // `CLAUDE_HANDOVER.md` §13.4 describes them and deleting them would make
  // that section unreadable.
  'models/human_body.glb',
  'models/heart.glb',
  'models/lungs.glb',
  'models/liver.glb',
  'models/kidney.glb',
  'models/brain.glb',
  'models/skeletal.glb',
  // Never referenced at all, not even by the retired engine.
  'models/lungs_candidate_zanatomy.glb',

  // 14.7 MB, reachable only by typing `?lung_model=bp3d`. That comparison is
  // over — `lungs_candidate_zanatomy_baked.glb` is the default and has been —
  // and 14.7 MB on the CDN for a query string nobody types is not a trade the
  // reader should pay for. The two zanatomy candidates are 1.2 MB together and
  // stay.
  'models/lungs_candidate_bodyparts3d.glb',
];

/** The upload budget, in megabytes. Vercel Hobby rejects a CLI deploy above 100. */
export const UPLOAD_BUDGET_MB = 60;
