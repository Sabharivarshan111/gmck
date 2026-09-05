"""Synthesise the three reels' music beds.

Generated rather than sourced, and that is a licence decision before it is a
creative one. These reels advertise a paid app, which rules out every "free for
personal/non-commercial use" library outright, and rules out anything whose
provenance cannot be checked — a user-uploaded track on a free-stock site is
warranted by the uploader, not by the site, and an advertiser who cannot name
the composer cannot answer a claim. See `.agents/video/REEL-RESEARCH.md` for
what was actually checked and what the licence-clear alternatives are if the
owner would rather have a real recording.

What comes out of here is original, owned outright, deterministic (the same
bytes on every run, so a re-render never quietly changes the soundtrack), and
tuned to the edit: each bed's sections land on that reel's own beats.

The synthesis rules are the ones `mobile/scripts/make-sounds.py` already
follows, for the same reasons:

  * **Every envelope has an attack.** Starting a waveform at full amplitude is
    a step discontinuity, which is an audible click on top of the intended
    sound. Every note here ramps in, and every track fades from and to true
    zero.

  * **Nothing is allowed to clip.** The mix is normalised to its own peak with
    a decibel of headroom, so no player has to decide what to do with a sample
    past full scale.

  * **A bed is not a song.** It has no melody worth following. A tune under a
    voiceover competes with the voiceover, and under a *silent* cut it has to
    carry the film without ever becoming the thing being watched — so these are
    a pad, a pulse and a plucked arpeggio, moving in eight-bar blocks.

Usage:  python3 scripts/make-beds.py        (writes public/audio/bed/*.wav)
"""

import math
import pathlib
import struct
import wave

RATE = 44100
SECONDS = 60.0
TOTAL = int(RATE * SECONDS)
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "audio" / "bed"


def midi(n: int) -> float:
    """Equal temperament, A4 = 440Hz at MIDI 69."""
    return 440.0 * (2.0 ** ((n - 69) / 12.0))


# Chords as MIDI note numbers. Written low because a bed lives under a voice:
# anything in the 200-800Hz band is exactly where speech is, and a pad sitting
# there is what makes a mix sound muddy no matter how quiet it is.
PROGRESSIONS = {
    # Confident, forward, unresolved on purpose — the reel is an open loop.
    "repeats": [[45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 64, 67], [43, 50, 59, 62]],
    # Lower and darker for the 2AM pain hook, resolving as the relief arrives.
    "six-hours": [[38, 45, 53, 57], [34, 41, 50, 53], [41, 48, 57, 60], [36, 43, 52, 55]],
    # Brighter and higher: this one is a challenge, not a worry.
    "draw-it": [[40, 47, 55, 59], [36, 43, 52, 55], [43, 50, 59, 62], [38, 45, 54, 57]],
    # The mascot ad. Warm and major, and the only bed here that spends the
    # whole minute under a *voice* that is deliberately unhurried — so it is
    # the sparsest of the six and never adds a layer while a line is landing.
    "guide": [[45, 52, 61, 64], [43, 50, 59, 62], [40, 47, 57, 59], [41, 48, 57, 60]],
    # "Every function": a catalogue, so the bed is a steady inventory rather
    # than an arc. It repeats without developing on purpose — the pictures are
    # what change, and a bed that keeps arriving somewhere new competes.
    "functions": [[45, 52, 60, 64], [45, 52, 59, 64], [47, 54, 62, 66], [43, 50, 59, 62]],
    # "One question, end to end": a sequence, so this one does move. It steps
    # up a tone across the four bars and lands back at the start, which is what
    # a loop that is going somewhere sounds like.
    "one-question": [[41, 48, 57, 60], [43, 50, 59, 62], [45, 52, 60, 64], [40, 47, 55, 59]],
    # The mascot's second ad: it works one question through from the list to a
    # ticked box, so this moves where "guide" holds still. Same key family as
    # "guide" -- it is the same character, and a bed in an unrelated key makes
    # two ads about one mascot sound like two different products.
    "guide-answer": [[45, 52, 61, 64], [47, 54, 62, 66], [43, 50, 59, 62], [40, 47, 57, 59]],
    # The mascot's third: the night before the exam. The same key again, taken
    # an octave's worth of mood down -- lower voicings, minor colour, and it
    # resolves, because this one ends with the morning rather than a cliff.
    "guide-night": [[40, 47, 55, 59], [36, 43, 52, 55], [38, 45, 53, 57], [41, 48, 57, 60]],
}

