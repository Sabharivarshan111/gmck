import AsyncStorage from '@react-native-async-storage/async-storage';
import OrbitFiles from '@/native/NativeOrbitFiles';
import type { AttachMode } from './noteFiles';
import { warn } from './log';

/**
 * Music to study to, from the reader's own phone.
 *
 * **Not a streaming service and not a cloud library.** The tracks are files
 * already on the device, chosen through Android's own document picker, copied
 * into app storage and played from there. No account, no catalogue, nothing
 * uploaded — the same rule the note attachments follow, and for the same
 * reason: this is somebody's music, and it is not this app's to keep a copy of
 * on a server.
 *
 * **Two ways to add one**, the same two a note attachment offers and for the
 * same reasons:
 *
 *   • **Keep a copy in Orbit** — the bytes are copied into app storage, so the
 *     track plays whatever happens to the original. Costs space.
 *   • **Link to the original** — nothing is copied; Orbit takes a persistable
 *     URI grant on the file where it already is. Costs no space, and stops
 *     working if the reader moves or deletes it.
 *
 * That second one is only safe because the grant is *persistable*: an ordinary
 * picker grant is one-shot and would expire at the next reboot, leaving a
 * playlist that silently emptied itself — which is worse than one that was
 * never saved.
 *
 * And it is why `removeTrack` takes the whole track rather than an id.
 * Forgetting a linked track releases our grant and touches nothing else; the
 * file is the reader's and lives outside this app. An id alone makes the two
 * cases indistinguishable, and the wrong branch deletes somebody's music.
 */

const KEY = 'orbit:music:tracks';

/** How many tracks a playlist may hold. */
export const MAX_TRACKS = 60;

export interface Track {
  /**
   * A copied track's stored-file id, or a linked one's content URI — which is
   * what `OrbitFiles` uses as an id for a link, so one field addresses both.
   */
  id: string;
  /** True when the original was linked rather than copied into Orbit. */
  linked: boolean;
  /** The original's URI. Only a linked track has one. */
  uri?: string;
  /** The filename, as a fallback for a track with no tags. */
  fileName: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  /** `file://` path to the cover the track carries, or empty. */
  artwork: string;
  addedAt: number;
}

/** What to show as the track's name: its tag, or its filename. */
export function trackTitle(track: Track): string {
  if (track.title.trim()) {
    return track.title.trim();
  }
  // "03 - Nocturne.mp3" reads better than "03 - Nocturne.mp3" with the
  // extension still on it, and a leading track number is noise here.
  return track.fileName.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/^\d{1,3}[\s._-]+/, '');
}

export function trackArtist(track: Track): string {
  return track.artist.trim() || track.album.trim() || 'On this phone';
}

export async function loadTracks(): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as Track[]).filter(t => t && typeof t.id === 'string')
      : [];
  } catch {
    // A list that will not parse is returned empty rather than thrown: the
    // timer must still open.
    return [];
  }
}

async function persist(tracks: Track[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(tracks));
}

/**
 * The uri that plays a track, or empty if the file is gone.
 *
 * Android returns an absolute path; anything else is already a URL and goes
 * through untouched — the same rule `noteFileUri` follows, and for the same
 * reason: the preview harness has no app storage and serves a sample, so
 * without that second case the one flow this file exists for is the one flow
 * no check can walk.
 */
export function trackUri(track: Track): string {
  // A link is already a URI, and ExoPlayer reads content:// directly, so
  // there is nothing to resolve.
  if (track.linked) {
    return track.uri ?? '';
  }
  const path = OrbitFiles?.pathFor(track.id) ?? '';
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? `file://${path}` : path;
}

export type PickResult =
  | { added: Track }
  | { cancelled: true }
  | { error: string }
  | { full: true };

/**
 * Ask for one track, and read what it says about itself.
 *
 * The picker is narrowed to `audio/*`: offering a PDF here would be offering
 * something the player cannot do anything with. It needs **no permission** —
 * `ACTION_OPEN_DOCUMENT` runs out of process and returns only the one item
 * chosen, which is why `READ_MEDIA_AUDIO` is not in the manifest and must not
 * be added.
 */
