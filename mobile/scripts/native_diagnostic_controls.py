"""Independent actual-device checks for native radiology and clubbing controls."""
import json
import re
import time
from native_screenshot_driver import (
    OUT, adb, launch, first_run, tap, scroll_to_tappable, dump_ui,
    node_label, shot, wait_visible, visible, scroll_up, reachable_nodes,
)


def bounds(label):
    nodes = [n for n in dump_ui().iter('node') if label in node_label(n)]
    nodes.sort(key=lambda n: len(node_label(n)))
    for node in nodes:
        numbers = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
        if len(numbers) == 4 and numbers[2] > numbers[0] and numbers[3] > numbers[1]:
            return numbers
    raise RuntimeError('No visible bounds: ' + label)


def slider_value(label):
    for node in dump_ui().iter('node'):
        if label in node_label(node) and node.get('range-now') is not None:
            return float(node.get('range-now'))
    raise RuntimeError('No real Android accessibility range for ' + label)


def adjust_slider(label, fraction=.82):
    scroll_to_tappable(label, adjustable=True)
    before = slider_value(label)
    # Match the actual adjustable control, not an image whose description
    # includes the same phrase (e.g. axial MRI slice 56).
    slider = next(n for n in dump_ui().iter('node')
                  if label in node_label(n) and n.get('range-now') is not None)
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', slider.get('bounds', '')))
    adb('shell', 'input', 'tap', str(round(x1 + (x2-x1)*fraction)), str((y1+y2)//2))
    time.sleep(2)
    after = slider_value(label)
    if after == before or not 0 <= after <= 100:
        raise AssertionError(f'{label} did not change within its real range: {before} -> {after}')
    return {'control': label, 'beforePercent': before, 'afterPercent': after}


def open_skill(label):
    launch()
    first_run()
    tap('Vault')
    scroll_to_tappable('Simulator & Anatomy')
    tap('Simulator & Anatomy')
    scroll_to_tappable(label)
    tap(label)


def press(label):
    if not visible(label):
        for _ in range(10):
            scroll_up()
            if visible(label):
                break
    scroll_to_tappable(label)
    tap(label)


def toggle(label):
    if not visible(label):
        for _ in range(10):
            scroll_up()
            if visible(label): break
    scroll_to_tappable(label)
    def selected():
        return any(label == node_label(n) and n.get('selected') == 'true' for n in dump_ui().iter('node'))
    before = selected()
    tap(label)
    after = selected()
    if before == after:
        raise AssertionError(f'{label} did not change Android selected state')
    return {'control': label, 'beforeSelected': before, 'afterSelected': after}


def image_points():
    # Fullscreen exposes the complete stage; choose two central points within
    # the displayed image, avoiding the orientation labels and letterboxing.
    press('Full screen')
    wait_visible('Close full screen')
    x1, y1, x2, y2 = bounds('Radiology image stage')
    for fraction in [.43, .57]:
        adb('shell', 'input', 'tap', str(round(x1+(x2-x1)*fraction)), str((y1+y2)//2))
        time.sleep(.4)
    shot('extra-native-radiology-measure-fullscreen')
    tap('Close full screen')


def radiology(results):
    open_skill('X-ray & MRI')
    wait_visible('CHEST CASE LIBRARY')
    wait_visible('Normal adult posteroanterior chest radiograph', tries=15)
    adb('shell', 'svc', 'wifi', 'disable', check=False)
    adb('shell', 'svc', 'data', 'disable', check=False)
    press('Search & categories')
    wait_visible('Search chest X-ray cases')
    press('Chest X-ray category')
    wait_visible('Close category picker')
    tap('Normal')
    press('Show all cases')
    tap('Search chest X-ray cases')
    adb('shell', 'input', 'text', 'pneumothorax')
    adb('shell', 'input', 'keyevent', '4')
    press('Choose a reference')
    wait_visible('Close reference picker')
    tap('Large left pneumothorax')
    wait_visible('Large left pneumothorax')
    press('Show all cases')
    press('Choose a reference')
    tap('Normal PA chest')
    press('Search & categories')
    results.append({'check': 'Native category selection, actual typed case search, filtered picker selection and clear filters', 'passed': True})
    press('Next →')
    wait_visible('Large left pneumothorax')
    press('← Previous')
    wait_visible('Normal PA chest')
    results.append({'check': 'Offline reference picker, search panel and previous/next', 'passed': True})
    for label in ['Radiology Contrast', 'Radiology Brightness', 'Radiology Zoom']:
        results.append({'check': 'Native slider', 'passed': True, **adjust_slider(label)})
    shot('extra-native-radiology-adjustments')
    press('Reset')
    for label, expected in [('Radiology Contrast', 33), ('Radiology Brightness', 38), ('Radiology Zoom', 0)]:
        scroll_to_tappable(label)
        actual = slider_value(label)
        if abs(actual-expected) > 1:
            raise AssertionError(f'Reset left {label} at {actual}%')
    results.append({'check': 'Reset restores all three native slider values', 'passed': True})
    for _ in range(2):
        results.append({'check': 'Native labels toggle', 'passed': True, **toggle('Labels')})
    results.append({'check': 'Move mode', 'passed': True, **toggle('Move')})
    press('Full screen')
    wait_visible('Close full screen')
    x1, y1, x2, y2 = bounds('Radiology image stage')
    x, y = (x1+x2)//2, (y1+y2)//2
    shot('extra-native-radiology-before-pan')
    adb('shell', 'input', 'swipe', str(x), str(y), str(x+round((x2-x1)*.1)), str(y+40), '500')
    shot('extra-native-radiology-after-pan')
    tap('Close full screen')
    toggle('Move')
    press('Reset')
    toggle('Measure')
    image_points()
    scroll_to_tappable('pixels · no X-ray physical calibration')
    if not visible('pixels · no X-ray physical calibration'):
        raise AssertionError('Two-point native X-ray measurement did not produce a pixel distance')
    shot('extra-native-xray-measurement-result')
    results.append({'check': 'Two actual image taps produce a calibrated-as-pixels X-ray measurement', 'passed': True})
    press('Measure')
    press('Hide notes')
    wait_visible('Reveal notes')
    press('Reveal notes')
    press('Compare with similar patterns')
    shot('extra-native-xray-differential')
    press('Image credits and limitations')
    scroll_to_tappable('Original image and source caption')
    shot('extra-native-xray-credits')
    results.append({'check': 'Labels, note reveal/hide, differential and source credits', 'passed': True})
    press('Brain MRI')
    results.append({'check': 'Offline MRI slice adjustment', 'passed': True, **adjust_slider('MRI slice', .7)})
    for plane in ['Axial', 'Coronal', 'Sagittal']:
        press(plane)
        scroll_to_tappable(plane.lower() + ' MRI slice')
        wait_visible(plane.lower() + ' MRI slice', tries=15)
        shot('extra-native-mri-' + plane.lower())
    for _ in range(2):
        results.append({'check': 'MRI crosshair toggle', 'passed': True, **toggle('Crosshair')})
    toggle('Measure')
    image_points()
    scroll_to_tappable('mm · resampled voxel spacing')
    shot('extra-native-mri-measurement-result')
    results.append({'check': 'All MRI planes, crosshair toggle and voxel-spacing measurement', 'passed': True})


def clubbing(results):
    open_skill('Clubbing')
    wait_visible('Clubbing examination')
    wait_visible('What should I find normally?')
    adb('shell', 'svc', 'wifi', 'disable', check=False)
    adb('shell', 'svc', 'data', 'disable', check=False)
    press('How to examine & why')
    scroll_to_tappable('Gently palpate the nail bed')
    shot('extra-native-clubbing-examination-steps')
    press('Clubbing findings')
    wait_visible('Clinical reference photograph', tries=15)
    press('Reveal answer')
    wait_visible('No. Look for another cause')
    press('Hide answer')
    wait_visible('Reveal answer')
    press('Normal findings')
    wait_visible('What should I find normally?')
    shot('extra-native-clubbing-return-normal')
    tap('Close clubbing skill')
    wait_visible('Explore 3D anatomy')
    results.append({'check': 'Normal/abnormal findings, examination steps, answer reveal/hide, return to native studio', 'passed': True})


def main():
    results = []
    failures = []
    for name, suite in [('radiology', radiology), ('clubbing', clubbing)]:
        try:
            suite(results)
        except Exception as error:
            failures.append({'suite': name, 'error': repr(error)})
            shot('extra-native-failure-' + name)
            try:
                import xml.etree.ElementTree as ET
                (OUT / ('extra-native-failure-' + name + '.xml')).write_text(ET.tostring(dump_ui(), encoding='unicode'))
            except Exception:
                pass
        finally:
            adb('shell', 'svc', 'wifi', 'enable', check=False)
            adb('shell', 'svc', 'data', 'enable', check=False)
            (OUT / 'native-extra-controls.json').write_text(json.dumps({'status': 'NOT_CERTIFIED', 'checks': results, 'failures': failures}, indent=2))
    if failures:
        raise SystemExit('Incomplete independent diagnostic checks: ' + repr(failures))


if __name__ == '__main__':
    main()