# Bars per reel, chosen so a bar boundary lands near that script's own turns.
# 60s at these tempos is a whole number of bars, which is what lets the last
# bar end exactly on the cut rather than being faded out mid-phrase.
#
# **A bar is four beats, so `bars * 4` is the bed's tempo in beats per minute.**
# That is not trivia: the two subtitle-led reels declare a `bpm` in their script
# and cut on that grid, and the bed under them has to be the same tempo or the
# picture and the music are two rhythms in one film. Keep these two in step:
#
#   bed-functions      25 bars -> 100 beats in 60s -> reelFunctions    bpm: 100
#   bed-one-question   30 bars -> 120 beats in 60s -> reelOneQuestion  bpm: 120
#
# The other four are cut in frames rather than beats, so their bar count only
# has to make the sections land near their own turns.
TEMPOS = {
    "repeats": 25,
    "six-hours": 24,
    "draw-it": 26,
    "guide": 22,
    "guide-answer": 24,
    "guide-night": 20,
    "functions": 25,
    "one-question": 30,
}  # bars in 60 seconds


def sections(name: str, bar: float):
    """
    Layer gains at a point in the track, as (pad, pulse, arp, sub).

    `bar` is fractional bars from the start. Each reel's structure is written
    against its own edit: the hook is bare, the product arrival brings the
    pulse in, and the last two bars drop back so the call to action is the
    loudest thing in the frame rather than competing with a full mix.
    """
    total = TEMPOS[name]
    end = bar > total - 2.0

    if name == "six-hours":
        # Pain hook: almost nothing for two bars, then everything at once when
        # the app arrives at ~5.5s, because that cut is the whole argument.
        if bar < 2.0:
            return (0.9, 0.0, 0.0, 0.35)
        if bar < 4.0:
            return (0.8, 0.5, 0.25, 0.8)
        if end:
            return (0.7, 0.25, 0.0, 0.5)
        return (0.7, 0.85, 0.6, 1.0)

    if name == "guide":
        # A tour with a host. The bed opens almost bare so the first thing
        # heard is her voice rather than a synthesiser, brings the pulse in as
        # the product arrives at ~2.5s, and drops back under the close.
        if bar < 1.0:
            return (0.85, 0.0, 0.3, 0.3)
        if end:
            return (0.7, 0.25, 0.25, 0.45)
        # Lower everywhere than the silent beds: there is a voice on top of
        # this one for three quarters of its length.
        return (0.62, 0.6, 0.5, 0.8)

    if name == "guide-answer":
        # The same host, working rather than touring. It opens as bare as
        # "guide" because the first thing heard has to be her, then holds a
        # steady pulse through the middle: this ad follows one question from
        # the list to a ticked box, so the bed keeps time rather than building
        # to anything.
        if bar < 1.0:
            return (0.85, 0.0, 0.25, 0.3)
        if end:
            return (0.7, 0.25, 0.2, 0.45)
        return (0.62, 0.7, 0.45, 0.85)

    if name == "guide-night":
        # Two in the morning. The quietest bed here: no pulse at all for the
        # first two bars, because the ad opens on the host saying it is late
        # and a beat under that line would contradict it. It lifts only at the
        # end, where the morning arrives.
        if bar < 2.0:
            return (0.8, 0.0, 0.0, 0.3)
        if bar < 4.0:
            return (0.72, 0.35, 0.2, 0.6)
        if end:
            return (0.75, 0.4, 0.35, 0.6)
        return (0.6, 0.55, 0.4, 0.8)

    if name == "functions":
        # A catalogue, cut every four to six beats. The pulse is the spine and
        # it is in from bar one, because the very first cut is on a beat and a
        # bed that has not started yet makes that cut look accidental.
        if bar < 1.0:
            return (0.85, 0.7, 0.3, 0.7)
        if end:
            return (0.7, 0.4, 0.2, 0.55)
        return (0.7, 0.95, 0.7, 1.0)

    if name == "one-question":
        # Faster and tighter. It is a sequence, so this one builds: the arp
        # arrives with the written answer at ~8s and never leaves.
        if bar < 1.0:
            return (0.9, 0.75, 0.0, 0.75)
        if bar < 4.0:
            return (0.8, 0.9, 0.45, 0.95)
        if end:
            return (0.72, 0.45, 0.25, 0.55)
        return (0.7, 1.0, 0.8, 1.0)

    if name == "draw-it":
        # A challenge: the pluck is in from the first bar, the pulse joins on
        # the second, and it never lets up until the CTA.
        if bar < 1.0:
            return (0.85, 0.0, 0.55, 0.3)
        if end:
            return (0.75, 0.3, 0.2, 0.5)
        return (0.7, 0.9, 0.75, 1.0)

    # repeats — a count, so it starts as a pulse and accumulates.
    if bar < 1.0:
        return (0.9, 0.45, 0.0, 0.4)
    if bar < 3.0:
        return (0.8, 0.75, 0.35, 0.8)
    if end:
        return (0.7, 0.3, 0.15, 0.5)
    return (0.7, 0.9, 0.65, 1.0)


