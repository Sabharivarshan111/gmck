---
name: keyboard-safe-input
description: Stop a text input from sitting under the Android soft keyboard. Use when adding any TextInput, search box, composer, comment field or inline editor to the React Native app; when someone reports that they cannot see what they are typing, that a field is hidden or covered by the keyboard, or that a Save/Send/Add button below a field does nothing on the first tap; and before shipping any screen or sheet that can be typed into.
---

# Inputs that stay above the keyboard

## The one thing to know

**`android:windowSoftInputMode="adjustResize"` does not work any more.** This
app targets SDK 36, and from **Android 15, edge-to-edge is enforced for apps
targeting 35+**: the window no longer shrinks when the IME appears, the app
draws behind it, and `adjustResize` is inert. Any input near the bottom of a
screen sits *under* the keyboard.

Leave the manifest alone — older Android still uses it, and there the fix below
is a harmless no-op, because a window that really resized reports no keyboard
height to pad by.

## The fix

Wrap the **screen**, not the input:

```tsx
import { KeyboardSafe } from '@/components/KeyboardSafe';

return (
  <KeyboardSafe>
    <ScrollView keyboardShouldPersistTaps="handled">
      …
    </ScrollView>
  </KeyboardSafe>
);
```

`components/KeyboardSafe.tsx` is the only place in the app that may use
`KeyboardAvoidingView`. `npm run check:keyboard` fails on a second one.

## Two things that look like fixes and are not

**Do not pass `keyboardVerticalOffset`.** React Native computes the lift as
`frame.y + frame.height - keyboardY` from the wrapper's *own* screen-space
bottom, which already sits above the tab bar. Passing the bar's height counts it
twice and leaves the field floating a whole bar above the keyboard — which reads
as a different bug, not as a fix that overshot. This was tried and reverted.

**Do not use `behavior={undefined}` on Android.** That means "do nothing, the
window will resize", which is exactly the behaviour that stopped being true.

## The second half: the tap that goes nowhere

A button under a focused field needs `keyboardShouldPersistTaps="handled"` on
the scroll container, **and** that is still not always enough. A `Pressable`
whose press begins inside the keyboard's own inset never hears the tap — it is
spent dismissing the keyboard. For a button that commits what was typed, call
`Keyboard.dismiss()` first:

```tsx
const add = useCallback(async () => {
  Keyboard.dismiss();
  try { … } catch (err) { setError(String(err)); }
}, [deps]);
```

This is why "Add card" appeared to do nothing on a phone while passing every
test in the browser preview — **react-native-web has no soft keyboard**, so the
harness cannot reproduce this class of bug at all. Do not conclude from a green
`check:smoke` that a keyboard problem is fixed.

## While you are there

An `async` `onPress` with no `catch` is an unhandled rejection, which React
Native does not surface: the action silently does nothing and there is nothing
to read. Every commit handler gets a `try/catch` that puts the message on screen.

## Checking your work

```sh
cd mobile && npm run check:keyboard
```

It fails if a file renders a `<TextInput` and neither uses `KeyboardSafe` nor is
listed in that script's `LIFTED_BY_ANCESTOR` map. Adding a name to that map is a
claim about which ancestor lifts it — write the ancestor down, do not just
silence the check.

Verified on a device or not at all. The preview cannot see this.
