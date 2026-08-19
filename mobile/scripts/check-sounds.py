"""Check the generated audio, since nobody here can listen to it."""
import math, os, struct, subprocess, sys, wave

def read(path):
    with wave.open(path, 'rb') as f:
        assert f.getnchannels() == 1 and f.getsampwidth() == 2, path
        rate = f.getframerate()
        raw = f.readframes(f.getnframes())
    data = [v / 32768.0 for (v,) in struct.iter_unpack('<h', raw)]
    return rate, data

def goertzel(data, rate, freq):
    """Energy at one frequency, without a full FFT."""
    n = len(data)
    k = int(0.5 + n * freq / rate)
    w = 2 * math.pi * k / n
    coeff = 2 * math.cos(w)
    s1 = s2 = 0.0
    for x in data:
        s0 = x + coeff * s1 - s2
        s2, s1 = s1, s0
    return abs(complex(s1 - s2 * math.cos(w), s2 * math.sin(w))) / n

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res', 'raw')

# First: are the committed files still what the generator produces? Editing a
# wav by hand would be reverted by the next `make-sounds.py` run without
# anyone noticing.
regen = subprocess.run(
    [sys.executable, os.path.join(HERE, 'make-sounds.py'), '--check'],
    capture_output=True, text=True,
)
sys.stdout.write(regen.stdout)
ok = regen.returncode == 0

for path, expect in [('tap.wav', None), ('chime.wav', [880.0, 1108.73, 1318.51])]:
    rate, d = read(os.path.join(RES, path))
    peak = max(abs(x) for x in d)
    rms = math.sqrt(sum(x * x for x in d) / len(d))
    dc = sum(d) / len(d)
    print(f"{path}: {len(d)/rate*1000:.0f}ms  peak {peak:.3f}  rms {rms:.4f}  dc {dc:+.5f}")
    # A step at either end is an audible click on top of the intended sound.
    for name, v in (('first', d[0]), ('last', d[-1])):
        if abs(v) > 0.02:
            print(f"  FAIL {name} sample is {v:+.4f} — that is a discontinuity")
            ok = False
    if peak > 0.95:
        print(f"  FAIL peak {peak:.3f} risks clipping"); ok = False
    if abs(dc) > 0.01:
        print(f"  FAIL DC offset {dc:+.4f}"); ok = False
    if expect:
        # Each intended note must dominate a neighbouring non-note frequency.
        for f in expect:
            here = goertzel(d[:rate], rate, f)
            off = goertzel(d[:rate], rate, f * 1.12)
            verdict = 'ok' if here > off * 2 else 'FAIL'
            if verdict == 'FAIL': ok = False
            print(f"  {verdict} {f:7.1f}Hz energy {here:.5f} vs off-note {off:.5f}")
    else:
        # A UI click should be biased high: a phone speaker cannot reproduce
        # low frequencies, so energy down there is wasted headroom.
        low = goertzel(d, rate, 220)
        high = goertzel(d, rate, 1850)
        verdict = 'ok' if high > low * 3 else 'FAIL'
        if verdict == 'FAIL': ok = False
        print(f"  {verdict} 1850Hz {high:.5f} vs 220Hz {low:.5f} (click must sit high)")
print('\nOK' if ok else '\nPROBLEMS FOUND')
sys.exit(0 if ok else 1)
