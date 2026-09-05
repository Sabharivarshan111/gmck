import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { warn } from '@/lib/log';
import { APP_VERSION_CODE } from '@/lib/appVersion';

/**
 * "There is a newer version" and "here is what this one fixed", from one table.
 *
 * ## Why not Google's in-app update API
 *
 * `com.google.android.play:app-update` is the official answer to the first
 * half and it cannot do the second at all: Play does not hand release notes to
 * the client, so a card saying what an update fixed has to come from
 * somewhere else regardless. It also only works for a build Play itself
 * installed — every APK from CI, and every sideloaded test build, gets
 * `UPDATE_NOT_AVAILABLE` no matter what is on the listing, which is exactly
 * the configuration this gets tested in. And it is another native dependency,
 * with a TurboModule to write, for a number.
 *
 * So: one `app_releases` row per shipped versionCode, read anonymously. It
 * answers both questions, needs nothing new in the APK, and the notes can be
 * corrected after the build has gone out — which the Play listing's own
 * "what's new" cannot be without a new release.
 *
 * ## The two rules that stop this being annoying
 *
 * **`live_on_play` gates the prompt.** A build reaches testers days before the
 * listing serves it. Telling everyone else to go and update to a version the
 * store does not have yet sends them to a page showing the version they
 * already have, which reads as the app being broken.
 *
 * **A dismissal is per version.** Postponing 16 must not also postpone 17.
 * Stored as the version that was declined rather than a boolean, so the next
 * release asks again on its own without anything having to clear a flag.
 */

const SEEN_VERSION_KEY = 'orbit:last-run-version';
const DISMISSED_KEY = 'orbit:update-dismissed';
const LAST_CHECK_KEY = 'orbit:update-checked-at';

/** Six hours. The answer changes a few times a year; this is politeness. */
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

export interface Release {
  versionCode: number;
  versionName: string;
  headline: string;
  notes: string[];
  mandatory: boolean;
  liveOnPlay: boolean;
}

interface Row {
  version_code: number;
  version_name: string;
  headline: string;
  notes: string[] | null;
  mandatory: boolean;
  live_on_play: boolean;
}

const toRelease = (row: Row): Release => ({
  versionCode: row.version_code,
  versionName: row.version_name,
  headline: row.headline,
  notes: row.notes ?? [],
  mandatory: row.mandatory,
  liveOnPlay: row.live_on_play,
});

const COLUMNS = 'version_code, version_name, headline, notes, mandatory, live_on_play';

/**
 * The newest release that is actually installable, or null.
 *
 * Ordered and filtered in Postgres rather than here: a client that fetches the
 * whole table to find one row gets slower with every release it has ever made.
 */
export async function fetchUpdate(): Promise<Release | null> {
  const { data, error } = await supabase
    .from('app_releases')
    .select(COLUMNS)
    .gt('version_code', APP_VERSION_CODE)
    .eq('live_on_play', true)
    .order('version_code', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    // supabase-js returns errors rather than throwing them, so this is the
    // only place they can be noticed. Offline is the ordinary case and is not
    // worth interrupting anybody over.
    warn('fetchUpdate failed:', error);
    return null;
  }
  return data ? toRelease(data as Row) : null;
}

/** This build's own release row, for the "what's new" card. */
export async function fetchOwnRelease(): Promise<Release | null> {
  const { data, error } = await supabase
    .from('app_releases')
    .select(COLUMNS)
    .eq('version_code', APP_VERSION_CODE)
    .maybeSingle();
  if (error) {
    warn('fetchOwnRelease failed:', error);
    return null;
  }
  return data ? toRelease(data as Row) : null;
}

/**
 * Whether this launch is the first on a new version.
 *
 * Read and written separately, and the write is `markVersionSeen` below,
 * because between the two the card has to actually be shown. Marking it seen
 * at the read would lose the card for anyone whose app is killed while the
 * network call for its notes is still out — which on a cheap phone is not rare.
 *
 * A fresh install is deliberately NOT an upgrade: there is nothing to tell
 * them changed. The very first launch records the version and shows nothing.
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

/** Postpone one specific version. */
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
 * Everything that decides "not now" is in here rather than in the component,
 * so the card has one input and cannot half-apply a rule. A mandatory release
 * ignores both the dismissal and the throttle: that is the whole meaning of
 * the flag, and it is the reason it defaults to false.
 */
export async function updateToOffer(): Promise<Release | null> {
  const release = await fetchUpdate();
  if (!release) {
    return null;
  }
  if (release.mandatory) {
    return release;
  }
  if (await dismissed(release.versionCode)) {
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
  return release;
}
