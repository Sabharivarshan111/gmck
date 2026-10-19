#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SUB="tools/video-editor/opencut-classic"
command -v bun >/dev/null 2>&1 || { echo "Install Bun first: https://bun.sh/docs/installation" >&2; exit 1; }
git -C "$ROOT" submodule update --init "$SUB"
cd "$ROOT/$SUB"
if [ ! -f apps/web/.env.local ] && [ -f apps/web/.env.example ]; then
  cp apps/web/.env.example apps/web/.env.local
fi
bun install
echo "If needed, start Classic's Docker services as documented in its README."
exec bun dev:web
