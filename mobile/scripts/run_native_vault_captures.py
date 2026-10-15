"""Run both device capture suites even when one fails; retain each failure."""
import subprocess
import sys
results = [subprocess.run([sys.executable, 'mobile/scripts/' + name]).returncode
           for name in ['native_clinical_studio_screenshots.py', 'native_diagnostic_controls.py', 'native_anatomy_screenshots.py', 'vercel_android_reference_screenshots.py']]
if any(results):
    raise SystemExit('Incomplete Android evidence: ' + repr(results))
