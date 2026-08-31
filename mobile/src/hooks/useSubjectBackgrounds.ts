import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const STORAGE_KEY = 'orbit:subject-backgrounds-v1';
export const MAX_SUBJECT_MEDIA_BYTES = 20 * 1024 * 1024; // 20 MB

export interface SubjectMedia {
  uri: string;
  type: 'image' | 'video';
  fileSize?: number;
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
    delete next[subjectKey];
    cachedBackgrounds = next;
    notify();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedBackgrounds));
  }, []);

  const pickBackground = useCallback(
    async (subjectKey: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'mixed',
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

        const isVideo = asset.type?.startsWith('video') || asset.uri.endsWith('.mp4') || asset.uri.endsWith('.mov');

        await setSubjectBackground(subjectKey, {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
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
