"""Verify rotation dates, Add validation and persistence on the installed APK."""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path('mobile/scripts').resolve()))
from native_screenshot_driver import (PACKAGE, OUT, adb, launch, first_run, tap,
    scroll_to_tappable, scroll_up, wait_visible, visible, shot)

checks = []


def reach(label):
    scroll_to_tappable(label)
    tap(label)


try:
    launch()
    first_run()
    tap('My Progress')
    reach('Attendance')
    reach('Clinical postings')
    reach('Add a posting')
    reach('Posting start date')
    tap('16 October 2026')
    reach('Posting end date')
    tap('12 November 2026')
    reach('Require 80 percent')
    reach('Add this posting')
    wait_visible('Enter a posting name')
    shot('android-calendar-blank-name-validation')
    checks.append('Selected date range and target; Add displays missing-name error')
    reach('Posting name')
    adb('shell', 'input', 'text', 'CalendarQA')
    adb('shell', 'input', 'keyevent', '4')
    reach('Add this posting')
    # The form is replaced by the saved rotation, possibly above the viewport.
    scroll_to_tappable('CalendarQA')
    assert not visible('Could not save'), 'Saving reported an error'
    shot('android-calendar-saved')
    checks.append('Named rotation saves after selecting dates')
    adb('shell', 'am', 'force-stop', PACKAGE)
    adb('shell', 'monkey', '-p', PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
    time.sleep(5)
    tap('My Progress')
    reach('Attendance')
    reach('Clinical postings')
    scroll_to_tappable('CalendarQA')
    shot('android-calendar-persisted-after-restart')
    checks.append('Saved rotation persists through force-stop and relaunch')
    (OUT / 'CALENDAR-PASSED.json').write_text(json.dumps({'passed': True, 'checks': checks}, indent=2))
except Exception as error:
    shot('android-calendar-FAILURE')
    (OUT / 'calendar-failure.json').write_text(json.dumps({'error': str(error), 'checks': checks}, indent=2))
    raise
