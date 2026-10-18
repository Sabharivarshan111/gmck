"""Choose the pathological patient through native UI before opening the renderer."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path('mobile/scripts').resolve()))
from native_screenshot_driver import launch, first_run, tap, scroll_to_tappable, shot
from native_anatomy_screenshots import route

launch()
first_run()
tap('Vault')
scroll_to_tappable('Simulator & Anatomy')
tap('Simulator & Anatomy')
scroll_to_tappable('Practise a case')
tap('Practise a case')
scroll_to_tappable('Acute Inferior STEMI')
tap('Acute Inferior STEMI')
shot('android-native-selected-stemi-patient')
route('/simulator?tool=stethoscope&scenario=stemi')
scroll_to_tappable('Open 🩺 Steth diagnostic tool')
tap('Open 🩺 Steth diagnostic tool')
shot('android-native-case-auscultation-entry')
