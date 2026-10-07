
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './simulator/mobile-touch-targets.css'
import { registerNativeAuthListener } from './lib/native-auth'

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        // Pull a newly deployed worker immediately instead of waiting for the
        // browser's periodic update check. The worker uses skipWaiting +
        // clients.claim, so the next navigation is guaranteed onto the new
        // simulator shell/cache generation.
        registration.update().catch(() => {});
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

// Handle OAuth deep-link return on native (Android APK)
registerNativeAuthListener();

createRoot(document.getElementById("root")!).render(<App />);
