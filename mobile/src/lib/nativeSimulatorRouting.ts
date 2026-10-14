/** Deep links into the existing live Vercel renderer while inner native modules are being ported. */
export type NativeClinicalDestination =
  | { kind: 'anatomy' | 'monitor' }
  | { kind: 'tool'; id: string; scenario: string }
  | { kind: 'case'; id: string };

const BASE = 'https://orbitmbbs.vercel.app/simulator';
export function nativeClinicalRoute(destination: NativeClinicalDestination): string {
  const params = new URLSearchParams({ orbit_native_build: '27' });
  switch (destination.kind) {
    case 'anatomy': params.set('mode', 'anatomy'); break;
    case 'monitor': params.set('mode', 'telemetry'); break;
    case 'tool':
      params.set('tool', destination.id);
      params.set('scenario', destination.scenario);
      break;
    case 'case':
      params.set('mode', 'case');
      params.set('scenario', destination.id);
      break;
  }
  return `${BASE}?${params.toString()}`;
}
