const clips = import.meta.glob('../../android/app/src/main/res/raw/*.wav', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
function play(name: string, volume: number) {
  const uri = clips[`../../android/app/src/main/res/raw/${name}.wav`]; if (!uri) return;
  const audio = new Audio(uri); audio.volume = Math.max(0, Math.min(1, volume)); void audio.play().catch(() => {});
}
export default { play, preview: play, silencingReason: () => '' };
