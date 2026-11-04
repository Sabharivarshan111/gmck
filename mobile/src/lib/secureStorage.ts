import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeOrbitSecureStorage from '@/native/NativeOrbitSecureStorage';
import { createSecureStorage, type StringStorage } from './secureStorageAdapter';

const unavailable: StringStorage = {
  getItem: async () => { throw new Error('Native secure storage is unavailable'); },
  setItem: async () => { throw new Error('Native secure storage is unavailable'); },
  removeItem: async () => { throw new Error('Native secure storage is unavailable'); },
};

// Both phone platforms require their secure native store; the preview uses its browser sandbox.
export const secureStorage = Platform.OS === 'android' || Platform.OS === 'ios'
  ? createSecureStorage(NativeOrbitSecureStorage ?? unavailable, AsyncStorage)
  : AsyncStorage;
