"""Independent native suites, preserving later checks after an earlier failure."""
import subprocess
import sys
# Mobile Vercel references are captured by Playwright at 393x852 before this
# job. Do not overwrite them with a WebView modal that failed to paint.
results = [subprocess.run([sys.executable, 'mobile/scripts/' + name]).returncode
           for name in ['native_clinical_studio_screenshots.py', 'native_diagnostic_controls.py']]
if any(results):
    raise SystemExit('Incomplete native diagnostic evidence: ' + repr(results))
