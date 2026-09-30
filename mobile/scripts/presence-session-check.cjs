// Compatibility entry point for existing CI commands.
require('node:child_process').execFileSync(process.execPath, [require('node:path').join(__dirname, 'presence-session-check.mjs')], {stdio: 'inherit'});
