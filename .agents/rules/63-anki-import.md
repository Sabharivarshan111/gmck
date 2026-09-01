---
description: Importing an Anki .apkg — the decoy collection every modern package carries, and the collation no phone has
---

# Importing an Anki package

`mobile/src/lib/apkgFormat.ts` (the format), `mobile/src/lib/importedDecks.ts` (the storage),
`ApkgModule.kt` (zip, zstd, SQLite), and the **Import your Anki cards** row
under Decks you write.

## Three layouts, and one of them lies

| | collection | media list | zstd |
|---|---|---|---|
| v1 — no `meta` | `collection.anki2`, schema 11 | JSON hashmap | no |
| v2 — `meta` = 2 | `collection.anki21`, schema 11 | JSON hashmap | no |
| v3 — `meta` = 3 | `collection.anki21b`, schema 18 | protobuf | **yes** |

**Every v3 package also contains a `collection.anki2`, and it is a decoy.**
anki's `export_collection` calls `write_dummy_collection` unconditionally, so
beside the real collection there is a complete, valid, schema 11 one holding a
single note reading "This file requires a newer version of Anki." A reader that
picks its collection by filename finds it, parses it, throws nothing, and hands
back a one-card deck containing an error message — which looks like success.

`packageLayout()` reads `meta` first and only sniffs filenames when there is
none. `npm run check:apkg` asserts it: reverted to filenames, `v3.apkg` imports
as 1 card and the check fails eighteen ways.

## Four more that fail quietly

- **Schema 15 moved notetypes out of `col`.** Before it they are one JSON blob
  in `col.models`; from 15 on that column is `"{}"` and the
  `notetypes`/`fields`/`templates` tables are the truth. A reader that knows
  only the old path finds a modern collection with no notetypes at all.
- **Schema 15+ deck names use `\x1f`** between levels, and only become `::` on
  the way out.
- **A media file's zip entry is named for its *position* in the media list** —
  `"0"`, `"1"` — and nothing else knows which is which.
- **Never `ORDER BY` or `WHERE` a name column.** Every `name` in a schema 15+
  collection is `COLLATE unicase`, which only Anki's Rust backend registers.
  SQLite resolves collations lazily, so plain `SELECT`s work and `ORDER BY
  name` throws `no such collation sequence: unicase` on a device and nowhere a
  desktop Anki would ever show it. The queries live in `SQL` in
  `apkgFormat.ts`; `check:apkg` greps the Kotlin for the same strings.

## The `cards` table says how many cards a note has

Card generation already ran inside Anki. One row in, one card out: `ord`
selects the template on a normal notetype and the cloze number on a cloze one.
Re-deriving it would reimplement the part of Anki most likely to disagree, to
answer a question the file already answers.

Cloze is ported from `rslib/src/cloze.rs`: `{{c1::text::hint}}`, comma
ordinals (`{{c1,3::…}}`) and nesting all appear constantly in medical decks and
are silently wrong if dropped.

## The reading is TypeScript because the Kotlin cannot be run here

No sandbox has an emulator, so Kotlin is unverifiable until it is on a phone.
Everything that decides what a card *says* is in `apkgFormat.ts`, and
`check:apkg` runs it against real `.apkg` files from
`mobile/scripts/make-apkg-fixtures.py` — decompressed with `node:zlib`'s zstd and
opened with `node:sqlite`, **a stock SQLite with no `unicase`, exactly the
position Android is in**. All three versions import to the same ten cards.

Kotlin does only what JavaScript cannot: `ACTION_OPEN_DOCUMENT` (no permission,
and none may be added), `java.util.zip`, `android.database.sqlite`, zstd.

**`zstd-jni` costs about half a megabyte in the split Play download**, and
there is no way around it: everything modern Anki exports is zstd. Its ProGuard
keep is load-bearing — R8 cannot see JNI callbacks, so without it the importer
works in every test build and fails only in the shipped one.

## An imported deck is not a `CustomDeck`

The decks you write are one AsyncStorage value with pictures inline. A shared
medical deck is thousands of cards and hundreds of megabytes, so an imported
one keeps **its cards in a key of their own** and **its pictures in files**
under `filesDir/anki-media/{id}/`. Deleting it takes the cards, the schedule
and the media folder with it.

It stays on this phone, and that is a *stronger* rule than the written decks
follow: a shared deck is somebody else's work the reader downloaded for
themselves, and uploading it would be this app redistributing it.
`check:cloud-ids` lists it; `check:apkg` asserts the picker takes no permission
and the module never touches the network.

## Exporting writes the *oldest* layout

`mobile/src/lib/apkgExport.ts`, and the share button on a deck in **Decks you
write**. It writes version 1 — a plain `collection.anki2` at schema 11, a JSON
media map, no `meta` and no zstd — on purpose:

- **Every Anki ever released can open it.** A version 3 package is refused
  outright by anything before 2.1.50, and the person being handed the deck did
  not choose their Anki version.
- Nothing has to compress, for a file that is a few hundred kilobytes.
- It round-trips through our own importer, which is what `check:apkg` asserts:
  a deck is exported, a real package is built from the payload in Node, and the
  importer reads it back. The writer and the reader are independent, so a deck
  that survives means both agree about the format rather than agreeing with
  each other's mistakes.

Pictures on a written card are data URIs; they become files in the package with
an `<img>` in the note, because a data URI in a field is a field several hundred
kilobytes long that Anki would store, sync and never show.

Sharing needs a **FileProvider**: a `file://` URI in an Intent throws
`FileUriExposedException` on anything since Android 7. It exposes exactly one
cache directory — `apkg-share`, named in both `res/xml/orbit_file_paths.xml`
and `ApkgModule` — and `exported="false"` with `grantUriPermissions="true"`, so
the only access anyone gets is the one-shot grant on the Intent. The authority
is `${applicationId}.fileprovider`, because two installed builds declaring the
same authority is an install failure with a useless message.

**An imported card may carry pictures on its question side.** Not a
contradiction of "a diagram belongs on the back" — that rule is about *our*
image cards, where the diagram is the answer. An Anki card's front is whatever
its author wrote, and an ECG above "identify this rhythm" is the question.
