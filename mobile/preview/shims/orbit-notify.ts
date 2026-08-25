/**
 * The preview harness has no NotificationManager and no TurboModuleRegistry.
 *
 * Reports **present**, like the sound shim and unlike the speech one. What the
 * flag gates decides it: this one gates a Settings section that needs
 * reviewing, and nothing here opens a UI that could hang — every method is a
 * no-op, and `hasPermission` says no, which is the honest state of a browser
 * and also the state worth looking at, since it is the one that shows the
 * "allow notifications" path.
 */
export default {
  hasPermission: () => false,
  requestPermission: async () => false,
  setSchedule: () => {},
  updateDigest: () => {},
  cancelAll: () => {},
};
