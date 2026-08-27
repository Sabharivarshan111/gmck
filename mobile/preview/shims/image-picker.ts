/**
 * Dev-only stand-in for react-native-image-picker.
 *
 * The preview runs in a browser through react-native-web, where the native
 * picker does not exist. It cancels by default rather than inventing an asset:
 * a stub that returned a wallpaper would make the harness show a state the app
 * cannot actually reach from a tap, which is worse than showing nothing.
 *
 * `__orbitPickImage` is the one exception, and it is opt-in for a reason. The
 * visual-card path — attach a picture, see it on the back of the card — *is*
 * reachable from a tap on a device, and it is the only way `check:smoke` can
 * walk it at all. So the harness sets the flag for that one step and clears it
 * afterwards; nothing else ever sees anything but a cancellation.
 */
declare global {
  // eslint-disable-next-line no-var
  var __orbitPickImage: boolean | undefined;
}

/** A 2x2 red PNG. Small enough to be free, real enough to decode. */
const FAKE_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';

export async function launchImageLibrary() {
  if (globalThis.__orbitPickImage) {
    return {
      didCancel: false,
      assets: [
        {
          uri: `data:image/png;base64,${FAKE_PNG}`,
          base64: FAKE_PNG,
          type: 'image/png',
          fileSize: 128,
          width: 2,
          height: 2,
        },
      ],
    };
  }
  return { didCancel: true, assets: [] };
}
export async function launchCamera() {
  return { didCancel: true, assets: [] };
}
