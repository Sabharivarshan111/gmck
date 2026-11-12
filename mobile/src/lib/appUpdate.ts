import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { warn } from '@/lib/log';
import { APP_VERSION_CODE } from '@/lib/appVersion';
import OrbitUpdate, { type UpdateStatus } from '@/native/NativeOrbitUpdate';

/**
 * "There is a newer version" comes from Google Play. "Here is what it fixed"
 * cannot.
 *
 * ## Why Play answers the first question and a table used to
 *
 * This asked `app_releases` whether a row existed with a higher versionCode and
 * a `live_on_play` flag set. That flag was a person promising, by hand, that
 * the Play listing had caught up — and until they remembered, the prompt was
 * silent; if they were early, it sent everyone to a page still showing the
 * version they had. Play knows the answer for *this reader on their track*, and
 * knows it without being told.
 *
 * `NativeOrbitUpdate` is that API. It reports nothing at all for a build Play
 * did not install, which is every APK from CI and every debug build — so the
 * absence of a prompt in testing is the expected result, not a fault.
 *
 * ## Why the table is still here
 *
 * Play does not give release notes to a client. Not in a different shape, not
 * behind another call — it is not in the API. So the words on the card come
 * from `app_releases`, looked up by the versionCode Play names. **No row means
 * the prompt still appears, without a list**: knowing an update exists is worth
 * more than knowing what is in it.
 *
 * `live_on_play` is gone from the table with this change. It only ever existed
 * to answer the question Play now answers, and a column nobody reads is a thing
 * every future reader has to reason about before concluding it is dead.
 */

const SEEN_VERSION_KEY = 'orbit:last-run-version';
const DISMISSED_KEY = 'orbit:update-dismissed';
/**
 * A dismissal only postpones an offer briefly. A permanent, per-version
 * dismissal caused students to lose the v38 prompt after tapping "Not now".
 * Re-check on app foreground too (UpdateNotice), not just process startup.
 */
const POSTPONE_MS = 15 * 60 * 1000;

/** Play's own threshold for "this has been available long enough to insist". */
const HIGH_PRIORITY = 4;

export interface ReleaseNotes {
  versionCode: number;
  versionName: string;
  headline: string;
  notes: string[];
}

export interface UpdateOffer {
  status: UpdateStatus;
  /** Null when this version has no row — the prompt still shows. */
  notes: ReleaseNotes | null;
  /** Play marked it high priority, so the card does not offer "Not now". */
  urgent: boolean;
}

export const updateSupported = OrbitUpdate !== null;

const COLUMNS = 'version_code, version_name, headline, notes';

interface Row {
  version_code: number;
  version_name: string;
  headline: string;
  notes: string[] | null;
}

const toNotes = (row: Row): ReleaseNotes => ({
  versionCode: row.version_code,
  versionName: row.version_name,
  headline: row.headline,
  notes: row.notes ?? [],
});

interface NotesLookup {
  notes: ReleaseNotes | null;
  failed: boolean;
}

/** Keep a failed read distinct from a version that genuinely has no row. */
async function lookupNotes(versionCode: number): Promise<NotesLookup> {
  if (!versionCode) {
    return { notes: null, failed: false };
  }
  try {
    const { data, error } = await supabase
      .from('app_releases')
      .select(COLUMNS)
      .eq('version_code', versionCode)
      .maybeSingle();
    if (error) {
      warn('notesFor failed:', error);
      return { notes: null, failed: true };
    }
    return { notes: data ? toNotes(data as Row) : null, failed: false };
  } catch (error) {
    warn('notesFor failed:', error);
    return { notes: null, failed: true };
  }
}

/** The update offer can show without notes if the read failed. */
export async function notesFor(versionCode: number): Promise<ReleaseNotes | null> {
  return (await lookupNotes(versionCode)).notes;
}

/** This build's notes need the failure state so an offline launch can retry. */
export const ownNotes = () => lookupNotes(APP_VERSION_CODE);

/** Ask Play. Null when the module is absent — the preview, and any non-Play build. */
export async function playStatus(): Promise<UpdateStatus | null> {
  if (!OrbitUpdate) {
    return null;
  }
  try {
    return JSON.parse(await OrbitUpdate.check()) as UpdateStatus;
  } catch (error) {
    warn('OrbitUpdate.check failed:', error);
    return null;
  }
}

/**
 * Whether this launch is the first on a new version.
 *
 * Read and written separately, because between the two the card has to actually
 * be shown: marking it seen at the read would lose the card for anyone whose
 * app is killed while the request for its notes is still out, which on a cheap
 * phone is not rare.
 *
 * A fresh install is deliberately NOT an upgrade. There is nothing to tell them
 * changed; the first launch records the version and shows nothing.
 */
export async function upgradedThisLaunch(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_VERSION_KEY);
    if (raw === null) {
      await AsyncStorage.setItem(SEEN_VERSION_KEY, String(APP_VERSION_CODE));
      return false;
    }
    return Number.parseInt(raw, 10) < APP_VERSION_CODE;
  } catch {
    return false;
  }
}

export async function markVersionSeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_VERSION_KEY, String(APP_VERSION_CODE)).catch(() => {});
}

/** Postpone only the offered version for 15 minutes, never permanently. */
export async function dismissUpdate(versionCode: number): Promise<void> {
  await AsyncStorage.setItem(
    DISMISSED_KEY,
    JSON.stringify({ versionCode, dismissedAt: Date.now() }),
  ).catch(() => {});
}

async function dismissed(versionCode: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const record: unknown = JSON.parse(raw);
    if (!record || typeof record !== 'object') return false;
    const { versionCode: saved, dismissedAt } = record as {
      versionCode?: unknown;
      dismissedAt?: unknown;
    };
    return saved === versionCode &&
      typeof dismissedAt === 'number' &&
      dismissedAt <= Date.now() &&
      Date.now() - dismissedAt < POSTPONE_MS;
  } catch {
    // Old clients persisted a bare number (a permanent dismissal). Treat
    // those entries as expired so people can see the update again.
    return false;
  }
}

/**
 * The update to offer right now, or null.
 *
 * The old six-hour global throttle hid an available Play update after the first
 * check. Always ask Play on app resume; only the short, per-version "Not now"
 * postponement suppresses a non-urgent offer. Play decides availability.
 */
export async function updateToOffer(): Promise<UpdateOffer | null> {
  const status = await playStatus();
  if (!status || !status.available) {
    return null;
  }
  const urgent = status.priority >= HIGH_PRIORITY;

  if (!urgent && await dismissed(status.versionCode)) {
    return null;
  }

  return { status, notes: await notesFor(status.versionCode), urgent };
}

/** Show Play's sheet. 'accepted' | 'cancelled' | 'failed' | 'unavailable'. */
export async function startUpdate(urgent: boolean): Promise<string> {
  if (!OrbitUpdate) {
    return 'unavailable';
  }
  try {
    return await OrbitUpdate.start(urgent ? 'immediate' : 'flexible');
  } catch (error) {
    warn('OrbitUpdate.start failed:', error);
    return 'failed';
  }
}

/** Install a finished flexible download. Restarts the app. */
export function completeUpdate(): void {
  OrbitUpdate?.complete();
}
