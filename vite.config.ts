
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { PUBLIC_EXCLUDES } from "./scripts/deploy-excludes.mjs";

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
    // EXPERIMENT - restored in the next commit. See PR #28.
    // pruneUnservedPublicAssets(),
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
