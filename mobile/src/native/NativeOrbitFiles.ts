import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Files attached to a personal study note — video, audio, PDFs, big pictures.
 *
 * **Why a native module and not a library.** Two jobs that both have to be done
 * on the Android side and neither of which JavaScript can do here:
 *
 * 1. **Pick without asking for the whole device.** `ACTION_OPEN_DOCUMENT` runs
 *    out of process and hands back exactly the one item chosen, with no
 *    permission requested — the same reason the photo picker needs no
 *    `READ_MEDIA_IMAGES`. A library that scanned storage would need the
 *    opposite.
 * 2. **Copy it somewhere it will survive.** A picker's URI points at a
 *    provider the app has a one-shot grant to, and `react-native-image-picker`
 *    lands its results in the *cache* directory, which Android empties whenever
 *    it wants the space. A lecture recording attached to a ward-round note that
 *    is gone next month is worse than one that was never attached. So the bytes
 *    are copied into `filesDir/note-media/` at import, and the note stores an
 *    id.
 *
 * **No cap, and none may be added.** These sit on the reader's own phone, one
 * file each, in app storage. The only limit is free space, which is theirs to
 * spend — the same rule the note pictures already follow. A number invented
 * here would be this app deciding how much of somebody's own recording of
 * their own lecture they are allowed to keep.
 *
 * **Nothing here ever touches the network.** No bucket, no upload, no account.
 * `npm run check:cloud-ids` enforces that from the other side.
 */
export interface Spec extends TurboModule {
  /**
   * Open the system picker, and keep whatever comes back.
   *
   * Resolves a JSON object `{ id, name, mime, size }` for the imported file,
   * or an empty string when the reader cancelled. Rejects only when the copy
   * itself failed, which is a thing worth telling them about.
   *
   * Picking and copying are one call on purpose: a content URI handed to
   * JavaScript and passed back is a grant that can lapse in between, and the
   * failure would look like a file that imported and then was not there.
   */
  pick(): Promise<string>;

  /** The absolute path for an imported file, or an empty string if it is gone. */
  pathFor(id: string): string;

  /** Forget one file's bytes. The note is the source of truth for the list. */
  remove(id: string): void;

  /** Bytes currently held, so Settings can be honest about what this costs. */
  totalBytes(): number;
}

export default TurboModuleRegistry.get<Spec>('OrbitFiles');
