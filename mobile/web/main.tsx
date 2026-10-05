import '@fontsource-variable/roboto';
import './platform';
import { InstallApp } from './install';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { hydrateFiles } from './adapters/files';
import { completeBrowserAuth } from './adapters/google-auth';

async function boot() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js'); } catch { /* online app remains usable */ }
  }
  await hydrateFiles();
  await completeBrowserAuth().catch(() => {});
  createRoot(document.getElementById('root')!).render(<><InstallApp /><App /></>);
}
boot().catch(error => {
  const root = document.getElementById('root')!;
  root.textContent = `Orbit could not open browser storage. Enable site storage and reload. ${error.message}`;
});
