#!/bin/bash
# Print "where the work stopped" at the top of every Claude Code session.
#
# This repo's whole resume mechanism is one command, and a command nobody runs
# is a file nobody reads. A session that has just been resumed — after a
# disconnect, a deleted session, a sign-out, a fresh clone on another account —
# is exactly the one that has lost its context and is least likely to think to
# ask for it. So it is printed unasked.
#
# Deliberately NOT a dependency installer, which is what a SessionStart hook is
# usually for:
#
#   * It must never fail a session. It is read-only, makes no network call,
#     writes nothing, installs nothing, and exits 0 whatever happens — the
#     `|| true` below is load-bearing, because a hook that can fail is a hook
#     somebody deletes the first time a session will not start.
#   * It runs synchronously because it costs about a second: plain node, no
#     dependencies, no fetch. Async would buy nothing and introduce a race with
#     the first thing the agent does.
#   * `npm install` here would be minutes, would need the network, and would
#     do it on every session including the ones that only read a file.
#
# Registered in .claude/settings.json. Delete that entry to turn it off; the
# report is still one command away (`npm run resume`).
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
report="$root/mobile/scripts/resume-status.mjs"

if ! command -v node >/dev/null 2>&1; then
  echo "[session-start] node is not on PATH, so the resume report cannot run."
  echo "[session-start] Read .agents/state/resume-notes.md and HANDOFF.md (from the end) instead."
  exit 0
fi

if [ ! -f "$report" ]; then
  echo "[session-start] $report is missing — that file IS the resume mechanism."
  echo "[session-start] Run: cd mobile && npm run check:repo-intact"
  exit 0
fi

echo "[session-start] Orbit MBBS — the previous session's context is gone; this is what the repo knows."
echo "[session-start] Regenerate any time with: npm run resume"
echo
node "$report" 2>&1 || true
exit 0
