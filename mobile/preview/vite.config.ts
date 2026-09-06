import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = path.resolve(__dirname, '..');

// Preview-only bundling. The Android app is built by Metro (../metro.config.js);
// this config exists solely to render the same screens in a browser.
export default defineConfig({
  root: __dirname,
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
  plugins: [react()],
  define: {
    global: 'window',
    __DEV__: 'true',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: [
      { find: '@data', replacement: path.resolve(root, '..', 'src', 'data') },
      { find: '@shared', replacement: path.resolve(root, '..', 'src', 'lib') },
      // Before the bare '@' alias below, which matches by prefix.
      {
        find: '@/native/NativeOrbitSound',
        replacement: path.resolve(__dirname, 'shims', 'orbit-sound.ts'),
      },
      {
        find: '@/native/NativeOrbitSpeech',
        replacement: path.resolve(__dirname, 'shims', 'orbit-speech.ts'),
      },
      {
        find: '@/native/NativeOrbitNotify',
        replacement: path.resolve(__dirname, 'shims', 'orbit-notify.ts'),
      },
      {
        find: '@/native/NativeOrbitScreen',
        replacement: path.resolve(__dirname, 'shims', 'orbit-screen.ts'),
      },
      {
        find: '@/native/NativeOrbitFiles',
        replacement: path.resolve(__dirname, 'shims', 'orbit-files.ts'),
      },
      {
        find: '@/native/NativeOrbitUpdate',
        replacement: path.resolve(__dirname, 'shims', 'orbit-update.ts'),
      },
      {
        find: '@/native/NativeOrbitBilling',
        replacement: path.resolve(__dirname, 'shims', 'orbit-billing.ts'),
      },
      {
        find: '@/native/NativeOrbitApkg',
        replacement: path.resolve(__dirname, 'shims', 'orbit-apkg.ts'),
      },
      {
        find: '@/native/OrbitGlass',
        replacement: path.resolve(__dirname, 'shims', 'orbit-glass.tsx'),
      },
      { find: '@', replacement: path.resolve(root, 'src') },
      // lucide-react-native needs react-native-svg; the DOM build is equivalent
      // and exports the same icon names.
      { find: 'lucide-react-native', replacement: 'lucide-react' },
      {
        find: '@react-native-async-storage/async-storage',
        replacement: path.resolve(__dirname, 'shims', 'async-storage.ts'),
      },
      {
        find: '@react-native/assets-registry/registry',
        replacement: path.resolve(__dirname, 'shims', 'assets-registry.ts'),
      },
      {
        find: '@react-native-google-signin/google-signin',
        replacement: path.resolve(__dirname, 'shims', 'google-signin.ts'),
      },
      {
        find: 'react-native-image-picker',
        replacement: path.resolve(__dirname, 'shims', 'image-picker.ts'),
      },
      {
        find: 'react-native-image-colors',
        replacement: path.resolve(__dirname, 'shims', 'image-colors.ts'),
      },
      {
        find: 'react-native-video',
        replacement: path.resolve(__dirname, 'shims', 'video.tsx'),
      },
      {
        find: 'react-native-razorpay',
        replacement: path.resolve(__dirname, 'shims', 'razorpay.ts'),
      },
      {
        find: 'react-native-google-mobile-ads',
        replacement: path.resolve(__dirname, 'shims', 'google-mobile-ads.ts'),
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
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
