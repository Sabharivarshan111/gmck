
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

/**
 * Paths under `public/` that the website does not serve.
 *
 * Declared HERE, in the build's own config, and deliberately not imported from
 * `scripts/`. That import is what broke the Vercel deployment: `.vercelignore`
 * carried `/*.mjs`, and while a leading slash anchors a pattern to the root in
 * gitignore syntax, the effective match removed `scripts/deploy-excludes.mjs`
 * — so this file could not load and the build died before it started. The CI
 * job that was meant to catch it used a SHELL glob, which matches only the
 * current directory, so it removed the root `.mjs` files and none deeper, and
 * passed. A config with no imports outside itself cannot fail that way again.
 *
 * `npm run check:deploy` reads this list back out of this file, so the two
 * still cannot drift.
 */
const PUBLIC_EXCLUDES = [
  // 51 MB of exam plates: the staging area for the Supabase `diagrams` bucket,
  // uploaded by .github/workflows/supabase-tasks.yml and read back from that
  // bucket's URL. Never served from this site.
  "diagrams",
  // The v8.0 .glb engine, superseded by the BodyParts3D chunk atlas. 28 MB, and
  // no file in src/ has loaded one since.
  "models/human_body.glb",
  "models/heart.glb",
  "models/lungs.glb",
  "models/liver.glb",
  "models/kidney.glb",
  "models/brain.glb",
  "models/skeletal.glb",
  "models/lungs_candidate_zanatomy.glb",
  // 14.7 MB, reachable only by typing ?lung_model=bp3d.
  "models/lungs_candidate_bodyparts3d.glb",
];

/**
 * Drop the parts of `public/` that the website does not serve.
 *
 * Vite copies `public/` into `dist/` verbatim, and `public/` here also holds
 * two things that are not website assets: the exam plates that
 * `.github/workflows/supabase-tasks.yml` uploads to the Supabase `diagrams`
 * bucket (51 MB, read back from that bucket's URL, never from this site), and
 * the retired v8.0 `.glb` model engine that the BodyParts3D chunk atlas
 * replaced (28 MB, not loaded by any file in `src/`).
 *
 * `.vercelignore` cannot do this job: the CLI reads it, and a push to `main`
 * goes through the Git integration, which clones on Vercel's side and never
 * sees it. `dist/` is the one thing both routes have in common.
 *
 * Every path here is asserted unreferenced by `npm run check:deploy`, so this
 * removes assets nothing asks for rather than assets nothing asked for *yet*.
 */
function pruneUnservedPublicAssets(): Plugin {
  return {
    name: "orbit-prune-unserved-public-assets",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      for (const rel of PUBLIC_EXCLUDES) {
        const target = path.join(dist, rel);
        if (!target.startsWith(dist)) continue;
        fs.rmSync(target, { recursive: true, force: true });
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "0.0.0.0",
    port: 4180,
  },
  plugins: [
    react(),
    mcpPlugin(),
    pruneUnservedPublicAssets(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    entries: ["index.html"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
