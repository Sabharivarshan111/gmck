import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'node:path';

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [{
    name: 'native-patient-continuity',
    enforce: 'pre',
    transform(source, id) {
      if (!id.endsWith('/src/pages/Simulator.tsx')) return;
      const needle = '  const kernel = kernelRef.current;';
      if (!source.includes(needle)) throw Error('Canonical kernel initialization changed; review the native patient bridge');
      return source.replace(needle, needle + `
  if (!window.__orbitPatientHydrated) {
    const snapshot = document.getElementById('orbit-native-patient')?.textContent;
    if (snapshot) {
      try { Object.assign(kernel, JSON.parse(snapshot)); } catch { /* No initial patient. */ }
    }
    window.__orbitPatientHydrated = true;
  }
  window.__orbitPatientKernel = kernel;
`);
    },
  }, react()],
  resolve: { alias: { '@': resolve(__dirname, '../../src') } },
  css: { postcss: resolve(__dirname, '../..') },
  build: { outDir: '../android/app/build/generated/simulatorAssets/simulator', emptyOutDir: true },
});
