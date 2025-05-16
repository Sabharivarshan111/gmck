
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Create a global variable to track service worker state
declare global {
  interface Window {
    swRegistration: ServiceWorkerRegistration | null;
    swControllerReady: boolean;
  }
}

// Initialize service worker state
window.swRegistration = null;
window.swControllerReady = false;

// Enhanced service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      window.swRegistration = registration;
      
      // Check if the service worker is already controlling
      if (navigator.serviceWorker.controller) {
        window.swControllerReady = true;
        console.log('Service worker is already controlling the page');
      }
      
      // Wait for the service worker to be controlling
      navigator.serviceWorker.ready.then(() => {
        console.log('Service worker is ready and available');
        
        // Check for a controller
        if (navigator.serviceWorker.controller) {
          window.swControllerReady = true;
        }
      });
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
            }
            
            if (newWorker.state === 'activated') {
              window.swControllerReady = true;
              console.log('Service worker is now controlling the page');
            }
          });
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
  
  // Handle service worker update
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.swControllerReady = true;
    console.log('Service worker controller changed');
    
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
} else {
  console.log('Service workers are not supported');
  window.swControllerReady = false;
}
