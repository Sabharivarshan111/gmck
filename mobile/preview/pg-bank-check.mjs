#!/usr/bin/env node
/** The production offline flow supersedes the retired dataset UI smoke test.
 * Run npm run build:vercel first. */
await import('../web/neet-pg-offline-check.mjs');
