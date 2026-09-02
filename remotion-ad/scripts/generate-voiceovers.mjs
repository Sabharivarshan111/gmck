// Synthesise one mp3 per shot, per ad, with Edge neural TTS.
//
// Single-language US English voices only. A *MultilingualNeural voice reads
// "M.G.R." and "MBBS" with French phonemes, which is failure mode #3 — it
// shipped once and had to be re-cut.
//
// The agent sandbox is denied speech.platform.bing.com by proxy policy, so this
// runs in CI.
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const load = async (f) =>
  (await import(pathToFileURL(path.join(process.cwd(), 'src', 'scripts', f)).href));

// The script data is TypeScript; Node 22 strips the types natively.
const { thePattern } = await load('thePattern.ts');
const { twoAM } = await load('twoAM.ts');
const { drawItFromMemory } = await load('drawItFromMemory.ts');

for (const script of [thePattern, twoAM, drawItFromMemory]) {
  const outDir = path.join(process.cwd(), 'public', 'audio', script.id);
  await fs.mkdir(outDir, { recursive: true });
  process.stdout.write(`\n${script.id}  (${script.voice} ${script.rate})\n`);

  for (const shot of script.shots) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(script.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const name = `shot_${String(shot.n).padStart(2, '0')}`;
    const { audioFilePath } = await tts.toFile(path.join(outDir, name), shot.vo, {
      rate: script.rate,
      pitch: script.pitch,
    });
    const { size } = await fs.stat(audioFilePath);
    if (size < 2000) throw new Error(`${name} came back ${size} bytes — TTS returned nothing`);
    process.stdout.write(`  ${name}  ${(size / 1024).toFixed(0)}KB  "${shot.vo.slice(0, 46)}"\n`);
  }
}
process.stdout.write('\nAll voiceovers written.\n');
