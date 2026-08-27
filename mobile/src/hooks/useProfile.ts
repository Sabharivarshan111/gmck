import { useCallback, useSyncExternalStore } from 'react';
import {
  fetchCloudProfile,
  readLocalProfile,
  registerOpen,
  saveProfile as persistProfile,
  YEAR_TO_KEY,
  type CloudProfile,
  type LocalProfile,
  type Year,
} from '@/lib/profile';
import type { YearKey } from '@/lib/questionBank';
import { reconcileProgress } from '@/lib/progress';
import { currentValue, recordToday, type StreakState } from '@/lib/streak';

/**
 * Small store so every screen sees the same profile. The profile is read once
 * at launch and re-published on save, rather than each screen loading its own
 * copy and drifting.
 */
let localProfile: LocalProfile | null = null;
let cloudProfile: CloudProfile | null = null;
let localStreak: StreakState = { lastActiveDay: '', current: 0, best: 0 };
let hydrated = false;
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return version;
}

/** Load the stored profile and refresh streak/XP from the cloud. */
export async function hydrateProfile(): Promise<void> {
  localProfile = await readLocalProfile();
  hydrated = true;
  emit();

  const cloud = await fetchCloudProfile();
  if (cloud) {
    cloudProfile = cloud;
    emit();
  }
  const open = await registerOpen();
  if (open && cloudProfile) {
    cloudProfile = { ...cloudProfile, streak: open.streak, last_active_date: open.last_active_date };
    emit();
  }
}

/**
 * Record today locally, whether or not there is ever a session.
 *
 * Deliberately not inside `hydrateProfile`: that function's cloud half can fail
 * for a dozen ordinary reasons — offline, anonymous auth disabled, no profile
 * row yet — and the local streak is the half that has to work regardless. It
 * was the *only* source before, which is why a fresh install showed "0 day
 * streak" for ever.
 */
export async function hydrateStreak(): Promise<void> {
  localStreak = await recordToday();
  emit();
}

export function useProfile() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const save = useCallback(async (next: LocalProfile) => {
    const cloud = await persistProfile(next);
    localProfile = next;
    if (cloud) {
      cloudProfile = cloud;
      /**
       * Back-fill everything ticked before this moment.
       *
       * Anonymous sign-in happens inside saveProfile and nowhere else, so on a
       * fresh install there is no session at launch — App.tsx's
       * reconcileProgress() correctly does nothing, and until this commit
       * nothing ever re-ran it. A user who worked through questions before
       * finishing onboarding kept that progress on the device: their XP,
       * streak and leaderboard position did not reflect it.
       *
       * It self-healed on the next launch, or the next visit to My Progress,
       * which is exactly why it was easy to miss.
       *
       * Gated on `cloud` because that is the proof the session AND the profile
       * row both exist. record_questions_done reads the profile's year and
       * returns 0 without it (its `IF _year IS NULL THEN RETURN 0`), so
       * pushing any earlier is a silent no-op.
       */
      reconcileProgress().catch(() => {});
    }
    emit();
  }, []);

  const setYear = useCallback(
    async (year: Year) => {
      const base = localProfile ?? { display_name: '', year };
      // Renaming is a separate, validated action; only the year moves here.
      if (!base.display_name) {
        localProfile = { ...base, year };
        emit();
        return;
      }
      await save({ ...base, year });
    },
    [save],
  );

  const year: Year = localProfile?.year ?? 'second';

  return {
    local: localProfile,
    cloud: cloudProfile,
    hydrated,
    /** Convenience: the year in the app's internal key form. */
    yearKey: YEAR_TO_KEY[year] as YearKey,
    year,
    displayName: localProfile?.display_name ?? '',
    /*
     * The larger of the two, which is the only merge that cannot lose a day.
     * The device's count always exists; the cloud's is what survives a
     * reinstall and what the leaderboard reads. `currentValue` re-checks the
     * stored day against today, so a streak broken two days ago reads as 0
     * rather than as whatever it was when it stopped.
     */
    streak: Math.max(currentValue(localStreak), cloudProfile?.streak ?? 0),
    freezes: cloudProfile?.streak_freezes_available ?? 0,
    needsOnboarding: hydrated && !localProfile,
    save,
    setYear,
  };
}
