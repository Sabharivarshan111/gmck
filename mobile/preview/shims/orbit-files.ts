/**
 * Dev-only stand-in for the OrbitFiles native module.
 *
 * Reports **present**, and picks a real (tiny) recording when asked to. The
 * previous version returned null, which hid the "Add file" button — and that
 * meant the one flow this module exists for, attach something and play it,
 * was the one flow nothing could walk. A path no check can exercise is a path
 * that regresses silently; this app has shipped a native module that did not
 * exist on any device for exactly that reason.
 *
 * Like the image-picker shim, picking is **opt-in**. Without the flag it
 * cancels, because a stub that invented a file on every call would put the
 * editor into a state no tap on a phone produces.
 */
declare global {
  // eslint-disable-next-line no-var
  var __orbitPickFile: 'audio' | 'video' | 'pdf' | undefined;
}

/** 0.4s of 440Hz, mono, 8kHz. Small enough to be free, real enough to decode. */
const TONE_WAV = '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';

/** A one-page PDF, so the hand-off row has something real behind it. */
const BLANK_PDF = 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+';

/*
 * There is no video sample.
 *
 * Building a valid MP4 by hand is not worth it and there is no encoder in the
 * sandbox, so the video entry carries the tone's bytes under a video MIME
 * type: the *kind* is what the renderer branches on, so the frame and the
 * transport are drawn and reviewable, and the decode then fails into the
 * player's own error line — which is the other path worth being able to see.
 * Decoding a real video is a device job, and the checks say so rather than
 * pretending otherwise.
 */
const SAMPLES = {
  audio: { name: 'Lecture 3.wav', mime: 'audio/wav', uri: `data:audio/wav;base64,${TONE_WAV}` },
  video: { name: 'Procedure.mp4', mime: 'video/mp4', uri: `data:video/mp4;base64,${TONE_WAV}` },
  pdf: {
    name: 'Handout.pdf',
    mime: 'application/pdf',
    uri: `data:application/pdf;base64,${BLANK_PDF}`,
  },
} as const;

const kept = new Map<string, string>();

export default {
  pick: async () => {
    const want = globalThis.__orbitPickFile;
    if (!want) {
      return '';
    }
    const sample = SAMPLES[want];
    const id = `preview-${want}-${kept.size}`;
    kept.set(id, sample.uri);
    return JSON.stringify({
      id,
      name: sample.name,
      mime: sample.mime,
      // Rounded and plausible, so the size line has something to format.
      size: want === 'video' ? 42_000_000 : want === 'pdf' ? 1_400_000 : 6_800,
    });
  },
  /* A URL rather than a path — see the note in lib/noteFiles. */
  pathFor: (id: string) => kept.get(id) ?? '',
  remove: (id: string) => {
    kept.delete(id);
  },
  totalBytes: () => 0,
};
