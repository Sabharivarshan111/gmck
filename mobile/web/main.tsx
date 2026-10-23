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
  await hydrateFiles().catch(() => { /* Small study records can use localStorage if IndexedDB is unavailable. File imports still report their storage error. */ });
  await completeBrowserAuth().catch(() => {});
  const root = createRoot(document.getElementById('root')!);
  try {
    if (sessionStorage.getItem('orbit:checkout-return') === '1' && location.pathname === '/') {
      sessionStorage.removeItem('orbit:checkout-return');
      history.replaceState(null, '', '/unlock');
    }
  } catch { /* Checkout can still open directly when session storage is disabled. */ }
  if (location.pathname.replace(/\/$/, '') === '/unlock') {
    const { default: CheckoutPage } = await import('./checkout/CheckoutPage');
    root.render(<CheckoutPage />);
  } else {
    root.render(<><InstallApp /><App /></>);
  }
}
boot().catch(error => {
  const root = document.getElementById('root')!;
  root.textContent = `Orbit could not open browser storage. Enable site storage and reload. ${error.message}`;
});
