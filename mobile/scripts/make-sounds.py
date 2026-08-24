"""
Synthesise the app's two sounds.

Generated rather than sourced, so they can be tuned to the app instead of the
app being tuned around a stock file — and so nothing is shipped whose licence
has to be traced later.

The design rules behind both, which matter more than the arithmetic:

  * **A UI click fires thousands of times a day.** Anything with a recognisable
    pitch becomes a tune you cannot stop hearing, so the tap is mostly a
    filtered transient with only a hint of tone. It is short (~45ms), quiet,
    and biased towards the frequencies a phone speaker can actually reproduce
    — a click with energy at 200Hz is inaudible on a phone and wastes headroom.

  * **Every envelope has an attack.** Starting a waveform at full amplitude puts
    a step discontinuity in the signal, which is itself an audible click — a
    dirty one, on top of the intended sound. 2ms of ramp removes it. The same
    applies at the end: both sounds fade to true zero rather than being cut.

  * **A completion is not an alarm.** The chime rises through a major triad and
    resolves; it does not repeat or demand anything. Higher partials decay
    faster than the fundamental, which is what makes a tone sound *struck* —
    a bell or a marimba — rather than switched on like an organ.
"""
import math
import struct
import wave

RATE = 44100


def write(path, samples):
    """16-bit mono PCM. SoundPool decodes this with no work at play time."""
    peak = max(abs(s) for s in samples) or 1.0
    frames = bytearray()
    for s in samples:
        # Normalise, then leave 1dB of headroom so no player clips it.
        value = int(max(-1.0, min(1.0, s / peak * 0.89)) * 32767)
        frames += struct.pack('<h', value)
    with wave.open(path, 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(bytes(frames))
    return len(samples) / RATE


def envelope(i, n, attack_ms=2.0, decay=None):
    """Ramped attack, exponential decay, forced to zero at the end."""
    attack = max(1, int(RATE * attack_ms / 1000))
    a = i / attack if i < attack else 1.0
    d = math.exp(-i / (RATE * (decay or 0.02)))
    # The last 3ms taper to zero so the file cannot end on a step.
    tail = int(RATE * 0.003)
    t = 1.0 if i < n - tail else max(0.0, (n - i) / tail)
    return a * d * t


def tap():
    """
    A soft, short click.

    Two partials an octave apart rather than one: a single sine reads as a
    beep, two with different decays read as a tap on a surface. The noise is
    what stops it sounding synthetic, and it is deliberately faint — noise is
    what makes a click sound cheap when there is too much of it.
    """
    n = int(RATE * 0.045)
    out = []
    # Deterministic pseudo-noise: no seed to remember, same file every build.
    noise = 0.0
    for i in range(n):
        t = i / RATE
        noise = (noise * 0.55) + math.sin(i * 12.9898) * math.sin(i * 78.233) * 0.45
        body = (
            math.sin(2 * math.pi * 1850 * t) * 0.62
            + math.sin(2 * math.pi * 3700 * t) * 0.22 * math.exp(-t / 0.006)
            + noise * 0.16 * math.exp(-t / 0.004)
        )
        out.append(body * envelope(i, n, attack_ms=1.2, decay=0.011))
    return out


def chime():
    """
    A finished focus session: three notes up an A major triad.

    A5, C#6, E6. Rising and resolved — the shape of "done", not "attend to
    me". Each note is struck rather than switched on: the second and third
    partials decay four and eight times faster than the fundamental, which is
    the whole difference between a bell and an organ.
    """
    notes = [(880.0, 0.00), (1108.73, 0.135), (1318.51, 0.270)]
    length = int(RATE * 1.45)
    out = [0.0] * length
    for freq, start in notes:
        offset = int(RATE * start)
        for i in range(length - offset):
            t = i / RATE
            partials = (
                math.sin(2 * math.pi * freq * t) * math.exp(-t / 0.55)
                # Slightly sharp, as struck metal is — dead-exact harmonics
                # sound synthetic.
                + math.sin(2 * math.pi * freq * 2.01 * t) * 0.34 * math.exp(-t / 0.14)
                + math.sin(2 * math.pi * freq * 2.99 * t) * 0.13 * math.exp(-t / 0.07)
            )
            out[offset + i] += partials * envelope(i, length - offset, attack_ms=4.0, decay=1e9)
    return out


def tap_soft():
    """
    A lower, rounder click — the same gesture heard through felt.

    One partial and a slower decay. For people who find the default too
    bright, which on a phone speaker it can be.
    """
    n = int(RATE * 0.05)
    out = []
    for i in range(n):
        t = i / RATE
        body = (
            math.sin(2 * math.pi * 900 * t) * 0.7
            + math.sin(2 * math.pi * 1800 * t) * 0.12 * math.exp(-t / 0.008)
        )
        out.append(body * envelope(i, n, attack_ms=2.5, decay=0.016))
    return out


def tap_crisp():
    """
    A dry, high tick, closer to a mechanical key than a tap on glass.

    Short and noise-led. The one to pick when the phone is in a pocket and
    the softer clicks are inaudible.
    """
    n = int(RATE * 0.032)
    out = []
    noise = 0.0
    for i in range(n):
        t = i / RATE
        noise = (noise * 0.35) + math.sin(i * 12.9898) * math.sin(i * 78.233) * 0.65
        body = (
            math.sin(2 * math.pi * 2600 * t) * 0.5
            + noise * 0.38 * math.exp(-t / 0.0025)
        )
        out.append(body * envelope(i, n, attack_ms=0.6, decay=0.007))
    return out


def chime_bell():
    """
    A single struck bell rather than a triad.

    One note with inharmonic partials and a long tail — less musical than the
    default, and easier to hear across a room.
    """
    freq = 1046.5  # C6
    length = int(RATE * 1.9)
    out = []
    for i in range(length):
        t = i / RATE
        partials = (
            math.sin(2 * math.pi * freq * t) * math.exp(-t / 0.8)
            + math.sin(2 * math.pi * freq * 2.76 * t) * 0.3 * math.exp(-t / 0.2)
            + math.sin(2 * math.pi * freq * 5.4 * t) * 0.11 * math.exp(-t / 0.09)
        )
        out.append(partials * envelope(i, length, attack_ms=3.0, decay=1e9))
    return out


def chime_soft():
    """
    Two notes, a fifth apart, quiet and slow.

    For finishing a session somewhere a bell would be rude. Still rises, so
    it still reads as "done".
    """
    notes = [(659.25, 0.0), (987.77, 0.22)]  # E5 -> B5
    length = int(RATE * 1.6)
    out = [0.0] * length
    for freq, start in notes:
        offset = int(RATE * start)
        for i in range(length - offset):
            t = i / RATE
            partials = (
                math.sin(2 * math.pi * freq * t) * math.exp(-t / 0.7)
                + math.sin(2 * math.pi * freq * 2.0 * t) * 0.16 * math.exp(-t / 0.18)
            )
            out[offset + i] += partials * 0.75 * envelope(i, length - offset, attack_ms=8.0, decay=1e9)
    return out


def chime_digital():
    """
    Three short square-ish beeps — a kitchen timer, not an instrument.

    The other alerts decay like something struck; this one holds and stops,
    which is what makes it read as a machine telling you the time is up rather
    than a note ending. Built from odd harmonics rather than a true square wave
    because a real square is all edges and aliases badly at this sample rate;
    five partials is enough to sound square and stays clean.

    It still has an attack and a release. Starting or stopping a held waveform
    at full amplitude is a step discontinuity, and that is an audible click on
    top of the beep — the one rule every clip in this file obeys.
    """
    freq = 880.0  # A5, well inside what a phone speaker can reproduce
    beep = 0.11
    gap = 0.07
    count = 3
    length = int(RATE * (count * beep + (count - 1) * gap))
    out = [0.0] * length
    for n in range(count):
        offset = int(RATE * n * (beep + gap))
        span = int(RATE * beep)
        for i in range(span):
            if offset + i >= length:
                break
            t = i / RATE
            square = 0.0
            for harmonic in (1, 3, 5, 7, 9):
                square += math.sin(2 * math.pi * freq * harmonic * t) / harmonic
            # 4/pi normalises the partial sum back to roughly unit amplitude.
            out[offset + i] += square * (4 / math.pi) * 0.22 * envelope(
                i, span, attack_ms=4.0, decay=1e9
            ) * (1.0 if i < span - int(RATE * 0.006) else 0.0)
    return out


import os
import sys

RES = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'android', 'app', 'src', 'main', 'res', 'raw',
)


