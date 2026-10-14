import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'node:path';

export default defineConfig({
  root: __dirname,
  publicDir: false,
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, '../../src') } },
  css: { postcss: resolve(__dirname, '../..') },
  build: { outDir: '../android/app/build/generated/simulatorAssets/simulator', emptyOutDir: true },
});
