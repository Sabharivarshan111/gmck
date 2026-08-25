/**
 * The preview harness has no NotificationManager and no TurboModuleRegistry.
 *
 * Reports **present**, like the sound shim and unlike the speech one. What the
 * flag gates decides it: this one gates a Settings section that needs
 * reviewing, and nothing here opens a UI that could hang.
 *
 * It starts denied and grants on request, which is the one browser-shaped
 * version of the real sequence — a switch turned on, a dialog, an Allow. The
 * previous shim refused permanently, and that is why the section it gates went
 * unreviewed: the per-kind switches only exist once permission is held, so
 * every state past the first one was unreachable from here. The path worth
 * checking is the one someone actually ends up in.
 */
let granted = false;

export default {
  hasPermission: () => granted,
  requestPermission: async () => {
    granted = true;
    return true;
  },
  setSchedule: () => {},
  updateDigest: () => {},
  cancelAll: () => {},
};
