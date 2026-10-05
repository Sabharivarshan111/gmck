/** Pause animation work in background tabs and discard the hidden time gap. */
export function startVisibleFrameLoop(frame: (time: number, dt: number) => void): () => void {
  let request = 0;
  let previous: number | null = null;
  let stopped = false;
  const tick = (time: number) => {
    request = 0;
    if (stopped || document.hidden) return;
    const dt = previous === null ? 0 : Math.min(0.05, Math.max(0, (time - previous) / 1000));
    previous = time;
    frame(time, dt);
    request = requestAnimationFrame(tick);
  };
  const visibility = () => {
    cancelAnimationFrame(request);
    request = 0;
    previous = null;
    if (!stopped && !document.hidden) request = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', visibility);
  visibility();
  return () => {
    stopped = true;
    cancelAnimationFrame(request);
    document.removeEventListener('visibilitychange', visibility);
  };
}
