#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SUB="tools/video-editor/openreel"
if ! command -v git >/dev/null 2>&1; then echo 'Git is required' >&2; exit 1; fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo 'pnpm is required. Install Node.js + Corepack then run: corepack enable' >&2
  exit 1
fi
git -C "$ROOT" submodule update --init "$SUB"
cd "$ROOT/$SUB"
pnpm install --frozen-lockfile
exec pnpm dev
