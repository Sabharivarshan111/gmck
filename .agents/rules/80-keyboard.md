---
description: Text inputs and the Android keyboard — why adjustResize is dead and what replaces it
---

# Inputs and the keyboard

**`android:windowSoftInputMode="adjustResize"` does not work any more.** The app
targets SDK 36, and from **Android 15 edge-to-edge is enforced for apps
targeting 35+**: the window does not shrink when the IME appears, the app draws
behind it, and adjustResize is inert. An input near the bottom of a screen sits
*under* the keyboard and you cannot see what you are typing.

Leave the manifest as it is — older Android uses it, and there the fix below is
a no-op rather than a conflict.

## Wrap the screen in `KeyboardSafe`

```tsx
<KeyboardSafe>
  <ScrollView keyboardShouldPersistTaps="handled">…</ScrollView>
</KeyboardSafe>
```

`mobile/src/components/KeyboardSafe.tsx` is the **only** file allowed to use
`KeyboardAvoidingView`. `npm run check:keyboard` fails on a second one, and on
any file that renders a `<TextInput` without either using `KeyboardSafe` or
being named in that script's `LIFTED_BY_ANCESTOR` map. That map is a claim about
which ancestor lifts the input — write the ancestor down rather than silencing
the check.

## Two non-fixes

- **Never pass `keyboardVerticalOffset`.** RN computes the lift from the
  wrapper's own screen-space bottom, which is already above the tab bar; adding
  the bar's height counts it twice and floats the field a whole bar clear of the
  keyboard. Tried, reverted.
- **Never `behavior={undefined}` on Android.** That means "the window will
  resize" — the thing that stopped being true.

## The button under the field

`keyboardShouldPersistTaps="handled"` on the scroll container, **and**
`Keyboard.dismiss()` at the top of any handler that commits what was typed. A
Pressable whose press starts inside the keyboard's inset never hears the tap —
it is spent dismissing. That is why "Add card" did nothing on a phone while
passing in the preview.

**The preview cannot reproduce any of this.** react-native-web has no soft
keyboard, so `check:smoke` being green says nothing about it. Device or nothing.

## Why this is a rule and not a note

It was found on Ask AI, fixed on Ask AI, and left there. A month later eleven
other inputs still had it: the study-note editor, the calendar's event field,
every search box, every sheet. A fix that lives at its call site is a fix
exactly one screen has.
