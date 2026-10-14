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
    generateBundle() {
      const duplicate = [...this.getModuleIds()].find(id => /\/mobile\/node_modules\/react(?:-dom)?\//.test(id));
      if (duplicate) throw Error('Local renderer resolved the native app React copy: ' + duplicate);
    },
  }, react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      // mobile/ uses React 19, while the canonical renderer uses React 18.
      // One DOM renderer must share one dispatcher with every source hook.
      react: resolve(__dirname, '../../node_modules/react'),
      'react-dom': resolve(__dirname, '../../node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  css: { postcss: resolve(__dirname, '../..') },
  build: { outDir: '../android/app/build/generated/simulatorAssets/simulator', emptyOutDir: true },
});
