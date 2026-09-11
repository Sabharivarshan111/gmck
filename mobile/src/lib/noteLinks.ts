/**
 * Links a reader pastes into a note, and the YouTube ones that play in place.
 *
 * Asked for as "an option to link a youtube video in notes, and if I click that
 * link the video plays". Two halves, and only the first is interesting:
 * recognising a YouTube URL is a parsing problem with a lot of shapes, and
 * playing one is a decision about what may legally be done with it.
 *
 * ## Why the player is a WebView and not `react-native-video`
 *
 * The app already ships ExoPlayer, and it would happily play a video file. It
 * may not play THIS one. Getting a YouTube video into ExoPlayer means
 * extracting the stream URL, and doing that is a breach of YouTube's Terms of
 * Service — the only sanctioned way to embed is their own IFrame player, which
 * needs a browser. Every library that does this properly (`react-native-youtube-iframe`
 * and the rest) is a thin wrapper over exactly that, which is why this file
 * builds the embed URL itself rather than adding one.
 *
 * `react-native-webview` is therefore a real new dependency and the only one
 * this feature needs. It is worth being explicit that it is not free: it is a
 * native module and it adds to the APK. The alternative — handing the link to
 * the YouTube app — takes the reader out of their notes and back in through the
 * recents list, which is the thing they were asking not to have to do.
 *
 * ## Everything here is a string on the phone
 *
 * A link is a URL and a title. No fetch, no oEmbed lookup, no title scrape:
 * the thumbnail is a URL YouTube serves statically, and anything else would
 * mean this app telling a third party which videos a student is studying from.
 */

export interface NoteLink {
  id: string;
  /** Exactly what was pasted, after trimming and adding a scheme if it had none. */
  url: string;
  /** What the reader called it. Optional — the URL is shown when it is absent. */
  title?: string;
  /** The eleven-character YouTube id, when this is a YouTube link. */
  videoId?: string;
  /** Seconds to start at, from a `t=` or `start=` parameter. */
  startAt?: number;
}

/**
 * A YouTube video id is exactly eleven characters of `[A-Za-z0-9_-]`.
 *
 * Pinned rather than "whatever is after the slash", because the loose version
 * matches half the paths on the internet and would put a broken player inside
 * a note about something else.
 */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/** `1h2m3s`, `90s` or plain `90` — YouTube writes all three. */
export function parseStart(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const plain = Number(value);
  if (Number.isFinite(plain) && plain > 0) {
    return Math.floor(plain);
  }
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value.trim());
  if (!match || (!match[1] && !match[2] && !match[3])) {
    return undefined;
  }
  const seconds =
    Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return seconds > 0 ? seconds : undefined;
}

/**
 * Give a pasted string a scheme, so `URL` can parse it.
 *
 * People paste `youtu.be/abc` as often as the full thing, and without this
 * every one of those is "not a link". `https` rather than `http`: a note is
 * being handed a URL to open later, and downgrading it silently would be this
 * app choosing a worse connection on the reader's behalf.
 */
