import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QUESTION_PROGRESS_EVENT } from "@/lib/question-progress";
import {
  detectNewUnlocks,
  commitUnlocks,
  readLocalXp,
} from "@/lib/rewards";

interface Options {
  userId: string | null;
  cloudXp: number;
  cloudStreak: number;
  displayName?: string;
  onCelebrate: (payload: { kind: "level" | "streak" | "badge"; value: number; label?: string; emoji?: string }) => void;
  onXpDelta: (delta: number) => void;
}

/**
 * Listens for XP / streak changes (local progress events + Supabase realtime
 * on profiles) and triggers toasts + celebration callbacks.
 */
export function useXpStream({
  userId,
  cloudXp,
  cloudStreak,
  displayName,
  onCelebrate,
  onXpDelta,
}: Options) {
  /*
   * One baseline per source, because a lower reading from one source is not a
   * gain in another.
   *
   * Three places report an XP number here and they do not count the same
   * thing. `cloudXp` and the realtime `profiles` row are the server's count of
   * every question this ACCOUNT has ever ticked; `readLocalXp()` counts the
   * `question-` keys in THIS BROWSER. Sign in on a second browser and the
   * first is 300 while the second is 4.
   *
   * They shared one `prevXp` ref and each handler wrote its own number into
   * it, so un-ticking a question ran the local handler first (4 -> 3, no
   * toast, ref := 3) and then the realtime one, which read 299 against a
   * baseline of 3 and congratulated the reader with "+296 XP" for undoing
   * something. Ticking did the same with a different absurd number — which is
   * why the report was about the un-tick: a big number after a tick still
   * looks like the feature working.
   */
  const prevCloudXp = useRef<number>(cloudXp);
  const prevLocalXp = useRef<number>(readLocalXp());
  const prevStreak = useRef<number>(cloudStreak);
  const nameRef = useRef<string | undefined>(displayName);
  useEffect(() => { nameRef.current = displayName; }, [displayName]);

  // Sync refs when cloud values arrive
  useEffect(() => {
    // Compared against the cloud's own previous value, never against the
    // browser's — see the refs above.
    const xp = cloudXp;
    if (xp > prevCloudXp.current) {
      handleXpChange(prevCloudXp.current, xp, xp - prevCloudXp.current);
    }
    // Always sync (including decreases from un-ticks) so future deltas are correct.
    prevCloudXp.current = xp;
  }, [cloudXp]);

  useEffect(() => {
    if (cloudStreak > prevStreak.current) {
      handleStreakChange(prevStreak.current, cloudStreak);
    }
    prevStreak.current = cloudStreak;
  }, [cloudStreak]);

  function handleXpChange(from: number, to: number, delta: number) {
    onXpDelta(delta);
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const inSubject = path.startsWith("/subjects/");
    const currentName = nameRef.current;
    const desc = inSubject
      ? "📝 Keep crushing it — every question counts!"
      : currentName
      ? `Great work, Dr. ${currentName}!`
      : "Keep going!";
    toast.success(`+${delta} XP`, { description: desc, duration: 2000 });
    // The delta is honest to whichever source reported it; a badge is decided
    // on the best total known, so a browser that has only ticked four
    // questions does not un-announce an account's Gold Scholar.
    const unlocks = detectNewUnlocks(Math.max(to, prevCloudXp.current), prevStreak.current);
    if (unlocks.leveledUp) {
      onCelebrate({ kind: "level", value: unlocks.leveledUp });
    }
    for (const b of unlocks.badges) {
      onCelebrate({ kind: "badge", value: b.threshold, label: b.label, emoji: b.emoji });
    }
    commitUnlocks(unlocks, to, prevStreak.current);
  }

  function handleStreakChange(from: number, to: number) {
    toast(`🔥 ${to}-day streak!`, {
      description: "Keep the flame alive — answer one question tomorrow.",
      duration: 2500,
    });
    const unlocks = detectNewUnlocks(Math.max(prevCloudXp.current, prevLocalXp.current), to);
    if (unlocks.streakMilestone) {
      onCelebrate({ kind: "streak", value: unlocks.streakMilestone });
    }
    for (const b of unlocks.badges) {
      onCelebrate({ kind: "badge", value: b.threshold, label: b.label, emoji: b.emoji });
    }
    commitUnlocks(unlocks, Math.max(prevCloudXp.current, prevLocalXp.current), to);
  }

  // Local progress event → recompute local XP (handles both increases and decreases)
  useEffect(() => {
    const handler = () => {
      const xp = readLocalXp();
      if (xp > prevLocalXp.current) {
        handleXpChange(prevLocalXp.current, xp, xp - prevLocalXp.current);
      }
      // Always sync — an un-tick lowers this browser's count without
      // celebrating, and without moving the cloud's baseline.
      prevLocalXp.current = xp;
    };
    window.addEventListener(QUESTION_PROGRESS_EVENT, handler);
    return () => window.removeEventListener(QUESTION_PROGRESS_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  // Realtime subscription on profiles row
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload: any) => {
          const newXp: number = payload.new?.xp ?? 0;
          const newStreak: number = payload.new?.streak ?? 0;
          // The realtime row IS profiles.xp, so it shares the cloud baseline
          // rather than keeping a third one that could drift from it.
          if (newXp > prevCloudXp.current) {
            handleXpChange(prevCloudXp.current, newXp, newXp - prevCloudXp.current);
          }
          prevCloudXp.current = newXp;
          if (newStreak > prevStreak.current) {
            handleStreakChange(prevStreak.current, newStreak);
            prevStreak.current = newStreak;
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
