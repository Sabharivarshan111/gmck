// Browser reminders run while Orbit is open. No fake background alarm permission.
let digest: Record<string, any> = {};
let timer: ReturnType<typeof setTimeout> | undefined;
let scheduled = false;
let scheduledHour = 19;
const supported = () => typeof Notification !== 'undefined';
const permitted = () => supported() && Notification.permission === 'granted';
async function post() {
  if (!permitted()) return 'blocked';
  const today = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  let body = '';
  if (digest.lastStudyDay === today) body = digest.allowAttendance ? 'Check your next clinical posting. One attended day at a time.' : '';
  else if (digest.allowExam !== false && digest.examDay > 0 && digest.examDay >= today && digest.examDay - today <= 7) body = 'Your exam is approaching. Make time for a short revision session.';
  else if (digest.allowStreak !== false && digest.streak >= 2) body = 'Keep your study streak going with a few questions today.';
  else if (digest.allowRevision !== false && digest.revisionDueCount > 0 && digest.revisionDueDay >= 0 && digest.revisionDueDay <= today) body = `${digest.revisionDueCount} questions are ready for revision.`;
  else if (digest.allowAttendance) body = 'Check your next clinical posting. One attended day at a time.';
  if (!body) return 'quiet';
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('ORBIT study reminder', { body, icon: '/icon-192.png', tag: 'orbit-daily' });
  return 'posted';
}
const notifications = {
  hasPermission: permitted,
  requestPermission: async () => supported() && (await Notification.requestPermission()) === 'granted',
  setSchedule(enabled: boolean, hour: number): void {
    scheduled = enabled; scheduledHour = hour;
    if (timer) clearTimeout(timer); timer = undefined;
    if (!enabled) return;
    const next = new Date(); next.setHours(hour, 0, 0, 0); if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    timer = setTimeout(() => {
      void post().finally(() => { if (scheduled) notifications.setSchedule(true, scheduledHour); });
    }, next.getTime() - Date.now());
  },
  updateDigest(json: string) { try { digest = JSON.parse(json); } catch { digest = {}; } },
  sendTest: post,
  cancelAll() { scheduled = false; if (timer) clearTimeout(timer); timer = undefined; },
};

export default notifications;
