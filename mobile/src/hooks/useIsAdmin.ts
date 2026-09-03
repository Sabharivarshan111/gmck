import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Whether the signed-in reader is an admin.
 *
 * This asks Postgres — `is_admin()`, which reads the `user_roles` table — and
 * never compares an email address in the client. That distinction is the whole
 * security of the panel and it is easy to get wrong:
 *
 *   * An email check in the app is a check anybody can edit out of their own
 *     build, and the app is shipped as an APK. The role check cannot be edited
 *     out because the *database* does it: every admin function is SECURITY
 *     DEFINER and calls `is_admin()` itself before returning a row.
 *   * `auth.users.email` is also not something the client can trust to be
 *     verified; the role table is a deliberate grant.
 *
 * So this hook decides only whether to *draw* the panel. If it were wrong, the
 * panel would render and every call inside it would still come back empty.
 *
 * The one admin today is the account this repo's owner signs in with, granted
 * in `user_roles`. Adding another is a row, not a release.
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase.rpc('is_admin');
      setIsAdmin(!error && data === true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
    // Signing in or out has to re-answer this, or the panel stays as it was.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => sub.subscription.unsubscribe();
  }, [check]);

  return { isAdmin, loading };
}
