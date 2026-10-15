"""Independent installed-Android checks for the five Vault entry routes.

Only synthetic local flashcards are created. AI note generation, file pickers,
external sharing and cloud sync are outside this route audit.
"""
import json
import time
from native_screenshot_driver import OUT, adb, launch, first_run, tap, wait_visible, scroll_to_tappable, shot


def press(label):
    scroll_to_tappable(label)
    tap(label)


def enter(label, value):
    press(label)
    adb('shell', 'input', 'text', value.replace(' ', '%s'))
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(.5)


def capture(name):
    shot('vault-android-' + name)


def setup():
    adb('shell', 'svc', 'wifi', 'enable', check=False)
    launch()
    first_run()
    tap('Vault')
    wait_visible('Your study space')


def notes():
    capture('home')
    press('Notes')
    wait_visible('Handwritten Notes')
    capture('notes-years')
    press('1st Year, browse subjects')
    wait_visible('Anatomy')
    capture('notes-subjects')
    press('Anatomy, see topics')
    wait_visible('topics')
    capture('notes-anatomy-topics')
    tap('Back')
    wait_visible('Subjects')
    tap('Back')
    wait_visible('Handwritten Notes')
    tap('Back')
    wait_visible('Your study space')


def proformas():
    press('Case proformas')
    wait_visible('Clinical Case Proformas')
    capture('proforma-library')
    press('Open Cardiovascular System')
    wait_visible('Proforma Guide')
    capture('proforma-guide')
    tap('Clerk Patient (Edit Mode)')
    capture('proforma-clerk')
    tap('Professor Viva Q&A')
    capture('proforma-viva')
    tap('Close proforma viewer')
    wait_visible('Your study space')


def pg():
    press('NEET-PG practice questions')
    wait_visible('Practice questions')
    capture('pg-bank')
    press('Official exam information')
    capture('pg-exam-information')
    tap('Close PG entrance bank')
    wait_visible('Your study space')


def flashcards():
    press('Anki flashcards')
    wait_visible('Anki-style cards')
    capture('flashcard-hub')
    press('Your own decks, write and study your own cards')
    wait_visible('Decks you write')
    enter('Name for the new deck', 'Android QA parity')
    press('Create this deck')
    enter('Front of the card, the question', 'Native QA question')
    enter('Back of the card, the answer', 'Native QA answer')
    press('Add this card')
    wait_visible('Native QA question')
    capture('flashcard-written')
    tap('Go back')
    press('Android QA parity, 1 cards, study')
    wait_visible('Native QA question')
    capture('flashcard-study')
    press('Show answer')
    wait_visible('Native QA answer')
    capture('flashcard-answer')
    press('Good, next in')
    wait_visible('0 new · 1 learning · 0 to review')
    wait_visible('Native QA question')
    press('Show answer')
    press('Easy, next in')
    wait_visible('Nothing due right now')
    capture('flashcard-scheduled')
    tap('Go back')
    press('Delete Android QA parity')
    wait_visible('No decks yet')


def simulator():
    press('Simulator & Anatomy')
    wait_visible('Explore 3D anatomy')
    capture('simulator-studio')
    tap('Back to Vault')
    wait_visible('Your study space')


def main():
    results = []
    failures = []
    for name, suite in [('notes', notes), ('proformas', proformas), ('pg', pg), ('flashcards', flashcards), ('simulator', simulator)]:
        try:
            setup()
            suite()
            results.append(name)
        except Exception as error:
            failures.append({'suite': name, 'error': repr(error)})
            shot('vault-android-failure-' + name)
        finally:
            (OUT / 'vault-route-checks.json').write_text(json.dumps({'status': 'NOT_CERTIFIED', 'passed': results, 'failures': failures, 'notTested': ['AI generation', 'file import/export', 'cloud sync', 'all note contents']}, indent=2))
    if failures:
        raise SystemExit('Vault route failures: ' + repr(failures))


if __name__ == '__main__':
    main()
