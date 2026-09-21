import asyncio
import os
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
TEXT = (ROOT / "voiceover.txt").read_text(encoding="utf-8").strip()
OUT = ROOT / "public" / "audio" / "voiceover.mp3"
OUT.parent.mkdir(parents=True, exist_ok=True)

VOICE = os.getenv("ORBIT_TTS_VOICE", "en-IN-PrabhatNeural")
RATE = os.getenv("ORBIT_TTS_RATE", "+8%")

async def main() -> None:
    communicate = edge_tts.Communicate(TEXT, VOICE, rate=RATE)
    await communicate.save(str(OUT))
    print(f"Wrote {OUT} using {VOICE} at {RATE}")

if __name__ == "__main__":
    asyncio.run(main())