export async function pickTrack(mode: AttachMode = 'copy'): Promise<PickResult> {
  const native = OrbitFiles;
  if (!native) {
    return { error: 'Adding music needs the app itself — it does not work in the preview.' };
  }
  const existing = await loadTracks();
  if (existing.length >= MAX_TRACKS) {
    return { full: true };
  }

  let raw: string;
  try {
    raw = await native.pick(mode, 'audio/*', 'music');
  } catch (error) {
    warn('[music] picker failed:', error);
    return { error: 'That file could not be added.' };
  }
  if (!raw) {
    return { cancelled: true };
  }

  const file = JSON.parse(raw) as {
    id: string;
    uri?: string;
    linked?: boolean;
    name: string;
    mime: string;
    size: number;
  };
  const linked = file.linked === true;

  /*
   * Checked after the fact rather than trusted from the picker. Providers
   * disagree about what an audio file is — some report
   * `application/octet-stream` for a perfectly ordinary .m4a — so the MIME
   * type is a hint and the extension is the second opinion.
   */
  const looksAudio =
    file.mime.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/i.test(file.name);
  if (!looksAudio) {
    // Undo exactly what was done: release a grant we took, delete a copy we
    // made. Never the other way round.
    if (linked) {
      native.release(file.uri ?? file.id);
    } else {
      native.remove(file.id);
    }
    return { error: `${file.name} is not an audio file.` };
  }

  let info = { title: '', artist: '', album: '', durationMs: 0, artwork: '' };
  try {
    const meta = await native.audioInfo(file.id);
    if (meta) {
      info = { ...info, ...(JSON.parse(meta) as typeof info) };
    }
  } catch (error) {
    // Tags are a nicety. A track with none still plays, under its filename.
    warn('[music] could not read tags:', error);
  }

  const track: Track = {
    id: file.id,
    linked,
    uri: file.uri,
    fileName: file.name,
    title: info.title ?? '',
    artist: info.artist ?? '',
    album: info.album ?? '',
    durationMs: info.durationMs ?? 0,
    artwork: info.artwork ?? '',
    addedAt: Date.now(),
  };
  await persist([...existing, track]);
  return { added: track };
}

/**
 * Forget a track.
 *
 * **Takes the whole track, never an id**, which is the same rule
 * `removeNoteFile` follows and for the same reason. A copy is ours and its
 * bytes go with it — a copied track left behind is space the reader can only
 * ever see as "Orbit is using 800MB", with no way to find out why. A *link* is
 * somebody's own music sitting in their own folder: removing it releases our
 * grant and deletes nothing. An id alone cannot tell those apart, and the
 * wrong branch is somebody's file gone.
 */
export async function removeTrack(target: Track): Promise<Track[]> {
  const tracks = await loadTracks();
  const next = tracks.filter(track => track.id !== target.id);
  await persist(next);
  try {
    if (target.linked) {
      OrbitFiles?.release(target.uri ?? target.id);
    } else {
      OrbitFiles?.remove(target.id);
    }
  } catch (error) {
    warn('[music] could not remove', target.id, error);
  }
  return next;
}

/** Whether a linked track's original is still where the reader left it. */
export function trackIsAlive(track: Track): boolean {
  if (!track.linked) {
    return true;
  }
  try {
    return OrbitFiles?.linkStatus(track.uri ?? track.id) === 'ok';
  } catch {
    return true;
  }
}

/** The next track after `id`, wrapping at the end. Null for an empty list. */
export function nextTrack(tracks: Track[], id: string | null): Track | null {
  if (tracks.length === 0) {
    return null;
  }
  const at = tracks.findIndex(track => track.id === id);
  return tracks[(at + 1) % tracks.length] ?? tracks[0];
}

/** The previous track, wrapping at the start. */
export function previousTrack(tracks: Track[], id: string | null): Track | null {
  if (tracks.length === 0) {
    return null;
  }
  const at = tracks.findIndex(track => track.id === id);
  return tracks[(at - 1 + tracks.length) % tracks.length] ?? tracks[0];
}

/** `m:ss`, the way every music player writes it. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
