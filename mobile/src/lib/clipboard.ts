import OrbitFiles from '@/native/NativeOrbitFiles';

/**
 * Copying a note, a table or a diagram's caption out of the app.
 *
 * ── Why this is not a package ──────────────────────────────────────────────
 *
 * React Native's own `Clipboard` was deprecated at 0.63 and is not in core at
 * 0.87, and every community replacement is a *native* dependency: an AAR, an
 * autolink entry, a ProGuard keep and a preview shim, bought to call two lines
 * of `ClipboardManager`. `OrbitFiles` is already registered, already a
 * TurboModule, already does errands on the reader's behalf, and adding a
 * method to it costs one codegen entry and nothing in the APK.
 *
 * ── Why it can fail, and why that is not an error ──────────────────────────
 *
 * The preview harness is react-native-web and has no TurboModules at all, so
 * `OrbitFiles` is legitimately `null` there — the same position the sound
 * module is in. Everything here resolves `false` rather than throwing, and the
 * callers hide their copy buttons when `clipboardAvailable` is false. A button
 * that silently does nothing is the failure this project has already shipped
 * once, with the sound module, and is the reason `soundAvailable` exists.
 */

const native = OrbitFiles ?? undefined;

/** Whether this build can reach a clipboard. False in the preview harness. */
export const clipboardAvailable =
  native != null && typeof (native as { copyText?: unknown }).copyText === 'function';

/**
 * Put text on the clipboard. Resolves whether it landed.
 *
 * `label` is what Android 13+ shows in its own clipboard preview, so it is the
 * thing being copied — "Exam flowchart", "Causes" — rather than the app's
 * name. Someone copying three sections in a row can then tell them apart in
 * the clipboard history, which is the whole reason the parameter exists.
 *
 * Empty text is refused rather than copied: silently replacing whatever the
 * reader already had on the clipboard with nothing is worse than not acting.
 */
export async function copyToClipboard(label: string, text: string): Promise<boolean> {
  if (!clipboardAvailable || !native) return false;
  const body = text.trim();
  if (!body) return false;
  try {
    return await native.copyText(label, body);
  } catch {
    return false;
  }
}