def render():
    """
    Every clip that ships.

    The names are the contract: SoundModule loads each as R.raw.<name> and
    src/lib/sound.ts plays them by the same string, so adding one here means
    adding it in both of those and in the Settings picker. check:sounds
    verifies each file is present and has the pitch it is supposed to.
    """
    return {
        'tap.wav': tap(),
        'tap_soft.wav': tap_soft(),
        'tap_crisp.wav': tap_crisp(),
        'chime.wav': chime(),
        'chime_bell.wav': chime_bell(),
        'chime_soft.wav': chime_soft(),
        'chime_digital.wav': chime_digital(),
    }


def main():
    check = '--check' in sys.argv
    root = os.path.abspath(RES)
    os.makedirs(root, exist_ok=True)
    failures = 0
    for name, samples in render().items():
        path = os.path.join(root, name)
        if check:
            # The generator is deterministic — no seeds, no time, no random —
            # so a committed file that does not match it byte for byte means
            # someone edited the wav instead of the code that makes it, and
            # the next run of this script would silently revert them.
            import io, tempfile
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                pass
            write(tmp.name, samples)
            fresh = open(tmp.name, 'rb').read()
            os.unlink(tmp.name)
            if not os.path.exists(path):
                print(f'FAIL {name} is missing')
                failures += 1
            elif open(path, 'rb').read() != fresh:
                print(f'FAIL {name} does not match what this script generates')
                failures += 1
            else:
                print(f'ok   {name}')
        else:
            seconds = write(path, samples)
            print(f'wrote {name} ({seconds * 1000:.0f}ms)')
    if check:
        print('\nOK' if not failures else f'\n{failures} FAILED')
    sys.exit(1 if failures else 0)


main()
