import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Simulator } from '../../src/pages/Simulator';
import '../../src/index.css';

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
setInterval(() => {
  const renderer = document.querySelector('[data-testid="anatomy-renderer"]');
  const canvas = renderer?.querySelector('canvas');
  const systems = renderer?.getAttribute('data-visible-atlas-systems');
  const geometry = JSON.stringify({ route: location.search, viewport: [window.innerWidth, window.innerHeight], systems, canvas: canvas ? [canvas.width, canvas.height] : null, loading: /LOADING BODYPARTS3D/.test(renderer?.textContent || ''), graphicsError: !!renderer?.querySelector('[role="alert"]'), resources: performance.getEntriesByType('resource').filter(entry => entry.name.includes('/models/')).length });
  if (geometry !== lastGeometry && systems && canvas) {
    console.info('ORBIT_NATIVE_GEOMETRY:' + geometry);
    lastGeometry = geometry;
  }
}, 1000);
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><Routes><Route path="*" element={<Simulator />} /></Routes></BrowserRouter>,
);
