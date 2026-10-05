import { supabase } from '../../src/lib/supabase';

// Server delivery survives closing Safari. Page timers cannot provide background alerts.
let digest: Record<string, unknown> = {};
let enabled = false;
let hour = 19;
let active = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let syncChain = Promise.resolve();
let subscription: PushSubscription | null = null;
const supported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
const iphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

async function api(action: string, extra: Record<string, unknown> = {}) {
  if (action !== 'config') {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (action === 'unsubscribe') return { ok: true };
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw new Error('Could not set up reminders. Try again when online.');
    }
  }
  const { data, error } = await supabase.functions.invoke('web-push', { body: { action, ...extra } });
  if (error || !data?.ok) {
    const failure = new Error('Could not save background reminders. Check your connection and try again.');
    Object.assign(failure, { status: error?.context?.status });
    throw failure;
  }
  return data;
}
async function registration() {
  await navigator.serviceWorker.register('/sw.js');
  return Promise.race([navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Reload ORBIT to finish setting up notifications.')), 15000))]);
}
async function ensureSubscription() {
  const worker = await registration();
  subscription = await worker.pushManager.getSubscription();
  const config = await api('config');
  if (!subscription) {
    const raw = atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/'));
    const key = Uint8Array.from(raw, (letter: string) => letter.charCodeAt(0));
    subscription = await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  }
  const save = () => api('subscribe', { subscription: subscription!.toJSON(), hour, timezone: timezone(), digest, enabled: true });
  try { await save(); } catch (error) {
    if ((error as { status?: number }).status !== 403) throw error;
    // Signing in after anonymous study creates a different owner: replace this device's endpoint.
    await subscription.unsubscribe();
    const raw = atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/'));
    subscription = await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, letter => letter.charCodeAt(0)) });
    await save();
  }
  active = true;
  window.dispatchEvent(new Event('orbit-push-status'));
}
function enqueueSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncChain = syncChain.catch(() => {}).then(async () => {
      if (!enabled || Notification.permission !== 'granted') return;
      if (!subscription || !active) await ensureSubscription();
      else await api('update', { endpoint: subscription.endpoint, hour, timezone: timezone(), digest, enabled });
    }).catch(() => {
      active = false;
      window.dispatchEvent(new CustomEvent('orbit-push-error', { detail: 'Background reminder setup could not be saved. Re-enable Daily reminder when online.' }));
    });
  }, 500);
}
const notifications = {
  hasPermission: () => supported() && Notification.permission === 'granted' && active,
  async requestPermission() {
    if (iphone() && !standalone()) {
      window.dispatchEvent(new CustomEvent('orbit-push-error', { detail: 'On iPhone, add ORBIT to your Home Screen, open it there, then enable Daily reminder.' }));
      return false;
    }
    if (!supported()) return false;
    // Keep the permission prompt in the user's click gesture, before network awaits.
    if (Notification.permission !== 'granted' && await Notification.requestPermission() !== 'granted') return false;
    try { await ensureSubscription(); return true; }
    catch { active = false; return false; }
  },
  setSchedule(next: boolean, nextHour: number) {
    enabled = next; hour = Math.max(6, Math.min(23, Math.round(nextHour)));
    if (next && supported() && Notification.permission === 'granted') enqueueSync();
    if (!next) void notifications.cancelAll();
  },
  updateDigest(json: string) {
    try { digest = JSON.parse(json); } catch { digest = {}; }
    if (enabled && supported() && Notification.permission === 'granted') enqueueSync();
  },
  async sendTest() {
    if (!supported() || Notification.permission !== 'granted') return 'blocked';
    try {
      if (syncTimer) clearTimeout(syncTimer);
      await syncChain.catch(() => {});
      await ensureSubscription();
      const result = await api('test', { endpoint: subscription!.endpoint, digest });
      return result.sent ? 'posted' : 'blocked';
    } catch { return 'blocked'; }
  },
  async cancelAll() {
    enabled = false;
    if (syncTimer) clearTimeout(syncTimer);
    await syncChain.catch(() => {});
    try {
      subscription = subscription || (supported() ? await (await registration()).pushManager.getSubscription() : null);
      if (subscription) {
        const endpoint = subscription.endpoint;
        // Unsubscribe locally even offline; the provider then rejects old sends.
        await subscription.unsubscribe();
        await api('unsubscribe', { endpoint });
      }
    } catch { /* revoked/offline subscriptions cannot deliver */ }
    subscription = null; active = false;
    window.dispatchEvent(new Event('orbit-push-status'));
  },
};
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') setTimeout(() => void notifications.cancelAll(), 0); else if (event === 'SIGNED_IN' && enabled) enqueueSync(); });
  window.addEventListener('online', () => { if (enabled) enqueueSync(); });
}
export default notifications;
