"""Finish native checks after verifying ECG overlay returns to an offscreen section."""
import json
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path('mobile/scripts').resolve()))
from native_screenshot_driver import launch, first_run, tap, scroll_to_tappable, shot, OUT, adb, visible, dump_ui
from native_clinical_studio_screenshots import expect, press
screenshot=shot

def main():
    results=[]
    failures=[]
    try:
        launch()
        first_run()
        tap('Vault')
        scroll_to_tappable('Simulator & Anatomy')
        tap('Simulator & Anatomy')
        scroll_to_tappable('12-lead ECG')
        tap('12-lead ECG')
        expect('Static synthetic ECG with calibrated grid')
        scroll_to_tappable('Open full ECG teaching studio')
        tap('Open full ECG teaching studio')
        expect('Static synthetic ECG with calibrated grid', tries=20)
        shot('android-full-ecg-teaching-before-close')
        tap('Close diagnostic tool')
        scroll_to_tappable('WAVE GUIDE')
        expect('WAVE GUIDE')
        shot('android-ecg-return-native-wave-guide')
        results.append('Full ECG teaching closes back to the native paper and wave guide')
        # Cold offline check: native ICU/case/ECG use the embedded physiology.
        # Verify native screens without network access.
        tap("Back to clinical studio")
        expect("Explore 3D anatomy")
        adb("shell","svc","wifi","disable",check=False)
        adb("shell","svc","data","disable",check=False)
        scroll_to_tappable("Open live monitor")
        tap("Open live monitor")
        expect("SWEEP 25 mm/s")
        screenshot("11-android-offline-icu-monitor")
        results.append("Offline native ICU")
        tap("Back to clinical studio")
        expect("Explore 3D anatomy")
        scroll_to_tappable('12-lead ECG')
        tap('12-lead ECG')
        expect('Static synthetic ECG with calibrated grid')
        shot('android-offline-native-ecg')
        results.append('Native ECG opens offline')
        tap('Back to clinical studio')
        # Both MRI and chest references must render offline from packaged assets.
        scroll_to_tappable("X-ray & MRI")
        tap("X-ray & MRI")
        expect("CHEST CASE LIBRARY")
        expect("Normal PA chest")
        expect("Normal adult posteroanterior chest radiograph")
        time.sleep(2)
        if visible("unavailable") or visible("RADIOLOGY_"):
            raise AssertionError("Offline native raster renderer failed")
        screenshot("12-android-offline-native-xray")
        scroll_to_tappable("Next →")
        tap("Next →")
        expect("Large left pneumothorax")
        screenshot("13-android-native-xray-case")
        press("Brain MRI")
        scroll_to_tappable("Slice")
        expect("Slice 57 / 112")
        time.sleep(2)
        scroll_to_tappable("axial MRI slice 57")
        expect("axial MRI slice 57")
        screenshot("14-android-offline-native-mri-axial")
        press("Coronal")
        expect("Slice 65 / 128")
        scroll_to_tappable("coronal MRI slice 65")
        expect("coronal MRI slice 65")
        screenshot("15-android-offline-native-mri-coronal")
        press("Sagittal")
        expect("Slice 57 / 112")
        scroll_to_tappable("sagittal MRI slice 57")
        expect("sagittal MRI slice 57")
        screenshot("16-android-offline-native-mri-sagittal")
        press("Full screen")
        expect("Close full screen")
        screenshot("17-android-native-radiology-fullscreen")
        tap("Close full screen")
        tap("Back to clinical studio")
        results.append("Offline X-ray case navigation, all MRI planes and fullscreen")
        scroll_to_tappable("Clubbing")
        tap("Clubbing")
        expect("Clubbing examination")
        tap("Clubbing findings")
        expect("Clinical reference photograph")
        screenshot("18-android-offline-native-clubbing")
        scroll_to_tappable("Reveal answer")
        tap("Reveal answer")
        expect("No. Look for another cause")
        screenshot("19-android-native-clubbing-viva")
        tap("Close clubbing skill")
        results.append("Offline clubbing reference, examination findings and viva reveal")
    except Exception as error:
        failures.append({'error':repr(error)})
        shot('native-remaining-FAILURE')
        import xml.etree.ElementTree as ET
        (OUT/'native-remaining-failure-ui.xml').write_text(ET.tostring(dump_ui(),encoding='unicode'))
        raise
    finally:
        adb('shell','svc','wifi','enable',check=False)
        adb('shell','svc','data','enable',check=False)
        (OUT/'native-remaining-checks.json').write_text(json.dumps({'passed':results,'failures':failures},indent=2))

if __name__=='__main__':
    main()
