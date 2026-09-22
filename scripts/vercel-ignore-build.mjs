import { execFileSync } from 'node:child_process';

const previous = process.env.VERCEL_GIT_PREVIOUS_SHA || 'HEAD^';
let files = [];

try {
  const output = execFileSync('git', ['diff', '--name-only', previous, 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  files = output.split('\n').map((s) => s.trim()).filter(Boolean);
} catch {
  // If Vercel cannot resolve the comparison SHA, build rather than risk
  // skipping a runtime change.
  process.exit(1);
}

if (files.length === 0) process.exit(0);

const nonRuntime = files.every((file) => {
  return (
    file === 'HANDOFF.md' ||
    file === 'README.md' ||
    file.endsWith('.md') ||
    file.startsWith('docs/') ||
    file.startsWith('.github/') ||
    file.startsWith('.vscode/')
  );
});

if (nonRuntime) {
  console.log('Skipping Vercel build: documentation/CI-only changes:', files.join(', '));
  process.exit(0);
}

console.log('Runtime-affecting changes detected; continuing Vercel build:', files.join(', '));
process.exit(1);
