import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type Listener = (row: ProfileRow) => void;
type Client = Pick<SupabaseClient<Database>, 'channel' | 'removeChannel'>;

/** One subscription per account, shared by concurrently mounted profile hooks. */
export function createProfileSubscriptionHub(client: Client) {
  const entries = new Map<string, { channel: RealtimeChannel; listeners: Set<Listener> }>();
  let generation = 0;

  return (userId: string, listener: Listener) => {
    let entry = entries.get(userId);
    if (!entry) {
      // A StrictMode remount can start before asynchronous channel removal ends.
      const channel = client.channel(`own-profile:${userId}:${++generation}`);
      entry = { channel, listeners: new Set() };
      entries.set(userId, entry);
      const subscribers = entry.listeners;
      channel.on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`,
      }, payload => {
        for (const subscriber of [...subscribers]) {
          if (subscribers.has(subscriber)) subscriber(payload.new as ProfileRow);
        }
      });
      entry.listeners.add(listener);
      channel.subscribe();
    } else {
      entry.listeners.add(listener);
    }

    const ownedEntry = entry;
    let detached = false;
    return () => {
      if (detached) return;
      detached = true;
      ownedEntry.listeners.delete(listener);
      if (!ownedEntry.listeners.size && entries.get(userId) === ownedEntry) {
        entries.delete(userId);
        void client.removeChannel(ownedEntry.channel);
      }
    };
  };
}
