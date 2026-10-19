import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import OrbitFiles from '@/native/NativeOrbitFiles';
import { createBankInstaller } from '@shared/neetPgInstall';
import { resolveNode, type YearKey } from './questionBank';

const KEY = 'orbit:neet-pg:installed-bank:v1';
const MAX_BANK_BYTES = 25_000_000;
const files = () => {
  if (!OrbitFiles?.readText) throw new Error('Install the updated app to import an offline bank.');
  return OrbitFiles;
};
export const installedNeetBank = createBankInstaller({
  readPointer: () => AsyncStorage.getItem(KEY),
  writePointer: value => AsyncStorage.setItem(KEY, value),
  async pick() {
    const picked = await files().pick('copy', 'application/json,application/octet-stream,text/plain', 'neet-pg-bank');
    if (!picked) return null;
    const file = JSON.parse(picked) as { id: string; name: string; size: number; linked?: boolean };
    if (!file.id || file.linked || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_BANK_BYTES) {
      if (file.id && !file.linked) files().remove(file.id);
      throw new Error('Choose a complete JSON bank up to 25 MB.');
    }
    return { fileId: file.id, name: file.name, size: file.size };
  },
  read: id => files().readText(id, MAX_BANK_BYTES),
  async remove(id) { files().remove(id); },
}, async bank => {
  for (const chapter of bank.chapters) {
    const node = resolveNode(chapter.year as YearKey, chapter.path, 'tnmgr');
    if (!node || node.name !== chapter.name) throw new Error('A bank chapter does not match the existing MBBS syllabus.');
  }
  // Check real image decoding before committing the replacement pointer.
  for (const image of Object.values(bank.images)) {
    await new Promise<void>((resolve, reject) => Image.getSize(image.dataUri, (width, height) => {
      if (width > 0 && height > 0 && width * height <= 16_000_000) resolve();
      else reject(new Error('An offline image has invalid or excessive dimensions.'));
    }, () => reject(new Error('An offline image could not be decoded.'))));
  }
});
