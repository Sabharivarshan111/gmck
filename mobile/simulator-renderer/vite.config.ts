import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import type { AtRule } from 'postcss';
import { resolve } from 'node:path';

const closeTeaching = (kind: string) => `
  if (new URLSearchParams(location.search).get('native_teaching') === '${kind}') {
    if (window.__orbitPatientKernel) console.info('ORBIT_NATIVE_PATIENT:' + JSON.stringify({...window.__orbitPatientKernel,nativeTheme:localStorage.getItem('orbit-simulator-theme')}));
    console.info('ORBIT_NATIVE_TEACHING_CLOSED:');
  }
`;

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [{
    name: 'native-patient-continuity',
    enforce: 'pre',
    transform(source, id) {
      if (id.endsWith('/src/simulator/instruments/IcuMonitor.tsx')) {
        const initial = 'const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);';
        const close = 'onClose={() => setIsTutorialOpen(false)}';
        if (!source.includes(initial) || !source.includes(close)) throw Error('Canonical ICU tutorial entry changed; review native presentation');
        return source.replace(initial, "const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(new URLSearchParams(location.search).get('native_teaching') === 'icu');")
          .replace(close, `onClose={() => { setIsTutorialOpen(false); ${closeTeaching('icu')} }}`);
      }
      if (!id.endsWith('/src/pages/Simulator.tsx')) return;
      const needle = '  const kernel = kernelRef.current;';
      if (!source.includes(needle)) throw Error('Canonical kernel initialization changed; review the native patient bridge');
      const anatomyImport = "import { AnatomicalBody3D, resolvePartToOrganKey } from '../simulator/view/AnatomicalBody3D';";
      if (!source.includes(anatomyImport)) throw Error('Canonical anatomy import changed; review teaching-only presentation');
      // A teaching-only modal has no atlas viewport. Keep its patient clock and
      // canonical lesson UI without allocating an invisible full-body GPU scene.
      const viewportSource = source
        .replaceAll("'max(360px, calc(100dvh - 180px))'", "'max(360px, calc(var(--orbit-native-vh, 1vh) * 100 - 180px))'")
        .replaceAll("'max(360px, calc(100dvh - 208px))'", "'max(360px, calc(var(--orbit-native-vh, 1vh) * 100 - 208px))'")
        .replaceAll("'max(500px, min(72dvh, 620px))'", "'max(500px, min(calc(var(--orbit-native-vh, 1vh) * 72), 620px))'");
      const teachingOnly = viewportSource.replace(anatomyImport,
        "import { AnatomicalBody3D as CanonicalAnatomicalBody3D, resolvePartToOrganKey } from '../simulator/view/AnatomicalBody3D';\nconst AnatomicalBody3D = ['icu','ecg'].includes(new URLSearchParams(location.search).get('native_teaching') || '') ? () => null : CanonicalAnatomicalBody3D;");
      const hydrated = teachingOnly.replace(needle, needle + `
  if (!window.__orbitPatientHydrated) {
    const snapshot = document.getElementById('orbit-native-patient')?.textContent;
    if (snapshot) {
      try { Object.assign(kernel, JSON.parse(snapshot)); } catch { /* No initial patient. */ }
    }
    window.__orbitPatientHydrated = true;
  }
  window.__orbitPatientKernel = kernel;
`);
      const close = "onClose={() => setActiveTool('none')}";
      if (!hydrated.includes(close)) throw Error('Canonical diagnostic close changed; review native presentation');
      return hydrated.replaceAll(close, `onClose={() => { setActiveTool('none'); ${closeTeaching('ecg')} }}`);
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
  css: { postcss: { plugins: [
    tailwindcss({ config: resolve(__dirname, '../../tailwind.config.ts') }),
    autoprefixer(),
    {
      postcssPlugin: 'native-webview-viewport-lengths',
      AtRule(rule: AtRule) {
        // This canonical short-window exception makes the drawer full screen.
        // Gate it with the same measured viewport as dvh lengths so a stale
        // WebView media height cannot turn a portrait drawer into a full page.
        if (rule.name !== 'media' || !/^\(max-width:\s*1023px\)\s*and\s*\(max-height:\s*500px\)$/.test(rule.params)) return;
        rule.params = '(max-width: 1023px)';
        rule.walkRules(child => {
          child.selectors = child.selectors.map(selector => 'html[data-orbit-native-short-viewport="true"] ' + selector);
        });
      },
      Declaration(declaration: { value: string }) {
        // Android WebViews can collapse dvh-sized panels despite a valid
        // innerHeight. Transform values only: Tailwind selectors
        // must retain their canonical class names.
        declaration.value = declaration.value.replace(/(-?(?:\d+\.?\d*|\.\d+))dvh\b/g,
          (_, amount) => `calc(var(--orbit-native-vh, 1vh) * ${amount})`);
      },
    },
  ] } },
  build: { outDir: '../android/app/build/generated/simulatorAssets/simulator', emptyOutDir: true },
});
