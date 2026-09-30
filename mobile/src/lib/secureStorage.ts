import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeOrbitSecureStorage from '@/native/NativeOrbitSecureStorage';
import { createSecureStorage, type StringStorage } from './secureStorageAdapter';

const unavailable: StringStorage = {
  getItem: async () => { throw new Error('Android secure storage is unavailable'); },
  setItem: async () => { throw new Error('Android secure storage is unavailable'); },
  removeItem: async () => { throw new Error('Android secure storage is unavailable'); },
};

// Browser preview uses its existing browser sandbox; Android must have the native module.
export const secureStorage = Platform.OS === 'android'
  ? createSecureStorage(NativeOrbitSecureStorage ?? unavailable, AsyncStorage)
  : AsyncStorage;
