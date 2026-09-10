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
const LAST_CHECK_KEY = 'orbit:update-checked-at';

/** Six hours. Play caches its own answer; this is politeness about asking. */
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

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

/** The words for one versionCode, or null. */
export async function notesFor(versionCode: number): Promise<ReleaseNotes | null> {
  if (!versionCode) {
    return null;
  }
  const { data, error } = await supabase
    .from('app_releases')
    .select(COLUMNS)
    .eq('version_code', versionCode)
    .maybeSingle();
  if (error) {
    // supabase-js returns errors rather than throwing them, so this is the only
    // place one can be noticed. Offline is ordinary; the card copes without.
    warn('notesFor failed:', error);
    return null;
  }
  return data ? toNotes(data as Row) : null;
}

/** This build's own notes, for the card shown after an update lands. */
export const ownNotes = () => notesFor(APP_VERSION_CODE);

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

/** Postpone one specific version, so declining 16 does not decline 17. */
export async function dismissUpdate(versionCode: number): Promise<void> {
  await AsyncStorage.setItem(DISMISSED_KEY, String(versionCode)).catch(() => {});
}

async function dismissed(versionCode: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    return raw !== null && Number.parseInt(raw, 10) >= versionCode;
  } catch {
    return false;
  }
}

/**
 * The update to offer right now, or null.
 *
 * Every "not now" rule lives here rather than in the component, so the card has
 * one input and cannot half-apply one. A high-priority release skips the
 * dismissal and the throttle — that is what the priority means, and it is why
 * nothing sets it by default.
 */
export async function updateToOffer(): Promise<UpdateOffer | null> {
  const status = await playStatus();
  if (!status || !status.available) {
    return null;
  }
  const urgent = status.priority >= HIGH_PRIORITY;

  if (!urgent) {
    if (await dismissed(status.versionCode)) {
      return null;
    }
    try {
      const last = Number.parseInt((await AsyncStorage.getItem(LAST_CHECK_KEY)) ?? '0', 10);
      if (Number.isFinite(last) && Date.now() - last < CHECK_EVERY_MS) {
        return null;
      }
      await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    } catch {
      // Storage unavailable is not a reason to withhold an update.
    }
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
