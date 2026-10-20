import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyNeetStudy, parseNeetStudy, type NeetStudy } from './neetPgPlan';
export function useNeetStudy(bankId: string) {
  const [state, setState] = useState<NeetStudy>(emptyNeetStudy);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef(Promise.resolve());
  const key = 'orbit:neetpg:study:v1:' + bankId;
  useEffect(() => {
    let active = true;
    setReady(false);
    void AsyncStorage.getItem(key)
      .then(raw => {
        if (active) {
          setState(parseNeetStudy(raw));
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setStorageError(true);
      });
    return () => {
      active = false;
    };
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify(state);
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(key, raw))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [key, ready, state]);
  return { state, setState, ready, storageError };
}
