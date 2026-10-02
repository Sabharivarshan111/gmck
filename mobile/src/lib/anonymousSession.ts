import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// One silent guest session per concurrent request; preserve any existing account.
let pending: Promise<Session> | null = null;
export function ensureAnonymousSession(): Promise<Session> {
  if (pending) return pending;
  pending = (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;
    const result = await supabase.auth.signInAnonymously();
    if (result.error) throw result.error;
    if (!result.data.session) throw new Error('Could not create a guest session.');
    return result.data.session;
  })().finally(() => { pending = null; });
  return pending;
}
