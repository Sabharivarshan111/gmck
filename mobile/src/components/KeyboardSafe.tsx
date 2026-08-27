import React from 'react';
import { KeyboardAvoidingView, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';

/**
 * A screen whose text inputs stay above the keyboard.
 *
 * **`adjustResize` no longer works, and that is the whole reason this exists.**
 * The manifest still asks for it and should — older Android uses it — but this
 * app targets SDK 36, and from Android 15 edge-to-edge is enforced for anything
 * targeting 35+: the window does not shrink when the IME appears, the app draws
 * behind it, and `adjustResize` is inert. An input near the bottom of a screen
 * therefore sits *under* the keyboard and you cannot see what you are typing.
 *
 * It was found in Ask AI, fixed there, and left there — so every other input in
 * the app still had it: the study-note editor, the calendar's event field, the
 * search boxes, every sheet. One screen was fixed and eleven were not, which is
 * what happens when a fix lives at its call site instead of in a primitive.
 *
 * Wrap the screen, not the input:
 *
 *     <KeyboardSafe style={styles.screen}>
 *       <ScrollView keyboardShouldPersistTaps="handled">…</ScrollView>
 *     </KeyboardSafe>
 *
 * `npm run check:keyboard` fails if a file with a `TextInput` neither uses this
 * nor names the ancestor that does.
 */
export function KeyboardSafe({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      /*
       * `padding` on Android too, never `undefined`.
       *
       * `undefined` means "do nothing, the window will resize", which is the
       * behaviour that stopped being true. On older Android, where the window
       * *does* resize, this padding is a no-op rather than a conflict: a
       * resized window reports no keyboard height to pad by.
       */
      behavior="padding"
      /*
       * No `keyboardVerticalOffset`, and adding one is the most likely way to
       * break this.
       *
       * React Native computes the lift as `frame.y + frame.height - keyboardY`
       * from *this view's own* screen-space bottom — which already sits above
       * the tab bar. Passing the tab bar's height as an offset therefore counts
       * it twice and leaves the input floating a whole bar above the keyboard,
       * which reads as a different bug rather than as a fix that went too far.
       */
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