def build(name: str) -> list:
    bars = TEMPOS[name]
    bar_seconds = SECONDS / bars
    beat = bar_seconds / 4.0
    chords = PROGRESSIONS[name]

    out = [0.0] * TOTAL

    # ---- pad ------------------------------------------------------------
    # One long note per bar per chord tone, with a slow tremolo so a held pad
    # does not sit perfectly still — a motionless pad reads as a synthesiser
    # left switched on rather than as music.
    for b in range(bars):
        chord = chords[b % len(chords)]
        start = int(b * bar_seconds * RATE)
        length = int(bar_seconds * RATE) + int(0.25 * RATE)
        for note in chord:
            f = midi(note)
            for i in range(length):
                s = start + i
                if s >= TOTAL:
                    break
                t = i / RATE
                # 40ms attack, gentle release into the next bar.
                env = min(1.0, t / 0.04) * min(1.0, (length - i) / (0.30 * RATE))
                trem = 0.88 + 0.12 * math.sin(2 * math.pi * 0.23 * (s / RATE) + note)
                v = (
                    math.sin(2 * math.pi * f * t)
                    + 0.34 * math.sin(2 * math.pi * f * 2 * t)
                    + 0.14 * math.sin(2 * math.pi * f * 3 * t)
                )
                gain = sections(name, s / (bar_seconds * RATE))[0]
                out[s] += v * env * trem * gain * 0.16

    # ---- sub pulse ------------------------------------------------------
    # A low sine on every beat, decaying fast. This is the metronome the eye
    # cuts against; it is felt on a phone speaker rather than heard.
    for b in range(bars):
        root = chords[b % len(chords)][0] - 12
        f = midi(root)
        for k in range(4):
            start = int((b * bar_seconds + k * beat) * RATE)
            length = int(0.34 * RATE)
            for i in range(length):
                s = start + i
                if s >= TOTAL:
                    break
                t = i / RATE
                env = min(1.0, t / 0.006) * math.exp(-t / 0.11)
                gain = sections(name, s / (bar_seconds * RATE))[3]
                # Beat 1 is the downbeat; the others sit back so the bar has a
                # shape rather than being four identical thuds.
                accent = 1.0 if k == 0 else 0.55
                out[s] += math.sin(2 * math.pi * f * t) * env * gain * accent * 0.5

    # ---- eighth-note pulse ----------------------------------------------
    # A short, high, filtered tick. It is what makes the cut feel paced; it is
    # deliberately above the voice band so it never fights the voiceover.
    for b in range(bars):
        for k in range(8):
            start = int((b * bar_seconds + k * beat / 2) * RATE)
            length = int(0.08 * RATE)
            for i in range(length):
                s = start + i
                if s >= TOTAL:
                    break
                t = i / RATE
                env = min(1.0, t / 0.003) * math.exp(-t / 0.018)
                gain = sections(name, s / (bar_seconds * RATE))[1]
                v = math.sin(2 * math.pi * 2400 * t) * 0.6 + math.sin(2 * math.pi * 3600 * t) * 0.3
                out[s] += v * env * gain * (1.0 if k % 2 == 0 else 0.5) * 0.16

    # ---- arpeggio --------------------------------------------------------
    # The chord's own notes, an octave up, one per eighth. Plucked: the higher
    # partial decays faster than the fundamental, which is what makes a tone
    # sound struck rather than switched on.
    for b in range(bars):
        chord = chords[b % len(chords)]
        pattern = [chord[2], chord[3], chord[2] + 12, chord[3], chord[2], chord[3] + 12, chord[2], chord[3]]
        for k, note in enumerate(pattern):
            f = midi(note + 12)
            start = int((b * bar_seconds + k * beat / 2) * RATE)
            length = int(0.42 * RATE)
            for i in range(length):
                s = start + i
                if s >= TOTAL:
                    break
                t = i / RATE
                env = min(1.0, t / 0.004) * math.exp(-t / 0.13)
                gain = sections(name, s / (bar_seconds * RATE))[2]
                v = math.sin(2 * math.pi * f * t) + 0.3 * math.sin(2 * math.pi * f * 2 * t) * math.exp(-t / 0.05)
                out[s] += v * env * gain * 0.11

    return out


