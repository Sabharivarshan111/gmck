import { Platform, Vibration } from 'react-native';
import { getSettings, HAPTIC_MAX_MS, HAPTIC_MIN_MS } from '@/lib/settings';

/**
 * Haptics.
 *
 * Deliberately built on React Native's core `Vibration` API rather than
 * `react-native-haptic-feedback`. That library gives access to Android's
 * HapticFeedbackConstants — a genuinely nicer "tick" — but it is another
 * native module to compile, shim in the preview harness, and carry on every
 * low-end device, for a refinement most users will not name. Core API, no new
 * dependency.
 *
 * ## The rule these obey
 *
 * Feedback is only added where it earns its place (apple-design §13 Utility).
 * Over-feedback trains people to ignore all of it, so the bar is: a *commit* —
 * a deliberate state change the user just made — or a *completion*. Not
 * navigation, not scrolling, not every tap. Two callers today:
 *
 *   • `tick()`     — switching theme. A commit.
 *   • `complete()` — a focus session ending. A completion.
 *
 * Anything new has to clear the same bar.
 *
 * ## The switch
 *
 * Android has a system-wide "touch feedback" setting, and `Vibration.vibrate`
 * ignores it — reading that setting needs a native module, which is the thing
 * this file exists to avoid. So the app carries its own switch, in Settings,
 * and every function here is gated on it. That was always the right answer;
 * it is now also the requested one.
 *
 * Strength is a **duration**, not an amplitude. The core API has no amplitude
 * control, so "stronger" means "longer" — from a tick you half-notice to one
 * you cannot miss.
 */

/** Pulse length for the current strength setting. */
function pulseMs(scale = 1): number {
  const { hapticStrength } = getSettings();
  const ms = HAPTIC_MIN_MS + (HAPTIC_MAX_MS - HAPTIC_MIN_MS) * hapticStrength;
  return Math.max(1, Math.round(ms * scale));
}

function enabled(): boolean {
  return Platform.OS === 'android' && getSettings().haptics;
}

/** Pattern for a finished session: two short pulses, not one long alarm. */
const COMPLETE_PATTERN = [0, 180, 120, 180];

/**
 * The lightest touch, for an ordinary tap.
 *
 * Deliberately weaker than `tick`: this one fires on every press in the app,
 * and feedback that is as loud as a commit is what trains people to stop
 * noticing any of it.
 */
export function tap(): void {
  if (!enabled()) {
    return;
  }
  try {
    Vibration.vibrate(pulseMs(0.55));
  } catch {
    // Never let feedback break the action it is decorating.
  }
}

/** A single light tap. For committing a deliberate choice. */
export function tick(): void {
  if (!enabled()) {
    return;
  }
  try {
    Vibration.vibrate(pulseMs());
  } catch {
    // Never let feedback break the action it is decorating.
  }
}

/** A finished focus session. Longer, because it fires with the screen away. */
export function complete(): void {
  if (!enabled()) {
    return;
  }
  try {
    Vibration.vibrate(COMPLETE_PATTERN);
  } catch {
    // Non-fatal.
  }
}
