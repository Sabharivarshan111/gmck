// Structural boundary: the legacy and native-browser shells use separate SDK bundles.
interface PremiumQuery {
  eq(column: string, value: string): PremiumQuery;
  gt(column: string, value: string): PremiumQuery;
  order(column: string, options: { ascending: boolean }): PremiumQuery;
  limit(count: number): PremiumQuery;
  maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
}
export interface PremiumClient {
  auth: {
    getUser(): Promise<{ data: { user: { id: string; is_anonymous?: boolean } | null }; error: unknown }>;
    getSession(): Promise<{ data: { session: { user: { id: string } } | null } }>;
  };
  from(table: 'premium_subscriptions'): { select(columns: string): PremiumQuery };
}
/** Never trust browser-editable cached flags for website feature access. */
export async function readWebsitePremium(client: PremiumClient): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  const user = data.user;
  if (error || !user || user.is_anonymous) return null;
  const { data: row, error: queryError } = await client.from('premium_subscriptions')
    .select('expires_at').eq('user_id', user.id).eq('plan', 'adfree_monthly')
    .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1).maybeSingle();
  const current = (await client.auth.getSession()).data.session?.user.id;
  const expiry = (row as { expires_at?: unknown } | null)?.expires_at;
  if (queryError || current !== user.id || typeof expiry !== 'string' || !Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) <= Date.now()) return null;
  return expiry;
}
