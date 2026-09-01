import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Reading an Anki package off the phone.
 *
 * This module does the three things JavaScript cannot do here, and nothing
 * else — every decision about what a card *says* is in `src/lib/apkgFormat.ts`,
 * where it can be tested in Node against real `.apkg` files.
 *
 * 1. **Pick the file without asking for storage.** `ACTION_OPEN_DOCUMENT` runs
 *    out of process and hands back the one item chosen, so no permission is
 *    requested and none may be added — the same rule the note picker and the
 *    photo picker already follow.
 * 2. **Unzip it.** A shared deck is routinely hundreds of megabytes with
 *    thousands of media files. `java.util.zip` streams; a JavaScript unzipper
 *    would need the whole archive in memory as a `Uint8Array` first, on the
 *    phones this app is for.
 * 3. **Open the collection.** It is a SQLite database, and Android already
 *    has SQLite. Hand-rolling a reader for a format with overflow pages and
 *    five schema versions in the wild would be a large amount of code whose
 *    bugs look like a corrupt deck.
 *
 * The one thing Android does not have is **zstd**, which version 3 packages —
 * everything modern Anki exports unless "support older Anki versions" is
 * ticked — use for the collection, the media list and every media file. That
 * is what `zstd-jni` is in `app/build.gradle` for. It is a native library, and
 * it is the only dependency here that costs bytes: about half a megabyte in
 * the split Play download, for a format there is no way around.
 *
 * **Nothing here touches the network**, and nothing may be added that does. An
 * imported deck is somebody's own study material; `npm run check:cloud-ids`
 * enforces that from the other side.
 */
export interface Spec extends TurboModule {
  /**
   * Open the system picker and stage whatever comes back.
   *
   * Resolves JSON `{ path, name, size }` for the staged copy, or an empty
   * string when the reader cancelled. The file is copied into the app's cache
   * rather than read where it lies: the picker's grant is one-shot, and the
   * import makes several passes over the archive.
   */
  pick(): Promise<string>;

  /**
   * What is in the archive, without unpacking any of it.
   *
   * Resolves JSON `{ entries: [{ name, size }], meta: string | null }`, where
   * `meta` is the `meta` entry base64-encoded, or null when there is none.
   *
   * The version decision is deliberately *not* made here. It is the one place
   * this format sets a trap — every version 3 package also carries a decoy
   * `collection.anki2` — and it belongs in `packageLayout()`, which is
   * covered by `npm run check:apkg`, rather than in Kotlin that nothing can
   * run until it is on a phone.
   */
  survey(path: string): Promise<string>;

  /** One small entry, base64, decompressed when `zstd`. For the media list. */
  readEntry(path: string, entry: string, zstd: boolean): Promise<string>;

  /**
   * The notetypes, the decks and how many cards each deck holds.
   *
   * Cheap: it reads no card text at all. This is what the "which decks?"
   * screen is drawn from, so that a reader taking one chapter out of a
   * thirty-thousand-card package never has the other twenty-nine crossing
   * the bridge.
   */
  surveyCollection(path: string, entry: string, zstd: boolean): Promise<string>;

  /**
   * The cards themselves, from the given decks, up to `limit`.
   *
   * `deckIds` is a comma-separated list of integer deck ids, or an empty
   * string for all of them. Resolves the JSON of an `ApkgCollection`.
   */
  readCollection(
    path: string,
    entry: string,
    zstd: boolean,
    deckIds: string,
    limit: number,
  ): Promise<string>;

  /**
   * Unpack the media the imported cards actually point at.
   *
   * `plan` is JSON `[{ index, name }]` — the zip entry name and the filename
   * the note text uses. Resolves JSON `{ written, bytes, missing }`.
   *
   * Only the referenced files, because a package's media folder is routinely
   * far larger than the cards taken out of it, and the rest would sit on the
   * phone for ever with nothing to look at it.
   */
  extractMedia(path: string, deckId: string, plan: string, zstd: boolean): Promise<string>;

  /** Absolute path of a deck's media folder, for building `file://` uris. */
  mediaDir(deckId: string): string;

  /** Bytes a deck's media is using, so the screen can be honest about it. */
  mediaBytes(deckId: string): number;

  /** Delete one deck's media. Called when the deck is deleted, never before. */
  forget(deckId: string): void;

  /** Delete a staged package once the import has finished with it. */
  discard(path: string): void;

  /**
   * Write a deck out as an `.apkg`, and hand it to the share sheet.
   *
   * `payload` is the JSON of an `ExportPackage` — the collection's own JSON
   * columns and its note and card rows, all decided in `src/lib/apkgExport.ts`
   * where `npm run check:apkg` builds a real package from it and reads it back
   * with the importer. Kotlin writes the bytes and nothing else: a schema 11
   * SQLite database and a stored ZIP, both of which Android already has.
   *
   * No zstd on the way out. The oldest package layout is written on purpose,
   * because every Anki ever released can open it and the person being given
   * the deck did not choose their Anki version.
   *
   * Resolves the path of the file it wrote. `share` is separate so the export
   * can be reported as finished before the chooser covers the screen.
   */
  exportDeck(payload: string): Promise<string>;

  /**
   * Offer one exported file to whatever the reader wants to send it with.
   *
   * A `file://` URI in an Intent throws `FileUriExposedException` on anything
   * since Android 7, so this goes out as a `content://` from the app's
   * FileProvider with a one-shot read grant attached — the receiving app gets
   * that one file and nothing else.
   */
  share(path: string): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>('OrbitApkg');