def write(path: pathlib.Path, samples: list) -> None:
    """16-bit mono PCM, normalised with a decibel of headroom."""
    fade_in = int(0.5 * RATE)
    fade_out = int(1.6 * RATE)
    n = len(samples)
    peak = max(abs(s) for s in samples) or 1.0

    frames = bytearray()
    for i, s in enumerate(samples):
        # True zero at both ends: a track that starts or stops on a non-zero
        # sample puts a click into the ad.
        f = 1.0
        if i < fade_in:
            f = i / fade_in
        elif i > n - fade_out:
            f = max(0.0, (n - i) / fade_out)
        v = max(-1.0, min(1.0, s / peak * 0.89)) * f
        frames += struct.pack("<h", int(v * 32767))

    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(frames))


def main() -> None:
    """
    Build every bed named in TEMPOS.

    This used to walk a hardcoded tuple of six names while the closing line
    counted `len(TEMPOS)`, so adding a seventh entry printed "8 music beds
    written" and wrote six — a reel would then have gone to render naming a bed
    that was never built. `TEMPOS` is the one place a bed is declared, and this
    reads it, for the same reason `voice-manifest.mjs` reads ALL_SCRIPTS rather
    than its own list.
    """
    OUT.mkdir(parents=True, exist_ok=True)
    for name in TEMPOS:
        target = OUT / f"bed-{name}.wav"
        write(target, build(name))
        size = target.stat().st_size
        print(f"  bed-{name}.wav  {size / 1024 / 1024:.1f}MB  {SECONDS:.0f}s  {TEMPOS[name]} bars")
        if size < 1_000_000:
            raise SystemExit(f"{target.name} came out {size} bytes — that is not 60 seconds of audio.")
    print(f"\n{len(TEMPOS)} music beds written to {OUT}")


if __name__ == "__main__":
    main()
