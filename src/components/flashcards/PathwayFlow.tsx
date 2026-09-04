import {
  normalizePathway,
  pathwayStepLabel,
  type CardPathway,
} from "@/lib/pathwayCards";

/**
 * The chain on the back of a pathway flashcard — the web app's half.
 *
 * The native app draws the same thing in `mobile/src/components/PathwayFlow.tsx`,
 * and the two are separate files only because a React Native `View` and a `div`
 * are not the same object. **Everything that decides what a pathway *is* — the
 * shape, the field names, the step cap, the spoken label — is imported from
 * `src/lib/pathwayCards.ts` and written once.** `npm run check:pathway-cards`
 * fails if either app grows its own reader for this payload.
 *
 * The drawing is the same too, on purpose: a rail down the left with a numbered
 * node per step and the step beside it. A student who studies a chapter on
 * their phone in the morning and on a laptop that evening is looking at one
 * deck, and a pathway that is a rail in one app and a stack of arrows in the
 * other reads as two different features.
 *
 * The connector runs from a node's centre to the next node's centre and is
 * drawn behind the node, so the line never appears to stop short of a circle.
 */
export default function PathwayFlow({
  pathway,
  compact,
}: {
  pathway: CardPathway | unknown;
  /** Spine only — for a preview row, not for study. */
  compact?: boolean;
}) {
  /*
   * Read through the shared normaliser, never off the raw payload. The model
   * returns `{ label, detail }` objects usually and bare strings sometimes, and
   * an object rendered directly by React is a crash rather than the native
   * app's `[object Object]` — a different symptom of the same mistake.
   */
  const value = normalizePathway(pathway);
  if (!value) return null;
  const { steps, title, caption } = value;

  return (
    <div className="mt-1">
      {title && (
        <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-2">
          {title.toUpperCase()}
        </p>
      )}

      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <div
            key={`${index}-${step.label}`}
            className="flex items-stretch"
            aria-label={pathwayStepLabel(step, index, steps.length)}
          >
            <div className="relative w-6 shrink-0 flex justify-center">
              {!last && (
                <span
                  aria-hidden
                  className="absolute top-3 bottom-0 w-0.5 rounded bg-primary/35"
                />
              )}
              <span className="relative z-10 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold flex items-center justify-center">
                {index + 1}
              </span>
            </div>

            <div
              className={`flex-1 ml-2.5 rounded-xl border bg-muted/40 px-3 py-2 ${
                last ? "" : "mb-2"
              }`}
            >
              <p className="text-sm font-semibold leading-snug">{step.label}</p>
              {step.detail && !compact && (
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {caption && !compact && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <p className="text-[11px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
            HIGH-YIELD
          </p>
          <p className="text-xs leading-snug mt-0.5">{caption}</p>
        </div>
      )}
    </div>
  );
}