export function normaliseUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    // `javascript:` and friends parse happily and must never be opened.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (!url.hostname.includes('.')) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * The video id in a YouTube URL, whichever of the six shapes it is.
 *
 * `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `/live/` and `/v/`. Shorts
 * matters more than it looks: a lot of what a student is sent by a friend is a
 * short, and a link that silently refuses to play half of what people paste is
 * a feature nobody trusts twice.
 */
export function youTubeIdOf(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return VIDEO_ID.test(id) ? id : null;
  }

  const v = parsed.searchParams.get('v');
  if (v && VIDEO_ID.test(v)) {
    return v;
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
    return VIDEO_ID.test(parts[1]) ? parts[1] : null;
  }
  return null;
}

/** Build a `NoteLink` from something a reader pasted, or null if it is not a URL. */
export function makeNoteLink(raw: string, title?: string): NoteLink | null {
  const url = normaliseUrl(raw);
  if (!url) {
    return null;
  }
  const videoId = youTubeIdOf(url) ?? undefined;
  let startAt: number | undefined;
  if (videoId) {
    try {
      const parsed = new URL(url);
      startAt =
        parseStart(parsed.searchParams.get('t')) ??
        parseStart(parsed.searchParams.get('start'));
    } catch {
      startAt = undefined;
    }
  }
  return {
    id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url,
    title: title?.trim() || undefined,
    videoId,
    startAt,
  };
}

/**
 * The still YouTube serves for a video, without asking YouTube anything.
 *
 * `hqdefault` exists for every video ever uploaded. `maxresdefault` does not —
 * it is absent for a great many older ones, and the note would show a broken
 * image for exactly the lectures a student is most likely to be sent.
 */
export function thumbnailFor(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * The embed URL for the IFrame player.
 *
 * `youtube-nocookie.com` on purpose: it is YouTube's own privacy-preserving
 * host and it does not set tracking cookies until the video is played. A
 * student's revision list is not something this app should be handing over
 * more of than it has to.
 *
 * `playsinline=1` keeps it in the card rather than throwing it fullscreen on
 * the first tap, and `rel=0` keeps the end screen to the same channel instead
 * of recommending whatever the algorithm has today.
 */
export function embedUrlFor(link: NoteLink): string {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    /*
       The origin the player checks its embedder against.

       This is half of the fix for **Error 153** below. YouTube's player reads
       it and compares it with the document that framed it; without it, and
       without the referrer that `baseUrl` supplies, the player has no embedder
       it is willing to believe in.
    */
    origin: EMBED_ORIGIN,
  });
  if (link.startAt) {
    params.set('start', String(link.startAt));
  }
  return `https://www.youtube-nocookie.com/embed/${link.videoId}?${params.toString()}`;
}

/**
 * The origin the player is told it is embedded in.
 *
 * It has to be a real https YouTube origin. `about:blank`, a `file://` path and
 * the WebView's default empty base all read to YouTube as "no embedder", which
 * is the failure below.
 */
export const EMBED_ORIGIN = 'https://www.youtube.com';

/**
 * The page the WebView loads, with the player inside an iframe on it.
 *
 * ## Error 153, which is what the reader actually saw
 *
 * The card used to point the WebView straight at the embed URL:
 * `source={{ uri: embedUrlFor(link) }}`. That works by accident for a long
 * time and then stops. A WebView navigating to `/embed/<id>` is a **top-level
 * navigation**: the player is the document, not something a document framed,
 * so the request carries no `Referer` and the player has no origin to check.
 * YouTube's embedded player answers that with
 *
 *     Video player configuration error
 *     Error 153
 *
 * which is what the app's owner photographed inside a note. Nothing in the app
 * was broken and nothing in the log said anything; the player simply refused to
 * start, and the still behind it had already been replaced by then.
 *
 * The fix is to give it an embedder. The WebView loads this HTML with
 * `baseUrl` set to `EMBED_ORIGIN`, so the iframe's request for the player is a
 * sub-resource of a page on `https://www.youtube.com` and carries that as its
 * referrer — which, with the matching `origin` parameter, is exactly the pair
 * the player is looking for. It is also what every library that does this
 * properly does; `react-native-youtube-iframe` ships the same shape.
 *
 * ## Why the markup is this plain
 *
 * No script, no player API, no message bridge. The card has no controls of its
 * own — play, pause, scrub and fullscreen are the player's — so there is
 * nothing for JavaScript here to do, and an inline script would need a content
 * security policy argument that a bare iframe does not.
 */
export function embedHtmlFor(link: NoteLink): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}
iframe{border:0;display:block;width:100%;height:100%}</style></head>
<body><iframe src="${embedUrlFor(link)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen title="YouTube video"></iframe></body></html>`;
}

/** What the card calls it when the reader did not name it. */
export function displayTitle(link: NoteLink): string {
  if (link.title) {
    return link.title;
  }
  try {
    const parsed = new URL(link.url);
    return link.videoId ? 'YouTube video' : parsed.hostname.replace(/^www\./, '');
  } catch {
    return link.url;
  }
}
