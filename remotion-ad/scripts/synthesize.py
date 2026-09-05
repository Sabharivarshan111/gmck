"""Speak every line with Microsoft's neural voices, via edge-tts.

Run after `voice-manifest.mjs`. One mp3 per shot, per ad, named for the shot so
`ShotTimeline` can find it by convention rather than by another index file.

## It also writes down WHEN each word is said

Beside every mp3 this writes a `shot_NN.words.json`: the word, and the
millisecond it starts, straight from the synthesiser.

That file is the fix for the thing the app's owner reported as "nothing audio
syncs with subtitles". The caption used to spread a line's words evenly across
the clip's duration -- so "Two thousand and twenty-five carry a year" gave the
same slice of time to "a" as to "twenty-five", and by the middle of a sentence
the highlighted word was one or two words away from the word being spoken. No
amount of tuning fixes that, because the premise is wrong: words are not the
same length, and only the synthesiser knows how long each one came out.

`edge_tts` reports this as it streams, and it costs nothing extra to keep --
which is why `save()` is not used any more. `save()` throws the boundaries
away, and asking for them is the only reason this now assembles the audio by
hand.

Two rules that are not style choices:

* **Single-language US English voices only.** A `*MultilingualNeural` voice
  reads "M.G.R." and "MBBS" with French phonemes. That shipped once and the ad
  had to be re-cut.
* **A short file is a failure, not a short line.** edge-tts happily writes a
  zero-byte mp3 when the socket is refused, and a silent shot in a finished ad
  is worse than a crash, so anything under 2KB raises.

This needs a network path to `speech.platform.bing.com`. The Claude agent
sandbox's proxy returns 403 on the WebSocket upgrade, so this runs in CI. If you
run it somewhere that intercepts TLS, append the proxy CA to certifi first:

    cat /path/to/ca-bundle.crt >> "$(python3 -c 'import certifi;print(certifi.where())')"
"""

import asyncio
import json
import pathlib
import sys

import edge_tts

AUDIO = pathlib.Path(__file__).resolve().parent.parent / "public" / "audio"
MIN_BYTES = 2000


async def speak(ad: dict) -> None:
    out_dir = AUDIO / ad["id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n{ad['id']}  ({ad['voice']} {ad['rate']} {ad['pitch']})")

    for line in ad["lines"]:
        target = out_dir / f"{line['name']}.mp3"
        words_target = out_dir / f"{line['name']}.words.json"
        communicate = edge_tts.Communicate(
            line["text"],
            ad["voice"],
            rate=ad["rate"],
            pitch=ad["pitch"],
        )

        # Assembled by hand rather than with `save()`, because `save()` drops
        # the WordBoundary events and those are the whole point. The offsets
        # arrive in 100-nanosecond ticks, which is the unit the Speech service
        # speaks in; milliseconds are what everything downstream wants.
        audio = bytearray()
        words: list[dict] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append(
                    {
                        "text": chunk["text"],
                        "startMs": round(chunk["offset"] / 10_000, 1),
                        "durationMs": round(chunk["duration"] / 10_000, 1),
                    }
                )

        target.write_bytes(bytes(audio))
        words_target.write_text(json.dumps(words, ensure_ascii=False))

        size = target.stat().st_size
        if size < MIN_BYTES:
            raise SystemExit(
                f"{line['name']} came back {size} bytes — the speech service "
                f"returned nothing. A silent shot must stop the build."
            )
        # A clip with no boundaries is a caption that cannot be synced, and it
        # would fall back to the even spread that caused the bug. That is worth
        # stopping the build for: it is silent damage, visible only by watching
        # the finished film with the sound on.
        if not words:
            raise SystemExit(
                f"{line['name']} came back with no word boundaries. The caption "
                f"for this shot could not be synchronised to the voice."
            )
        spoken = words[-1]["startMs"] + words[-1]["durationMs"]
        print(
            f"  {line['name']}  {size / 1024:5.0f}KB  "
            f"{len(words):2d} words  {spoken / 1000:5.2f}s  "
            f"\"{line['text'][:38]}\""
        )


async def main() -> None:
    manifest_path = AUDIO / "manifest.json"
    if not manifest_path.exists():
        raise SystemExit("public/audio/manifest.json missing — run `npm run voice:manifest` first.")

    ads = json.loads(manifest_path.read_text())
    for ad in ads:
        if "Multilingual" in ad["voice"]:
            raise SystemExit(
                f"{ad['id']} uses {ad['voice']}. Multilingual voices mispronounce "
                f"'M.G.R.' and 'MBBS' with French phonemes — use a US English voice."
            )
        await speak(ad)

    spoken = sum(len(a["lines"]) for a in ads)
    print(f"\n{spoken} lines spoken across {len(ads)} ads.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001 - the message is the whole point
        print(f"\nVoice synthesis failed: {exc}", file=sys.stderr)
        raise
