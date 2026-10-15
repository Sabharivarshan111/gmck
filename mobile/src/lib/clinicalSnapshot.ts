import { PhysiologyKernel, SCENARIOS } from '@simulator/engine/PhysiologyKernel';

/** Preserve numeric phases and treatment targets as well as visible vital signs. */
export function restoreClinicalSnapshot(kernel: PhysiologyKernel, serialized: string): boolean {
  try {
    const snapshot = JSON.parse(serialized);
    const scenario = SCENARIOS.find(item => item.id === snapshot.currentScenario?.id);
    const current = JSON.parse(JSON.stringify(kernel));
    if (!scenario || !snapshot.vitals || !snapshot.pathology || !Array.isArray(snapshot.logs)) return false;
    for (const key of Object.keys(current)) {
      if (typeof current[key] === 'number' && !Number.isFinite(snapshot[key])) return false;
    }
    for (const key of Object.keys(kernel.vitals)) if (!Number.isFinite(snapshot.vitals[key])) return false;
    for (const key of Object.keys(kernel.pathology)) {
      if (typeof kernel.pathology[key as keyof typeof kernel.pathology] === 'number' && !Number.isFinite(snapshot.pathology[key])) return false;
    }
    // Assign only the known kernel fields; source definitions remain canonical.
    for (const key of Object.keys(current)) current[key] = snapshot[key];
    current.currentScenario = scenario;
    Object.assign(kernel, current);
    return true;
  } catch { return false; }
}
