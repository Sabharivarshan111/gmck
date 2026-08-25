import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const HEARTBEAT_MS = 15_000;
const ACTIVE_WINDOW_SECONDS = 45;
const DEVICE_ID_KEY = 'study_presence_device_id';

let cachedDeviceId: string | null = null;

async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
    const newId = 'mob_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch {
    const fallbackId = 'mob_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    cachedDeviceId = fallbackId;
    return fallbackId;
  }
}

export function useOnlinePresence(isStudying = false) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const pingAndRecount = async () => {
      try {
        const deviceId = deviceIdRef.current ?? (await getOrCreateDeviceId());
        deviceIdRef.current = deviceId;

        // Upsert current device presence heartbeat to Supabase study_presence table
        await supabase
          .from('study_presence')
          .upsert({
            device_id: deviceId,
            last_seen: new Date().toISOString(),
          });

        // Query active study count from Supabase
        const since = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000).toISOString();
        const { count, error } = await supabase
          .from('study_presence')
          .select('device_id', { count: 'exact', head: true })
          .gte('last_seen', since);

        if (!error && !cancelled) {
          setOnlineCount(count != null && count > 0 ? count : 1);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    pingAndRecount();

    const intervalId = setInterval(pingAndRecount, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (deviceIdRef.current) {
        supabase
          .from('study_presence')
          .delete()
          .eq('device_id', deviceIdRef.current)
          .then(() => {}, () => {});
      }
    };
  }, [isStudying]);

  return { onlineCount, loading };
}
