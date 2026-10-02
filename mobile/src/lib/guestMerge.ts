import { supabase } from './supabase';
import { secureStorage } from './secureStorage';

const KEY = 'orbit:pending-guest-merge-v1';
/** Keep the previous guest proof encrypted until its transfer is acknowledged. */
export async function rememberGuestSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (session?.user.is_anonymous && session.access_token) {
    const saved = await secureStorage.getItem(KEY);
    if (saved) {
      try { const pending = JSON.parse(saved); if (pending.id === session.user.id && pending.proof) return; } catch {}
    }
    const { data: proof } = await supabase.rpc('prepare_guest_merge');
    await secureStorage.setItem(KEY, JSON.stringify({ id: session.user.id, access: session.access_token, proof: typeof proof === 'string' ? proof : undefined }));
  }
}

export async function retryGuestMerge(): Promise<void> {
  try {
    const raw = await secureStorage.getItem(KEY);
    if (!raw) return;
    const guest = JSON.parse(raw);
    const { data } = await supabase.auth.getSession();
    if (!data.session || data.session.user.is_anonymous || data.session.user.id === guest.id) return;
    const { data: result, error } = await supabase.functions.invoke('merge-guest-account', { body: { guest_access_token: guest.access, guest_proof: guest.proof } });
    if (!error && result?.success === true) await secureStorage.removeItem(KEY);
    // Never discard progress or overwrite a different account when offline/expired.
  } catch { /* Retain proof for retry; local progress is already preserved. */ }
}
