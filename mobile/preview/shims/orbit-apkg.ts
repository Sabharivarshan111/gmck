/**
 * Dev-only stand-in for the OrbitApkg native module.
 *
 * Reports **present**, so the import screen and its instructions can be
 * reviewed and screenshotted. A shim that returned null would hide the whole
 * feature behind "not available", which is the state this app has shipped a
 * native module in before — silently, on every device.
 *
 * Picking is **opt-in**, the same rule the file and image picker shims follow:
 * without the flag it reports a cancel, because a stub that invented a package
 * on every call would put the screen into a state no tap on a phone produces.
 *
 * What it cannot do is the actual work. Reading a package needs a zip, zstd
 * and SQLite, none of which exist in a browser — and none of which need to,
 * because the part of importing that decides what a card *says* is in
 * `src/lib/apkgFormat.ts` and runs for real against real `.apkg` files under
 * `npm run check:apkg`. This shim covers the screens; that check covers the
 * reading.
 */
declare global {
  // eslint-disable-next-line no-var
  var __orbitPickApkg: boolean | undefined;
}

/** A package shaped like a real shared deck: several chapters, one big. */
const FIXTURE = {
  path: '/preview/anatomy.apkg',
  name: 'Anatomy — Upper Limb.apkg',
  size: 24_500_000,
};

const DECKS = [
  { id: '1600000100002', name: 'Anatomy::Upper Limb', cards: 412 },
  { id: '1600000100001', name: 'Anatomy::Thorax', cards: 188 },
  { id: '1', name: 'Default', cards: 12 },
];

const shim = {
  async pick(): Promise<string> {
    if (!globalThis.__orbitPickApkg) {
      return '';
    }
    return JSON.stringify(FIXTURE);
  },

  async survey(): Promise<string> {
    return JSON.stringify({
      entries: [
        { name: 'meta', size: 2 },
        { name: 'collection.anki21b', size: 900_000 },
        // The decoy every version 3 package carries. It is here so the screen
        // is reviewed against a package shaped like a real one.
        { name: 'collection.anki2', size: 12_288 },
        { name: 'media', size: 4_000 },
      ],
      // PackageMetadata { version: 3 }
      meta: 'CAM=',
    });
  },

  async surveyCollection(): Promise<string> {
    return JSON.stringify({
      schema: 18,
      modern: true,
      notetypes: { notetypes: [] },
      decks: DECKS.map(deck => ({ id: deck.id, name: deck.name.replace('::', '\x1f') })),
      deckCounts: Object.fromEntries(DECKS.map(deck => [deck.id, deck.cards])),
    });
  },

  async readEntry(): Promise<string> {
    return '';
  },

  async readCollection(): Promise<string> {
    return JSON.stringify({ schema: 18, notetypes: { notetypes: [] }, decks: [], cards: [] });
  },

  async extractMedia(): Promise<string> {
    return JSON.stringify({ written: 0, bytes: 0, missing: [], dir: '' });
  },

  mediaDir(): string {
    return '';
  },

  mediaBytes(): number {
    return 0;
  },

  forget(): void {},
  discard(): void {},
};

export default shim;
