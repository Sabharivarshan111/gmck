export default { async setLandscape(enabled: boolean) {
  const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
  try { if (enabled) await orientation.lock?.('landscape'); else orientation.unlock(); } catch { /* browser decides */ }
} };
