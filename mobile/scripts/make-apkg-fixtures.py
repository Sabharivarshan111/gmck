#!/usr/bin/env python3
"""Build real .apkg files to test the importer against.

Not mocks. These are written to the format as `ankitects/anki` defines it in
`rslib/src/import_export/package/`, so a reader that passes here is reading the
same bytes a deck downloaded from AnkiWeb is made of.

Three packages, because there are three package versions in the wild and they
differ in ways that are invisible until one of them is wrong:

  legacy1   no `meta` entry at all; the collection is `collection.anki2`,
            schema 11, and the media map is a JSON hashmap. What Anki wrote
            for years, and what most old shared decks still are.
  legacy2   a `meta` saying version 2; the collection is `collection.anki21`,
            still schema 11 and still a JSON media map. What modern Anki
            writes when "support older Anki versions" is ticked.
  v3        a `meta` saying version 3; the collection is `collection.anki21b`,
            **zstd-compressed**, schema 18 with notetypes/fields/templates in
            their own tables and protobuf configs. The media map is a zstd
            protobuf, and every media file in the zip is zstd too.

The v3 fixture also carries the trap that makes this worth testing at all:
`export_collection` in colpkg/export.rs calls `write_dummy_collection`, so
**every v3 package also contains a `collection.anki2`** holding one note that
says the file needs a newer Anki. A reader that looks for a filename instead of
reading `meta` first finds that decoy, imports it without error, and hands the
reader a one-card deck. No exception, no warning — just the wrong deck.

    python3 scripts/make-apkg-fixtures.py [outDir]
"""

import hashlib
import json
import os
import sqlite3
import struct
import sys
import tempfile
import time
import zipfile

import zstandard

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "preview", "fixtures", "apkg"))

# ---------------------------------------------------------------- protobuf ---
# Anki's blobs are small enough that a library would be more code than this.
# Only the wire types the format actually uses are here: varint (0) for enums
# and numbers, length-delimited (2) for strings, bytes and messages.


def varint(value: int) -> bytes:
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        out.append(byte | (0x80 if value else 0))
        if not value:
            return bytes(out)


def tag(field: int, wire: int) -> bytes:
    return varint((field << 3) | wire)


def pb_varint(field: int, value: int) -> bytes:
    return tag(field, 0) + varint(value)


def pb_bytes(field: int, value: bytes) -> bytes:
    return tag(field, 2) + varint(len(value)) + value


def pb_str(field: int, value: str) -> bytes:
    return pb_bytes(field, value.encode("utf-8"))


def notetype_config(kind: int, sort_field: int = 0) -> bytes:
    """`Notetype.Config` — kind is field 1, 0 normal / 1 cloze."""
    return pb_varint(1, kind) + pb_varint(2, sort_field)


def template_config(qfmt: str, afmt: str) -> bytes:
    """`Notetype.Template.Config` — q_format is field 1, a_format field 2."""
    return pb_str(1, qfmt) + pb_str(2, afmt)


def field_config() -> bytes:
    """`Notetype.Field.Config`. Nothing in it is read; it must merely exist."""
    return b""


def media_entries(entries) -> bytes:
    """`MediaEntries { repeated MediaEntry entries = 1 }`."""
    out = bytearray()
    for name, size, sha1 in entries:
        entry = pb_str(1, name) + pb_varint(2, size) + pb_bytes(3, sha1)
        out += pb_bytes(1, bytes(entry))
    return bytes(out)


def package_meta(version: int) -> bytes:
    """`PackageMetadata { Version version = 1 }`."""
    return pb_varint(1, version)


# ------------------------------------------------------------------ decks ----

SEP = "\x1f"  # Anki joins note fields with this, and nests deck names with it.


def field_checksum(text: str) -> int:
    """Anki's `csum`: the first 8 hex digits of the sha1 of the first field."""
    return int(hashlib.sha1(text.encode("utf-8")).hexdigest()[:8], 16)


BASIC_Q = "{{Front}}"
BASIC_A = "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}"
REVERSE_Q = "{{Back}}"
REVERSE_A = "{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}"
CLOZE_Q = "{{cloze:Text}}"
CLOZE_A = "{{cloze:Text}}<br>\n{{Back Extra}}"

BASIC_ID = 1_600_000_000_001
CLOZE_ID = 1_600_000_000_002
REVERSED_ID = 1_600_000_000_003

