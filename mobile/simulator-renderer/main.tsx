import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Simulator } from '../../src/pages/Simulator';
import { ThemeProvider } from '../../src/components/theme/ThemeProvider';
import '../../src/index.css';
import '../../src/simulator/mobile-touch-targets.css';

class RendererBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('ORBIT_NATIVE_RENDER_ERROR:' + error.message); }
  render() {
    return this.state.failed ? <main role="alert" style={{ padding: 24, background: '#0e0e11', color: '#f5f5f7', minHeight: '100vh' }}>
      <h1>The teaching renderer could not open</h1><p>Reload the module to retry.</p><button onClick={() => location.reload()}>Reload</button>
    </main> : this.props.children;
  }
}
window.addEventListener('error', event => console.error('ORBIT_NATIVE_RENDER_ERROR:' + event.message));
window.addEventListener('unhandledrejection', event => console.error('ORBIT_NATIVE_RENDER_ERROR:' + String(event.reason)));

// The canonical teaching renderer runs locally. The Android host owns navigation
// and delivers the exact, checksum-pinned source geometry from its persistent cache.
const theme = new URLSearchParams(location.search).get('nativeTheme');
if (theme === 'dark' || theme === 'light') localStorage.setItem('orbit-simulator-theme', theme);
let hostActive = true;
Object.defineProperty(document, 'hidden', { get: () => !hostActive });
Object.defineProperty(document, 'visibilityState', { get: () => hostActive ? 'visible' : 'hidden' });
window.addEventListener('orbit-native-active', event => {
  hostActive = (event as CustomEvent<boolean>).detail;
  document.dispatchEvent(new Event('visibilitychange'));
});
// Device QA reads real renderer state, never a success based on a timeout.
let lastGeometry = '';
let pendingModels = 0;
let modelError = false;
const sourceFetch = window.fetch.bind(window);
const audit = new URLSearchParams(location.search).get('native_audit') === '1';
if (audit) window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes('/models/')) return sourceFetch(input, init);
  pendingModels++;
  try {
    const response = await sourceFetch(input, init);
    if (!response.ok) modelError = true;
    response.clone().arrayBuffer().catch(() => { modelError = true; }).finally(() => { pendingModels--; });
    return response;
  } catch (error) { pendingModels--; modelError = true; throw error; }
};
setInterval(() => {
  const patient = (window as unknown as { __orbitPatientKernel?: object }).__orbitPatientKernel;
  if (patient) console.info('ORBIT_NATIVE_PATIENT:' + JSON.stringify({ ...patient, nativeTheme: localStorage.getItem('orbit-simulator-theme') }));
  if (!audit) return;
  const renderer = document.querySelector('[data-testid="anatomy-renderer"]');
  const canvas = renderer?.querySelector('canvas');
  const systems = renderer?.getAttribute('data-visible-atlas-systems');
  const geometry = JSON.stringify({ route: location.search, viewport: [window.innerWidth, window.innerHeight], systems, section: document.querySelector('[aria-label="Anatomy detail sections"] [aria-selected="true"]')?.textContent?.trim() || null, canvas: canvas ? [canvas.width, canvas.height] : null, loading: /LOADING BODYPARTS3D/.test(renderer?.textContent || '') || pendingModels > 0, graphicsError: !!renderer?.querySelector('[role="alert"]') || modelError || /failed to load|could not be loaded/.test(renderer?.textContent || ''), resources: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/models/')).length });
  if (geometry !== lastGeometry && systems !== null && canvas) {
    console.info('ORBIT_NATIVE_GEOMETRY:' + geometry);
    lastGeometry = geometry;
  }
}, 1000);
createRoot(document.getElementById('root')!).render(
  <RendererBoundary><ThemeProvider><BrowserRouter><Routes><Route path="*" element={<Simulator />} /></Routes></BrowserRouter></ThemeProvider></RendererBoundary>,
);
