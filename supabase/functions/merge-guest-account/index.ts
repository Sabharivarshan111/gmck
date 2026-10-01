import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { secureEndpoint } from '../_shared/endpointSecurity.ts';

/** Both identities are verified by Auth; a client device ID is never proof. */
Deno.serve(secureEndpoint(async (req: Request) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer [^\s]+$/i.test(auth)) return json({ error: 'Sign in again.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const current = await client.auth.getUser(auth.slice(7));
  if (current.error || !current.data.user || current.data.user.is_anonymous !== false) return json({ error: 'A signed-in account is required.' }, 401);
  const body = await req.json().catch(() => null);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  let error;
  if (typeof body?.guest_proof === 'string' && /^[0-9a-f-]{36}$/i.test(body.guest_proof)) {
    ({ error } = await admin.rpc('merge_guest_with_proof', { _proof: body.guest_proof, _new_user_id: current.data.user.id }));
  } else {
    if (!body || typeof body.guest_access_token !== 'string' || body.guest_access_token.length > 8192) return json({ error: 'Guest session proof is required.' }, 400);
    const old = await client.auth.getUser(body.guest_access_token);
    if (old.error || !old.data.user || old.data.user.is_anonymous !== true || old.data.user.id === current.data.user.id) return json({ error: 'Guest session could not be verified.' }, 403);
    ({ error } = await admin.rpc('merge_verified_guest', { _old_user_id: old.data.user.id, _new_user_id: current.data.user.id }));
  }
  if (error) return json({ error: 'Progress transfer could not be completed. Please retry.' }, error.code === '42501' ? 403 : 503);
  return json({ success: true });
}, { maxBytes: 16 * 1024 }));