NOTETYPES = [
    # (id, name, kind, [field names], [(template name, qfmt, afmt)])
    (BASIC_ID, "Basic", 0, ["Front", "Back"], [("Card 1", BASIC_Q, BASIC_A)]),
    (CLOZE_ID, "Cloze", 1, ["Text", "Back Extra"], [("Cloze", CLOZE_Q, CLOZE_A)]),
    (
        REVERSED_ID,
        "Basic (and reversed card)",
        0,
        ["Front", "Back"],
        [("Card 1", BASIC_Q, BASIC_A), ("Card 2", REVERSE_Q, REVERSE_A)],
    ),
]

# (deck id, human name). Schema 11 stores these with "::"; schema 15+ stores
# the same name with \x1f and only converts on the way out.
DECKS = [
    (1, "Default"),
    (1_600_000_100_001, "Medicine"),
    (1_600_000_100_002, "Medicine::Cardiology"),
]

# (note id, notetype id, deck id, [fields], tags, [card ords])
#
# The card ords are given rather than derived, because that is how a real
# package works: card generation already happened in Anki, and the `cards`
# table is the authority. A three-cloze note has three rows, a reversed note
# has two, and a note whose second field is empty has however many Anki
# decided — which is exactly why the importer must not try to work it out.
NOTES = [
    (
        1_600_000_200_001,
        BASIC_ID,
        1_600_000_100_002,
        ["What does the P wave represent?", "Atrial depolarisation"],
        "cardio ecg",
        [0],
    ),
    (
        1_600_000_200_002,
        BASIC_ID,
        1_600_000_100_002,
        [
            'Identify the rhythm <img src="ecg-strip.png">',
            "Atrial fibrillation &mdash; irregularly irregular, no P waves",
        ],
        "cardio ecg",
        [0],
    ),
    (
        1_600_000_200_003,
        CLOZE_ID,
        1_600_000_100_002,
        [
            "The {{c1::mitral}} valve lies between the left atrium and the "
            "{{c2::left ventricle}}, and is also called the {{c1::bicuspid}} valve.",
            "Two clozes, three mentions.",
        ],
        "anatomy",
        [0, 1],
    ),
    (
        1_600_000_200_004,
        CLOZE_ID,
        1_600_000_100_001,
        [
            "First-line treatment is {{c1::aspirin::antiplatelet}} plus "
            "{{c2::clopidogrel}}, then {{c3::statin}}.",
            "",
        ],
        "pharm",
        [0, 1, 2],
    ),
    (
        1_600_000_200_005,
        REVERSED_ID,
        1_600_000_100_001,
        ["Bradycardia", "A heart rate below 60 beats per minute"],
        "",
        [0, 1],
    ),
    (
        1_600_000_200_006,
        BASIC_ID,
        1,
        ["Listen to this murmur [sound:murmur.mp3]", "Aortic stenosis"],
        "sound",
        [0],
    ),
]

# One-pixel PNG and a tiny "recording", so media handling is exercised without
# committing anything big.
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d4944415478da63fccfc0500f0000040001ff9f8f8e0000000049454e44ae426082"
)
MP3 = b"ID3\x03\x00\x00\x00\x00\x00\x00" + b"\x00" * 64

MEDIA = [("ecg-strip.png", PNG), ("murmur.mp3", MP3), ("unused-diagram.png", PNG)]


# ----------------------------------------------------------------- schema ----


