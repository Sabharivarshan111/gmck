import { createContext, useCallback, useContext, useRef, useState, type Dispatch, type SetStateAction } from 'react';

// Native and development renderers keep their existing access. The production
// website explicitly supplies authenticated membership through its route gate.
export const SimulatorAccessContext = createContext({ active: true, requestPurchase: (_feature: string) => {} });
export const useSimulatorAccess = () => useContext(SimulatorAccessContext);

/** Guard before setting or rendering restricted state, including deep links. */
export function useSampleState<T>(initial: T | (() => T), fallback: T, allowed: (value: T) => boolean, feature: string): [T, Dispatch<SetStateAction<T>>] {
  const access = useSimulatorAccess();
  const [stored, setStored] = useState(initial);
  const value = access.active || allowed(stored) ? stored : fallback;
  const latest = useRef({ access, allowed, feature, value });
  latest.current = { access, allowed, feature, value };
  const setValue: Dispatch<SetStateAction<T>> = useCallback(next => {
    const current = latest.current;
    const resolved = typeof next === 'function' ? (next as (previous: T) => T)(current.value) : next;
    if (!current.access.active && !current.allowed(resolved)) { current.access.requestPurchase(current.feature); return; }
    current.value = resolved;
    setStored(resolved);
  }, []);
  return [value, setValue];
}
export function SimulatorSampleBanner() {
  const access = useSimulatorAccess();
  if (access.active) return null;
  return <aside className="simulator-sample-banner" aria-label="Free simulator preview"><span><strong>Free preview</strong> · Heart, lungs & brain · normal heart and breath sounds</span><button onClick={() => access.requestPurchase('all simulator features')}>Unlock all →</button></aside>;
}
