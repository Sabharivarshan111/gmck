// Link parsing, against the shapes people actually paste.
//
// A URL parser is the kind of code that looks obviously right and is wrong for
// a third of its inputs, and the cost lands on the reader: a YouTube link that
// is not recognised renders as a bare row instead of a player, and a non-video
// URL mistaken for one renders a player that shows nothing at all.
//
// The `javascript:` case is the one that matters beyond tidiness — a note is a
// place a reader pastes something, and anything that ends up in `Linking.openURL`
// has to have been checked first.
//
//   node scripts/note-links-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'src/lib/noteLinks.ts'), 'utf8');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

/*
 * Evaluated from the shipped text rather than imported, so this checks the real
 * lines. Nothing here touches React Native, so stripping the types is enough.
 */
const js = source
  .replace(/^import[\s\S]*?;$/gm, '')
  .replace(/export interface [\s\S]*?\n\}/g, '')
  .replace(/export /g, '')
  .replace(/: NoteLink \| null/g, '')
  .replace(/: NoteLink/g, '')
  .replace(/: string \| null/g, '')
  .replace(/: number \| undefined/g, '')
  .replace(/: string \| undefined/g, '')
  .replace(/\?: string/g, '')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  .replace(/: URL/g, '')
  .replace(/ as \w+/g, '');
// eslint-disable-next-line no-new-func
const fns = new Function(
  `${js}; return { normaliseUrl, youTubeIdOf, makeNoteLink, parseStart, embedUrlFor, embedHtmlFor, EMBED_ORIGIN, thumbnailFor, displayTitle };`,
)();

const id = (url, want, what) => {
  const got = fns.youTubeIdOf(fns.normaliseUrl(url) ?? '');
  check(got === want, `${what}: expected ${want}, got ${got} (${url})`);
};

// ---- the six shapes a YouTube link comes in ----
id('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'watch?v=');
id('https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'youtu.be');
id('youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'youtu.be with no scheme');
id('https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'embed');
id('https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'shorts');
id('https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'live');
id('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share', 'dQw4w9WgXcQ', 'mobile with extra params');
id('https://youtu.be/dQw4w9WgXcQ?t=90', 'dQw4w9WgXcQ', 'youtu.be with a timestamp');

// ---- and what is NOT one ----
id('https://vimeo.com/123456789', null, 'vimeo is not youtube');
id('https://example.com/watch?v=dQw4w9WgXcQ', null, 'another host copying the shape');
id('https://www.youtube.com/watch?v=short', null, 'an id of the wrong length');
id('https://www.youtube.com/results?search_query=krebs', null, 'a search page has no video');
check(
  fns.youTubeIdOf('https://www.youtube.com/@somechannel') === null,
  'a channel page is not a video',
);

// ---- normaliseUrl refuses what must never be opened ----
check(fns.normaliseUrl('javascript:alert(1)') === null, 'javascript: URLs are refused');
check(fns.normaliseUrl('  ') === null, 'blank is not a link');
check(fns.normaliseUrl('not a url') === null, 'prose is not a link');
check(fns.normaliseUrl('file:///etc/passwd') === null, 'file: URLs are refused');
check(
  fns.normaliseUrl('example.com/notes')?.startsWith('https://'),
  'a bare host is given https, not http',
);

// ---- timestamps ----
check(fns.parseStart('90') === 90, 'plain seconds');
check(fns.parseStart('1h2m3s') === 3723, 'hours, minutes and seconds');
check(fns.parseStart('2m') === 120, 'minutes alone');
check(fns.parseStart('0') === undefined, 'zero is not a start point');
check(fns.parseStart('banana') === undefined, 'nonsense is not a start point');
check(
  fns.makeNoteLink('https://youtu.be/dQw4w9WgXcQ?t=90')?.startAt === 90,
  'a t= parameter reaches the link',
);

// ---- the embed ----
const link = fns.makeNoteLink('https://youtu.be/dQw4w9WgXcQ?t=42');
const embed = fns.embedUrlFor(link);
check(
  embed.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
  `the embed uses the no-cookie host: ${embed}`,
);
check(embed.includes('playsinline=1'), 'the embed plays in the card rather than fullscreen');
check(embed.includes('start=42'), 'the embed carries the timestamp');
check(
  fns.thumbnailFor('dQw4w9WgXcQ').includes('hqdefault'),
  'the thumbnail is hqdefault, which every video has — maxresdefault is not',
);

// ---- it asks YouTube nothing ----
//
// Comment-stripped, because this file's own prose says "no fetch, no oEmbed
// lookup" and the first version of this assertion matched that sentence rather
// than any code. Two assertions in check:native-update went the same way; a
// doc comment explaining a rule contains every word the rule forbids.
const code = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
check(!/fetch\(|oembed|XMLHttpRequest/i.test(code), 'noteLinks.ts fetches something');

/* ------------------------------------------------------------------------
 * Error 153: the player needs an embedder.
 *
 * The card pointed the WebView straight at the embed URL, which makes the
 * player the top-level document — no referrer, no origin to check — and
 * YouTube answers "Video player configuration error, Error 153" instead of
 * playing. The app's owner photographed it inside a note. Nothing threw and
 * nothing logged.
 *
 * The fix is a page with the player framed on it, loaded with a `baseUrl` on a
 * real YouTube origin. These assertions are the reason it cannot quietly go
 * back: the failure is invisible from here (no emulator, and the storage host
 * is blocked), so the shape is what gets held.
 * --------------------------------------------------------------------- */
{
  const html = fns.embedHtmlFor(link);
  check(html.includes('<iframe'), 'the player is framed rather than being the document itself');
  check(
    html.includes(`src="${embed}"`),
    'the iframe carries the embed URL the rest of this file builds',
  );
  check(html.includes('allowfullscreen'), 'the framed player can still go fullscreen');
  check(
    embed.includes(`origin=${encodeURIComponent(fns.EMBED_ORIGIN)}`),
    `the embed declares the origin it expects to be framed in: ${embed}`,
  );
  check(
    /^https:\/\/(www\.)?youtube\.com$/.test(fns.EMBED_ORIGIN),
    `EMBED_ORIGIN has to be a real https YouTube origin, not ${fns.EMBED_ORIGIN}`,
  );

  const card = await fs.readFile(
    path.join(root, 'src', 'components', 'NoteLinkCard.tsx'),
    'utf8',
  );
  const cardCode = card.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  check(
    /source=\{\{\s*html:\s*embedHtmlFor\(link\),\s*baseUrl:\s*EMBED_ORIGIN\s*\}\}/.test(cardCode),
    'NoteLinkCard no longer feeds the WebView framed HTML with a baseUrl — that is Error 153 coming back',
  );
  check(
    !/source=\{\{\s*uri:\s*embedUrlFor/.test(cardCode),
    'NoteLinkCard points the WebView straight at the embed URL again, which is what Error 153 was',
  );
  check(
    /setSupportMultipleWindows=\{false\}/.test(cardCode),
    'a "Watch on YouTube" tap can open a second WebView inside the card with no way back',
  );
}

if (failures.length > 0) {
  console.error('note links check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  the six YouTube shapes parse, four look-alikes do not, javascript:/file: are refused, ' +
    'timestamps survive, nothing is fetched, and the player is framed on a real origin ' +
    '(which is what Error 153 was)',
);
