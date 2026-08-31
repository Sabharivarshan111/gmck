import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import OrbitFiles from '@/native/NativeOrbitFiles';
import { warn } from '@/lib/log';

const STORAGE_KEY = 'orbit:subject-backgrounds-v1';
export const MAX_SUBJECT_MEDIA_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * A picture the reader put on a subject card. On this phone only — it is a
 * photograph out of their own gallery, and `check:cloud-ids` keeps it that way.
 *
 * `id` is the copy inside Orbit's own storage; `uri` is only what the picker
 * handed back. **The copy is the point.** `react-native-image-picker` returns
 * a path into the app *cache*, which Android empties whenever it wants the
 * space — so a card set today went blank a few days later, with nothing to
 * show for it but a black tile where the gradient used to be.
 */
export interface SubjectMedia {
  /** The file inside Orbit, once it has been copied there. */
  id?: string;
  uri: string;
  type: 'image' | 'video';
  fileSize?: number;
}

const files = OrbitFiles ?? undefined;

/**
 * Where to actually read the picture from.
 *
 * The copy wins when there is one. Falling back to the picker's URI keeps the
 * preview harness — which has no app storage — showing something, and covers
 * a card set by an older build before copies existed.
 */
export function subjectMediaUri(media: SubjectMedia | null | undefined): string | null {
  if (!media) {
    return null;
  }
  if (media.id && files) {
    try {
      const path = files.pathFor(media.id);
      if (path) {
        return path.startsWith('/') ? `file://${path}` : path;
      }
    } catch {
      // Fall through to the original URI rather than showing nothing.
    }
  }
  return media.uri || null;
}

let cachedBackgrounds: Record<string, SubjectMedia> = {};
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function useSubjectBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<Record<string, SubjectMedia>>(cachedBackgrounds);

  useEffect(() => {
    const update = () => setBackgrounds({ ...cachedBackgrounds });
    listeners.add(update);

    // Initial hydration
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            cachedBackgrounds = parsed;
            notify();
          }
        } catch {
          // ignore corrupted data
        }
      }
    });

    return () => {
      listeners.delete(update);
    };
  }, []);

  const setSubjectBackground = useCallback(async (subjectKey: string, media: SubjectMedia) => {
    cachedBackgrounds = {
      ...cachedBackgrounds,
      [subjectKey]: media,
    };
    notify();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedBackgrounds));
  }, []);

  const removeSubjectBackground = useCallback(async (subjectKey: string) => {
    const next = { ...cachedBackgrounds };
    // The copy is ours and nothing else points at it, so it goes with the card.
    const going = next[subjectKey];
    if (going?.id && files) {
      try {
        files.remove(going.id);
      } catch {
        // A file left behind is wasted space, not a broken card.
      }
    }
    delete next[subjectKey];
    cachedBackgrounds = next;
    notify();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedBackgrounds));
  }, []);

  const pickBackground = useCallback(
    async (subjectKey: string): Promise<{ success: boolean; error?: string }> => {
      try {
        /*
         * Photos only. The card draws its background with `<Image>`, and the
         * grid shows six of them at once — six ExoPlayer instances looping on
         * a phone chosen for being cheap is the most expensive thing this app
         * could put on a screen. `mixed` was offered and a chosen video came
         * back as a URI `<Image>` cannot draw, which is a blank card.
         */
        const result = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 1,
          quality: 0.8,
        });

        if (result.didCancel || !result.assets || result.assets.length === 0) {
          return { success: false };
        }

        const asset = result.assets[0];
        if (!asset.uri) {
          return { success: false, error: 'Could not access the selected file.' };
        }

        // 20 MB size validation
        if (asset.fileSize && asset.fileSize > MAX_SUBJECT_MEDIA_BYTES) {
          return {
            success: false,
            error: `File size (${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds 20 MB limit. Please choose a smaller picture or video.`,
          };
        }

        /*
         * Copy it into Orbit's own storage before storing anything. The
         * picker's grant is one-shot and its file lives in the cache, so the
         * URI alone is a picture that works until Android needs the space.
         */
        let id: string | undefined;
        if (files) {
          try {
            const parsed = JSON.parse(await files.adopt(asset.uri)) as { id?: string };
            if (typeof parsed.id === 'string' && parsed.id) {
              id = parsed.id;
            }
          } catch (error) {
            // Keep the picture on screen with the URI we have rather than
            // refusing the whole thing; it just may not outlive the cache.
            warn('[subjectBackgrounds] could not copy the picture:', error);
          }
        }

        await setSubjectBackground(subjectKey, {
          id,
          uri: asset.uri,
          type: 'image',
          fileSize: asset.fileSize,
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to select image.' };
      }
    },
    [setSubjectBackground],
  );

  return {
    backgrounds,
    getBackground: (subjectKey: string) => backgrounds[subjectKey] ?? null,
    pickBackground,
    removeSubjectBackground,
  };
}
