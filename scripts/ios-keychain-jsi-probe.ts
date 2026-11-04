// Copied/imported only in the isolated simulator workflow, never a production entry point.
import AsyncStorage from '@react-native-async-storage/async-storage';
import native from '@/native/NativeOrbitSecureStorage';
import {createSecureStorage} from './secureStorageAdapter';

const key = 'orbit:isolated-ios-keychain-qa:adapter';
const marker = 'orbit:isolated-ios-keychain-qa:jsi';
async function verify() {
  if (!native) throw new Error('Native Keychain binding missing');
  const storage = createSecureStorage(native, AsyncStorage);
  const same = (actual: unknown, expected: unknown) => {
    if (actual !== expected) throw new Error('Isolated storage assertion failed');
  };
  try {
    await storage.removeItem(key);
    same(await storage.getItem(key), null);
    await AsyncStorage.setItem(key, 'isolated-legacy-migration');
    same(await storage.getItem(key), 'isolated-legacy-migration');
    same(await native.getItem(key), 'isolated-legacy-migration');
    same(await AsyncStorage.getItem(key), null);
    const unicode = 'தமிழ் 🩺 医学🧠'.repeat(1000);
    await storage.setItem(key, unicode);
    same(await storage.getItem(key), unicode);
    await storage.setItem(key, 'replacement');
    same(await storage.getItem(key), 'replacement');
    await Promise.all([storage.getItem(key), storage.setItem(key, 'refreshed'), storage.removeItem(key)]);
    same(await storage.getItem(key), null);
    same(await native.getItem(key), null);
    same(await AsyncStorage.getItem(key), null);
  } finally {
    await storage.removeItem(key);
  }
  await native.setItem(marker, JSON.stringify({timestamp: Date.now(), pass: true}));
}
void verify().catch(() => {
  void native?.setItem(marker, JSON.stringify({timestamp: Date.now(), pass: false})).catch(() => {});
});
