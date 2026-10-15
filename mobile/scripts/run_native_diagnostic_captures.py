"""Independent native suites, preserving later checks after an earlier failure."""
import subprocess
import sys
results = [subprocess.run([sys.executable, 'mobile/scripts/' + name]).returncode
           for name in ['native_clinical_studio_screenshots.py', 'native_diagnostic_controls.py', 'vercel_android_reference_screenshots.py']]
if any(results):
    raise SystemExit('Incomplete native diagnostic evidence: ' + repr(results))
