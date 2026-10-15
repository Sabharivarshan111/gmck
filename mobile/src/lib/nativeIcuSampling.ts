import type { PhysiologyKernel } from '@simulator/engine/PhysiologyKernel';
import type { TelemetryWaveformSample } from '@simulator/types';

// Resolve narrow kernel R waves at 250Hz for the native pulse tone.
// The independent analytical display matches the canonical 4.8s canvas sweep.
// The old ~83Hz sampling could miss every R peak for some initial phases.
export const NATIVE_ICU_SAMPLE_STEP = 0.004;

export function advanceNativeTelemetry(
  patient: Pick<PhysiologyKernel, 'tick' | 'sampleWaveforms'>,
  duration: number,
): TelemetryWaveformSample[] {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const elapsed = Math.min(0.25, duration);
  const slices = Math.ceil(elapsed / NATIVE_ICU_SAMPLE_STEP);
  const samples: TelemetryWaveformSample[] = [];
  for (let index = 0; index < slices; index++) {
    patient.tick(elapsed / slices);
    samples.push(patient.sampleWaveforms());
  }
  return samples;
}
