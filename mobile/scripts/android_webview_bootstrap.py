"""Open the real installed app and its local renderer, without a browser fixture."""
from native_screenshot_driver import launch, first_run, tap, scroll_to_tappable, OUT, shot, wait_visible, dump_ui, adb
import xml.etree.ElementTree as ET
from native_anatomy_screenshots import route
try:
    launch()
    first_run()
    wait_visible('Vault', tries=30)
    tap('Vault')
    scroll_to_tappable('Simulator & Anatomy')
    tap('Simulator & Anatomy')
    route('/simulator?mode=anatomy')
    tap('Explore 3D anatomy')
    shot('actual-android-bootstrap')
except Exception:
    shot('actual-android-bootstrap-FAILURE')
    try:
        (OUT / 'bootstrap-failure-ui.xml').write_text(ET.tostring(dump_ui(), encoding='unicode'))
        (OUT / 'bootstrap-failure-logcat.txt').write_text(adb('logcat','-d','-t','300',capture=True).stdout)
    except Exception as diagnostic_error:
        (OUT / 'bootstrap-diagnostic-error.txt').write_text(str(diagnostic_error))
    raise
