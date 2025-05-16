
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
    swEvents: EventTarget;
  }
}

// Setup a custom event system for service worker events
window.swEvents = new EventTarget();

// Initialize service worker state
window.swRegistration = null;
window.swControllerReady = false;

// Function to check if service worker is controlling and dispatch event
const checkServiceWorkerControl = () => {
  const isControlling = !!navigator.serviceWorker.controller;
  window.swControllerReady = isControlling;
  
  if (isControlling) {
    console.log('[SW Main] Service worker is controlling the page now');
    const event = new CustomEvent('sw-controlling', { detail: { timestamp: Date.now() } });
    window.swEvents.dispatchEvent(event);
  }
  
  return isControlling;
};

// Enhanced service worker registration with retries
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('[SW Main] Registering service worker...');
      
      // Always unregister existing service worker first to ensure clean state
      if (navigator.serviceWorker.controller) {
        console.log('[SW Main] Existing controller found, will update if needed');
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('[SW Main] ServiceWorker registration successful with scope:', registration.scope);
      window.swRegistration = registration;
      
      // Setup message event listener
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW Main] Received message from service worker:', event.data);
        
        if (event.data?.type === 'SW_ACTIVATED' || event.data?.type === 'CONTROLLER_CHANGE') {
          window.swControllerReady = true;
          const swEvent = new CustomEvent('sw-controlling', { detail: event.data });
          window.swEvents.dispatchEvent(swEvent);
        }
        
        if (event.data?.type === 'CACHE_COMPLETE') {
          const cacheEvent = new CustomEvent('sw-cache-complete', { detail: event.data });
          window.swEvents.dispatchEvent(cacheEvent);
        }
      });
      
      // Check if service worker is already controlling
      if (checkServiceWorkerControl()) {
        console.log('[SW Main] Service worker is already controlling the page');
      } else {
        console.log('[SW Main] Waiting for service worker to take control...');
        
        // Force update if needed to get control
        if (registration.waiting) {
          console.log('[SW Main] Found waiting worker, activating...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[SW Main] Service worker is ready');
      
      // Check again for a controller
      if (checkServiceWorkerControl()) {
        console.log('[SW Main] Service worker controller confirmed after ready');
      } else {
        console.log('[SW Main] Still no controller after service worker ready');
        
        // Set up a regular ping to check service worker status
        const pingInterval = setInterval(() => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'PING' });
            window.swControllerReady = true;
            clearInterval(pingInterval);
          }
        }, 1000);
        
        // Clear the interval after 10 seconds to avoid memory leaks
        setTimeout(() => clearInterval(pingInterval), 10000);
      }
      
      // Watch for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[SW Main] Service worker state changed:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Main] New content is available; please refresh.');
            }
            
            if (newWorker.state === 'activated') {
              window.swControllerReady = true;
              console.log('[SW Main] Service worker is now activated and controlling the page');
              const event = new CustomEvent('sw-activated', { detail: { timestamp: Date.now() } });
              window.swEvents.dispatchEvent(event);
            }
          });
        }
      });
    } catch (error) {
      console.error('[SW Main] ServiceWorker registration failed:', error);
      const event = new CustomEvent('sw-error', { detail: { error } });
      window.swEvents.dispatchEvent(event);
    }
  });
  
  // Handle service worker update
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.swControllerReady = true;
    console.log('[SW Main] Service worker controller changed');
    
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
} else {
  console.log('[SW Main] Service workers are not supported');
  window.swControllerReady = false;
  const event = new CustomEvent('sw-not-supported');
  window.swEvents.dispatchEvent(event);
}
