import 'react-native-url-polyfill/auto';
import { secureStorage } from './secureStorage';
import { createClient } from '@supabase/supabase-js';

// Same project the web app talks to — the anon key is a public client key.
const SUPABASE_URL = 'https://pmtgeydtqypwrypshhsx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Android sessions migrate to verified Keystore-backed encrypted storage.
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There is no URL to parse a session out of in a native app.
    detectSessionInUrl: false,
  },
});