def build_schema11(path: str) -> None:
    """A schema 11 collection: notetypes and decks are JSON inside `col`."""
    db = sqlite3.connect(path)
    db.executescript(
        """
        CREATE TABLE col (id integer PRIMARY KEY, crt integer NOT NULL,
          mod integer NOT NULL, scm integer NOT NULL, ver integer NOT NULL,
          dty integer NOT NULL, usn integer NOT NULL, ls integer NOT NULL,
          conf text NOT NULL, models text NOT NULL, decks text NOT NULL,
          dconf text NOT NULL, tags text NOT NULL);
        CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL,
          mid integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL,
          tags text NOT NULL, flds text NOT NULL, sfld integer NOT NULL,
          csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL);
        CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL,
          did integer NOT NULL, ord integer NOT NULL, mod integer NOT NULL,
          usn integer NOT NULL, type integer NOT NULL, queue integer NOT NULL,
          due integer NOT NULL, ivl integer NOT NULL, factor integer NOT NULL,
          reps integer NOT NULL, lapses integer NOT NULL, left integer NOT NULL,
          odue integer NOT NULL, odid integer NOT NULL, flags integer NOT NULL,
          data text NOT NULL);
        CREATE TABLE revlog (id integer PRIMARY KEY, cid integer NOT NULL,
          usn integer NOT NULL, ease integer NOT NULL, ivl integer NOT NULL,
          lastIvl integer NOT NULL, factor integer NOT NULL, time integer NOT NULL,
          type integer NOT NULL);
        CREATE TABLE graves (usn integer NOT NULL, oid integer NOT NULL,
          type integer NOT NULL);
        CREATE INDEX ix_cards_nid ON cards (nid);
        CREATE INDEX ix_notes_csum ON notes (csum);
        """
    )

    models = {}
    for ntid, name, kind, fields, templates in NOTETYPES:
        models[str(ntid)] = {
            "id": ntid,
            "name": name,
            "type": kind,
            "mod": 0,
            "usn": -1,
            "sortf": 0,
            "did": 1,
            "css": ".card { font-family: arial; font-size: 20px; }",
            "latexPre": "",
            "latexPost": "",
            "latexsvg": False,
            "req": [[i, "any", [0]] for i in range(len(templates))],
            "flds": [
                {
                    "name": f,
                    "ord": i,
                    "sticky": False,
                    "rtl": False,
                    "font": "Arial",
                    "size": 20,
                    "description": "",
                }
                for i, f in enumerate(fields)
            ],
            "tmpls": [
                {
                    "name": tname,
                    "ord": i,
                    "qfmt": qfmt,
                    "afmt": afmt,
                    "bqfmt": "",
                    "bafmt": "",
                    "did": None,
                    "bfont": "",
                    "bsize": 0,
                }
                for i, (tname, qfmt, afmt) in enumerate(templates)
            ],
        }

    decks = {
        str(did): {
            "id": did,
            "name": name,
            "mod": 0,
            "usn": -1,
            "lrnToday": [0, 0],
            "revToday": [0, 0],
            "newToday": [0, 0],
            "timeToday": [0, 0],
            "collapsed": False,
            "browserCollapsed": False,
            "desc": "",
            "dyn": 0,
            "conf": 1,
            "extendNew": 0,
            "extendRev": 0,
        }
        for did, name in DECKS
    }

    now = int(time.time())
    db.execute(
        "INSERT INTO col VALUES (1,?,?,?,11,0,-1,0,'{}',?,?,'{}','[]')",
        (now, now * 1000, now * 1000, json.dumps(models), json.dumps(decks)),
    )
    write_notes_and_cards(db)
    db.commit()
    db.close()


def unicase(left: str, right: str) -> int:
    """Anki's own collation, registered by its Rust backend.

    It has to exist here or the schema will not even build, and that is the
    point: the `COLLATE unicase` in these table definitions is real, it is in
    every schema 15+ collection, and **no other SQLite has it**. Android's
    included. SQLite resolves a collation lazily, when a statement needs one to
    compare or order, so a plain `SELECT` of these columns still works on a
    stock SQLite — but `ORDER BY name`, or a `WHERE name = ?`, throws
    "no such collation sequence: unicase" on a device and nowhere else.

    Case-insensitive is close enough for a fixture; only its presence matters.
    """
    a, b = left.lower(), right.lower()
    return (a > b) - (a < b)


