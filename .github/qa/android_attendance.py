"""Verify rotation dates, Add validation and persistence on the installed APK."""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path('mobile/scripts').resolve()))
from native_screenshot_driver import (PACKAGE, OUT, adb, launch, first_run, tap,
    scroll_to_tappable, wait_visible, visible, shot, dump_ui, node_label, bounds_center, scroll_up)

checks = []


def confirm_saved_range(stage):
    root = dump_ui()
    labels = ' '.join(node_label(n) for n in root.iter('node'))
    assert '2026-10-17' in labels and '2026-11-14' in labels, 'Saved rotation date range is incorrect'
    (OUT / ('calendar-' + stage + '-labels.txt')).write_text(labels)


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
    tap('17 October 2026')
    reach('Posting end date')
    tap('14 November 2026')
    reach('Require 80 percent')
    reach('Add this posting')
    wait_visible('Enter a posting name')
    shot('android-calendar-blank-name-validation')
    checks.append('Selected date range and target; Add displays missing-name error')
    # Match the editable field exactly; the validation text also says posting name.
    for _ in range(20):
        inputs=[n for n in dump_ui().iter('node') if 'EditText' in n.get('class','') and n.get('content-desc')=='Posting name']
        if inputs:
            point=bounds_center(inputs[0].get('bounds',''))
            if point and point[1]>200:
                adb('shell','input','tap',str(point[0]),str(point[1]));break
        scroll_up()
    else:
        raise RuntimeError('Posting name input was not reachable')
    adb('shell', 'input', 'text', 'CalendarQA')
    adb('shell', 'input', 'keyevent', '4')
    reach('Add this posting')
    # The form is replaced by the saved rotation, possibly above the viewport.
    scroll_to_tappable('CalendarQA')
    assert not visible('Could not save'), 'Saving reported an error'
    confirm_saved_range('saved')
    shot('android-calendar-saved')
    checks.append('Named rotation saves after selecting dates')
    adb('shell', 'am', 'force-stop', PACKAGE)
    adb('shell', 'monkey', '-p', PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
    time.sleep(5)
    tap('My Progress')
    reach('Attendance')
    reach('Clinical postings')
    scroll_to_tappable('CalendarQA')
    confirm_saved_range('persisted')
    shot('android-calendar-persisted-after-restart')
    checks.append('Saved rotation persists through force-stop and relaunch')
    (OUT / 'CALENDAR-PASSED.json').write_text(json.dumps({'passed': True, 'checks': checks}, indent=2))
except Exception as error:
    shot('android-calendar-FAILURE')
    (OUT / 'calendar-failure.json').write_text(json.dumps({'error': str(error), 'checks': checks}, indent=2))
    raise
