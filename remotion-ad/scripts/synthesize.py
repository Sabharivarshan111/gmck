"""Speak every line with Microsoft's neural voices, via edge-tts.

Run after `voice-manifest.mjs`. One mp3 per shot, per ad, named for the shot so
`ShotTimeline` can find it by convention rather than by another index file.

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
        communicate = edge_tts.Communicate(
            line["text"],
            ad["voice"],
            rate=ad["rate"],
            pitch=ad["pitch"],
        )
        await communicate.save(str(target))

        size = target.stat().st_size
        if size < MIN_BYTES:
            raise SystemExit(
                f"{line['name']} came back {size} bytes — the speech service "
                f"returned nothing. A silent shot must stop the build."
            )
        print(f"  {line['name']}  {size / 1024:5.0f}KB  \"{line['text'][:46]}\"")


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