def build_schema18(path: str) -> None:
    """A schema 18 collection: notetypes, fields, templates and decks are tables."""
    db = sqlite3.connect(path)
    db.create_collation("unicase", unicase)
    db.executescript(
        """
        CREATE TABLE col (id integer PRIMARY KEY, crt integer NOT NULL,
          mod integer NOT NULL, scm integer NOT NULL, ver integer NOT NULL,
          dty integer NOT NULL, usn integer NOT NULL, ls integer NOT NULL,
          conf text NOT NULL, models text NOT NULL, decks text NOT NULL,
          dconf text NOT NULL, tags text NOT NULL);
        CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL,
          mid integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL,
          tags text NOT NULL, flds text NOT NULL, sfld integer NOT NULL,
          csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL);
        CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL,
          did integer NOT NULL, ord integer NOT NULL, mod integer NOT NULL,
          usn integer NOT NULL, type integer NOT NULL, queue integer NOT NULL,
          due integer NOT NULL, ivl integer NOT NULL, factor integer NOT NULL,
          reps integer NOT NULL, lapses integer NOT NULL, left integer NOT NULL,
          odue integer NOT NULL, odid integer NOT NULL, flags integer NOT NULL,
          data text NOT NULL);
        CREATE TABLE revlog (id integer PRIMARY KEY, cid integer NOT NULL,
          usn integer NOT NULL, ease integer NOT NULL, ivl integer NOT NULL,
          lastIvl integer NOT NULL, factor integer NOT NULL, time integer NOT NULL,
          type integer NOT NULL);
        CREATE TABLE fields (ntid integer NOT NULL, ord integer NOT NULL,
          name text NOT NULL COLLATE unicase, config blob NOT NULL,
          PRIMARY KEY (ntid, ord)) WITHOUT ROWID;
        CREATE TABLE templates (ntid integer NOT NULL, ord integer NOT NULL,
          name text NOT NULL COLLATE unicase, mtime_secs integer NOT NULL,
          usn integer NOT NULL, config blob NOT NULL,
          PRIMARY KEY (ntid, ord)) WITHOUT ROWID;
        CREATE TABLE notetypes (id integer NOT NULL PRIMARY KEY,
          name text NOT NULL COLLATE unicase, mtime_secs integer NOT NULL,
          usn integer NOT NULL, config blob NOT NULL);
        CREATE TABLE decks (id integer PRIMARY KEY NOT NULL,
          name text NOT NULL COLLATE unicase, mtime_secs integer NOT NULL,
          usn integer NOT NULL, common blob NOT NULL, kind blob NOT NULL);
        CREATE INDEX ix_cards_nid ON cards (nid);
        CREATE INDEX idx_notes_mid ON notes (mid);
        """
    )

    now = int(time.time())
    # models/decks are left empty on purpose: from schema 15 on they are the
    # tables below, and a reader that still trusts these columns finds "{}"
    # and concludes the package has no notetypes at all.
    db.execute(
        "INSERT INTO col VALUES (1,?,?,?,18,0,-1,0,'{}','{}','{}','{}','[]')",
        (now, now * 1000, now * 1000),
    )

    for ntid, name, kind, fields, templates in NOTETYPES:
        db.execute(
            "INSERT INTO notetypes VALUES (?,?,?,?,?)",
            (ntid, name, now, -1, notetype_config(kind)),
        )
        for i, fname in enumerate(fields):
            db.execute(
                "INSERT INTO fields VALUES (?,?,?,?)", (ntid, i, fname, field_config())
            )
        for i, (tname, qfmt, afmt) in enumerate(templates):
            db.execute(
                "INSERT INTO templates VALUES (?,?,?,?,?,?)",
                (ntid, i, tname, now, -1, template_config(qfmt, afmt)),
            )

    for did, name in DECKS:
        db.execute(
            "INSERT INTO decks VALUES (?,?,?,?,?,?)",
            (did, name.replace("::", SEP), now, -1, b"", b""),
        )

    write_notes_and_cards(db)
    db.commit()
    db.close()


def write_notes_and_cards(db: sqlite3.Connection) -> None:
    """The two tables that are identical in every schema Anki has shipped."""
    now = int(time.time())
    card_id = 1_600_000_300_000
    for nid, mid, did, fields, tags, ords in NOTES:
        flds = SEP.join(fields)
        db.execute(
            "INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,0,'')",
            (
                nid,
                f"g{nid}",
                mid,
                now,
                -1,
                f" {tags} " if tags else "",
                flds,
                fields[0],
                field_checksum(fields[0]),
            ),
        )
        for ordinal in ords:
            card_id += 1
            db.execute(
                "INSERT INTO cards VALUES (?,?,?,?,?,?,0,0,?,0,0,0,0,0,0,0,0,'')",
                (card_id, nid, did, ordinal, now, -1, ordinal + 1),
            )


