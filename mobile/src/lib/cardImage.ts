import { launchImageLibrary } from 'react-native-image-picker';
import { warn } from './log';

/**
 * Pictures for a card you write yourself.
 *
 * **Stored as a data URI, not as a file path.** The picker hands back a URI
 * into the app's *cache* directory, which Android empties whenever it wants
 * the space. That is an acceptable trade for the wallpaper — one image, and a
 * load error just falls back to the plain theme — but a deck is different: the
 * picture *is* the card, and twenty of them silently turning into grey
 * rectangles a month after you wrote them is not a deck any more.
 *
 * The cost is that the bytes live in AsyncStorage, so they have to be small
 * enough that a deck of them still fits. Hence the hard downscale on the way in
 * and the byte cap below. A medical diagram survives 1200px and quality 0.6
 * perfectly well — these are line drawings and labelled photographs, not
 * material anyone is going to pinch-zoom into.
 */

/**
 * Per image, after base64 encoding.
 *
 * 700 KB is about six diagrams to a megabyte. AsyncStorage on Android is
 * SQLite-backed and starts misbehaving at multi-megabyte *values*, and the
 * whole custom-deck list is one value, so this is the number that decides
 * whether a 20-card visual deck is safe to keep.
 */
export const MAX_CARD_IMAGE_BYTES = 700_000;

/** A deck of more visual cards than this is past what one value should hold. */
export const MAX_IMAGE_CARDS_PER_DECK = 40;

export type PickedImage =
  | { uri: string }
  | { tooLarge: true }
  | null;

/**
 * Ask for one picture.
 *
 * No permission is requested and none may be added. Android's photo picker
 * runs out of process and returns only the item chosen, so `READ_MEDIA_IMAGES`
 * would be asking for the whole gallery to do a job that never needs it — the
 * same rule the wallpaper picker follows.
 */
export async function pickCardImage(): Promise<PickedImage> {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.6,
      // The bytes themselves, because the file this came from is not ours to
      // rely on. See the note at the top.
      includeBase64: true,
    });

    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      warn('card image picker error:', result.errorMessage);
      return null;
    }
    const asset = result.assets?.[0];
    if (!asset?.base64) {
      return null;
    }
    if (asset.base64.length > MAX_CARD_IMAGE_BYTES) {
      return { tooLarge: true };
    }
    const type = asset.type && asset.type.startsWith('image/') ? asset.type : 'image/jpeg';
    return { uri: `data:${type};base64,${asset.base64}` };
  } catch (error) {
    warn('card image picker threw:', error);
    return null;
  }
}
