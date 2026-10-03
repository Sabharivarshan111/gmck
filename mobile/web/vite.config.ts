import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = path.resolve(__dirname, '..');

// Production browser build of the actual Android components. Preview fixtures
// are never an entry point; browser-only platform operations resolve here.
export default defineConfig({
  root: __dirname,
  publicDir: false,
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    allowedHosts: true,
    fs: {
      strict: false,
      allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../..')],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    allowedHosts: true,
  },
  plugins: [
    {
      name: 'orbit-browser-platform',
      enforce: 'pre',
      resolveId(source, importer) {
        if (importer?.includes('/mobile/') && /(?:^|\/)googleAuth$/.test(source)) return path.resolve(__dirname, 'adapters/google-auth.ts');
        if (importer?.includes('/mobile/') && /(?:^|\/)adsMode$/.test(source)) return path.resolve(__dirname, 'adapters/ads-mode.ts');
      },
      transform(code, id) {
        if (id.endsWith('/mobile/App.tsx')) return code.replace('<NavigationContainer', `<NavigationContainer linking={{ prefixes: [], config: { screens: { Home: { screens: { HomeMain: '', BrowseHome: 'browse/:year?', BrowseNode: { path: 'browse/:year/:path', parse: { path: value => value.split(',') }, stringify: { path: value => value.join(',') } } } }, Notes: 'notes', Timer: 'timer', AskAI: 'ask-ai', Progress: 'progress' } } }}`);
        if (id.endsWith('/mobile/src/components/Text.tsx')) return "import { renderEmoji } from '" + path.resolve(__dirname, 'adapters/emoji.tsx') + "';\n" + code.replace('{...rest}', '{...rest} children={renderEmoji(rest.children)}');
        if (id.endsWith('/mobile/src/theme/typography.ts')) return code.replace("default: undefined", "default: 'Roboto Variable, Apple Color Emoji, Segoe UI Emoji, sans-serif'");
        if (id.endsWith('/mobile/src/lib/supabase.ts')) return code.replace('detectSessionInUrl: false', 'detectSessionInUrl: true');
        if (id.endsWith('/mobile/src/lib/importedDecks.ts')) return code.replace('`file://${mediaDir}/', '`${mediaDir}/');
        if (id.endsWith('/mobile/src/components/HomeMenuSheet.tsx')) return "import { Stethoscope } from 'lucide-react-native';\n" + code.replace('items: [', `items: [
          { key: 'simulator', icon: <Stethoscope size={18} color={colors.text} />, label: 'Patient simulator', hint: 'Clinical cases, anatomy and bedside practice', onPress: run(() => location.assign('/simulator')) },`);
        if (id.endsWith('/mobile/src/components/FirstRun.tsx')) return code
          .replace('useState(!isNative || !GOOGLE_SIGN_IN_ENABLED)', 'useState(!GOOGLE_SIGN_IN_ENABLED)')
          .replace('if (isNative && GOOGLE_SIGN_IN_ENABLED)', 'if (GOOGLE_SIGN_IN_ENABLED)')
          .replace('Google Sign-In Required', 'Sync with Google')
          .replace('To prevent spam attacks and safeguard your progress & rankings, please sign in with Google to continue.', 'Sign in to sync your progress and rankings, or set up your studies below to continue on this browser.')
          .replace('One-time authentication required to safeguard your profile against spam attacks.', 'Google sign-in is optional for local study. Sign in to sync across devices.')
          .replace('One-time authentication verified. Works completely offline.', 'Signed in. Cached question banks are available offline.');
        if (id.endsWith('/mobile/src/components/SettingsSheet.tsx')) return code.replace('At most one a day at the hour you choose.', 'Browser reminders run while Orbit is open, at the hour you choose.').replace('Android is blocking notifications for Orbit. Turn them on in system settings.', 'Your browser is blocking notifications for Orbit. Enable them in site settings.');
      },
    },
    react(),
  ],
  define: {
    global: 'window',
    __DEV__: 'false',
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: [
      { find: 'fflate', replacement: path.resolve(root, '../node_modules/fflate/esm/browser.js') },
      { find: 'fzstd', replacement: path.resolve(root, '../node_modules/fzstd/esm/index.mjs') },
      { find: 'sql.js', replacement: path.resolve(root, '../node_modules/sql.js/dist/sql-wasm-browser.js') },
      { find: '@data', replacement: path.resolve(root, '..', 'src', 'data') },
      { find: '@shared', replacement: path.resolve(root, '..', 'src', 'lib') },
      // Before the bare '@' alias below, which matches by prefix.
      {
        find: '@/native/NativeOrbitSound',
        replacement: path.resolve(__dirname, 'adapters', 'sound.ts'),
      },
      {
        find: '@/native/NativeOrbitSpeech',
        replacement: path.resolve(__dirname, 'adapters', 'speech.ts'),
      },
      {
        find: '@/native/NativeOrbitNotify',
        replacement: path.resolve(__dirname, 'adapters', 'notifications.ts'),
      },
      {
        find: '@/native/NativeOrbitScreen',
        replacement: path.resolve(__dirname, 'adapters', 'screen.ts'),
      },
      {
        find: '@/native/NativeOrbitFiles',
        replacement: path.resolve(__dirname, 'adapters', 'files.ts'),
      },
      {
        find: '@/native/NativeOrbitUpdate',
        replacement: path.resolve(__dirname, 'adapters', 'unavailable.ts'),
      },
      {
        find: 'react-native-webview',
        replacement: path.resolve(__dirname, 'adapters', 'webview.tsx'),
      },
      {
        find: '@/native/NativeOrbitBilling',
        replacement: path.resolve(__dirname, 'adapters', 'unavailable.ts'),
      },
      {
        find: '@/native/NativeOrbitApkg',
        replacement: path.resolve(__dirname, 'adapters', 'apkg.ts'),
      },
      {
        find: '@/native/OrbitGlass',
        replacement: path.resolve(__dirname, '../preview/shims', 'orbit-glass.tsx'),
      },
      {
        find: '@/native/NativeOrbitSecureStorage',
        replacement: path.resolve(__dirname, 'adapters', 'unavailable.ts'),
      },
      { find: '@', replacement: path.resolve(root, 'src') },
      // lucide-react-native needs react-native-svg; the DOM build is equivalent
      // and exports the same icon names.
      { find: 'lucide-react-native', replacement: 'lucide-react' },
      {
        find: '@react-native-async-storage/async-storage',
        replacement: path.resolve(__dirname, 'adapters', 'storage.ts'),
      },
      {
        find: '@react-native-clipboard/clipboard',
        replacement: path.resolve(__dirname, '../preview/shims', 'clipboard.ts'),
      },
      {
        find: '@react-native/assets-registry/registry',
        replacement: path.resolve(__dirname, '../preview/shims', 'assets-registry.ts'),
      },
      {
        find: '@react-native-google-signin/google-signin',
        replacement: path.resolve(__dirname, '../preview/shims', 'google-signin.ts'),
      },
      {
        find: 'react-native-image-picker',
        replacement: path.resolve(__dirname, 'adapters', 'image-picker.ts'),
      },
      {
        find: 'react-native-image-colors',
        replacement: path.resolve(__dirname, 'adapters', 'image-colors.ts'),
      },
      {
        find: 'react-native-video',
        replacement: path.resolve(__dirname, 'adapters', 'video.tsx'),
      },
      {
        find: 'react-native-google-mobile-ads',
        replacement: path.resolve(__dirname, '../preview/shims', 'google-mobile-ads.ts'),
      },
      { find: 'react-native', replacement: 'react-native-web' },
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist-native'),
    emptyOutDir: true,
  },
});