def dummy_collection(path: str) -> None:
    """The decoy `collection.anki2` a v3 package carries.

    `write_dummy_collection` in colpkg/export.rs puts this in every v3 package
    so that an old Anki opening it says something useful instead of crashing.
    It is a complete, valid schema 11 collection holding exactly one note, and
    that is what makes it dangerous: a reader that picks its collection by
    filename imports it happily and reports success.
    """
    db = sqlite3.connect(path)
    db.executescript(
        """
        CREATE TABLE col (id integer PRIMARY KEY, crt integer NOT NULL,
          mod integer NOT NULL, scm integer NOT NULL, ver integer NOT NULL,
          dty integer NOT NULL, usn integer NOT NULL, ls integer NOT NULL,
          conf text NOT NULL, models text NOT NULL, decks text NOT NULL,
          dconf text NOT NULL, tags text NOT NULL);
        CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL,
          mid integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL,
          tags text NOT NULL, flds text NOT NULL, sfld integer NOT NULL,
          csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL);
        CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL,
          did integer NOT NULL, ord integer NOT NULL, mod integer NOT NULL,
          usn integer NOT NULL, type integer NOT NULL, queue integer NOT NULL,
          due integer NOT NULL, ivl integer NOT NULL, factor integer NOT NULL,
          reps integer NOT NULL, lapses integer NOT NULL, left integer NOT NULL,
          odue integer NOT NULL, odid integer NOT NULL, flags integer NOT NULL,
          data text NOT NULL);
        """
    )
    warning = "This file requires a newer version of Anki."
    models = {
        str(BASIC_ID): {
            "id": BASIC_ID,
            "name": "Basic",
            "type": 0,
            "sortf": 0,
            "flds": [
                {"name": "Front", "ord": 0},
                {"name": "Back", "ord": 1},
            ],
            "tmpls": [{"name": "Card 1", "ord": 0, "qfmt": BASIC_Q, "afmt": BASIC_A}],
        }
    }
    decks = {"1": {"id": 1, "name": "Default"}}
    now = int(time.time())
    db.execute(
        "INSERT INTO col VALUES (1,?,?,?,11,0,-1,0,'{}',?,?,'{}','[]')",
        (now, now * 1000, now * 1000, json.dumps(models), json.dumps(decks)),
    )
    db.execute(
        "INSERT INTO notes VALUES (1,'dummy',?,?,-1,'',?,?,?,0,'')",
        (BASIC_ID, now, warning + SEP, warning, field_checksum(warning)),
    )
    db.execute("INSERT INTO cards VALUES (1,1,1,0,?,-1,0,0,1,0,0,0,0,0,0,0,0,'')", (now,))
    db.commit()
    db.close()


# ---------------------------------------------------------------- packages ---


def write_package(out_path: str, version: int) -> None:
    """Assemble one .apkg, laid out the way `export_collection` lays one out."""
    legacy = version in (1, 2)
    compressor = zstandard.ZstdCompressor(level=0)

    with tempfile.TemporaryDirectory() as tmp:
        col_path = os.path.join(tmp, "col.sqlite")
        if legacy:
            build_schema11(col_path)
        else:
            build_schema18(col_path)
        with open(col_path, "rb") as handle:
            col_bytes = handle.read()

        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # Version 1 is the one that has no `meta` at all — that absence is
            # how it is recognised, so writing one would make it a version 2.
            if version >= 2:
                zf.writestr("meta", package_meta(version))

            name = {1: "collection.anki2", 2: "collection.anki21", 3: "collection.anki21b"}[version]
            zf.writestr(name, col_bytes if legacy else compressor.compress(col_bytes))

            if not legacy:
                # The decoy. Real v3 packages carry it and a filename-driven
                # reader takes it for the collection.
                decoy_path = os.path.join(tmp, "decoy.anki2")
                dummy_collection(decoy_path)
                with open(decoy_path, "rb") as handle:
                    zf.writestr("collection.anki2", handle.read())

            if legacy:
                zf.writestr("media", json.dumps({str(i): n for i, (n, _) in enumerate(MEDIA)}))
                for i, (_, blob) in enumerate(MEDIA):
                    zf.writestr(str(i), blob)
            else:
                entries = [
                    (n, len(b), hashlib.sha1(b).digest()) for n, b in MEDIA
                ]
                zf.writestr("media", compressor.compress(media_entries(entries)))
                for i, (_, blob) in enumerate(MEDIA):
                    zf.writestr(str(i), compressor.compress(blob))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for version, filename in (
        (1, "legacy1.apkg"),
        (2, "legacy2.apkg"),
        (3, "v3.apkg"),
    ):
        path = os.path.join(OUT, filename)
        write_package(path, version)
        size = os.path.getsize(path)
        with zipfile.ZipFile(path) as zf:
            names = ", ".join(sorted(zf.namelist()))
        print(f"{filename:14} {size:7} bytes   {names}")

    cards = sum(len(n[5]) for n in NOTES)
    print(f"\n{len(NOTES)} notes, {cards} cards, {len(MEDIA)} media files in each")


if __name__ == "__main__":
    main()
