
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/components/ui/use-toast';

export function useOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useLocalStorage<boolean>('offlineMode', false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState<boolean>('serviceWorker' in navigator);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState<boolean>(false);
  const [isCheckingServiceWorker, setIsCheckingServiceWorker] = useState<boolean>(false);
  const [initializationAttempts, setInitializationAttempts] = useState<number>(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to check service worker readiness
  const checkServiceWorkerReadiness = useCallback(async () => {
    if (!isServiceWorkerSupported) return false;
    
    setIsCheckingServiceWorker(true);
    
    try {
      // First check: Is there a controller?
      if (navigator.serviceWorker.controller) {
        console.log('[OfflineMode] Service worker is controlling the page');
        setIsServiceWorkerReady(true);
        setIsCheckingServiceWorker(false);
        return true;
      }
      
      // Second check: Is window.swControllerReady set to true?
      if ((window as any).swControllerReady) {
        console.log('[OfflineMode] swControllerReady is true');
        setIsServiceWorkerReady(true);
        setIsCheckingServiceWorker(false);
        return true;
      }
      
      console.log('[OfflineMode] Service worker is not controlling yet');
      
      // If we have a registration, try communicating directly with the worker
      if ((window as any).swRegistration?.active) {
        console.log('[OfflineMode] Found active service worker, checking if ready');
        
        // Create a message channel for communication
        const messageChannel = new MessageChannel();
        
        // Promise for awaiting the response
        const readinessPromise = new Promise<boolean>((resolve) => {
          // Setup the message handler
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.ready) {
              console.log('[OfflineMode] Service worker confirmed ready via message');
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          // Set a timeout in case the service worker doesn't respond
          setTimeout(() => {
            console.log('[OfflineMode] Service worker readiness check timed out');
            resolve(false);
          }, 1000);
        });
        
        // Send the ready check message
        try {
          (window as any).swRegistration.active.postMessage(
            { type: 'IS_READY' },
            [messageChannel.port2]
          );
          
          // Wait for response or timeout
          const isReady = await readinessPromise;
          setIsServiceWorkerReady(isReady);
          return isReady;
        } catch (error) {
          console.error('[OfflineMode] Error sending message to service worker:', error);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineMode] Error checking service worker readiness:', error);
      return false;
    } finally {
      setIsCheckingServiceWorker(false);
    }
  }, [isServiceWorkerSupported]);

  // Listen for service worker events
  useEffect(() => {
    if (!isServiceWorkerSupported || !(window as any).swEvents) return;
    
    const handleSwControlling = () => {
      console.log('[OfflineMode] Received sw-controlling event');
      setIsServiceWorkerReady(true);
    };
    
    const handleSwError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('[OfflineMode] Service worker error:', customEvent.detail?.error);
      setIsServiceWorkerReady(false);
    };
    
    const handleSwNotSupported = () => {
      console.log('[OfflineMode] Service worker not supported event received');
      setIsServiceWorkerSupported(false);
    };
    
    // Add event listeners
    (window as any).swEvents.addEventListener('sw-controlling', handleSwControlling);
    (window as any).swEvents.addEventListener('sw-activated', handleSwControlling);
    (window as any).swEvents.addEventListener('sw-error', handleSwError);
    (window as any).swEvents.addEventListener('sw-not-supported', handleSwNotSupported);
    
    // Initial check
    checkServiceWorkerReadiness();
    
    return () => {
      // Remove event listeners
      (window as any).swEvents.removeEventListener('sw-controlling', handleSwControlling);
      (window as any).swEvents.removeEventListener('sw-activated', handleSwControlling);
      (window as any).swEvents.removeEventListener('sw-error', handleSwError);
      (window as any).swEvents.removeEventListener('sw-not-supported', handleSwNotSupported);
    };
  }, [isServiceWorkerSupported, checkServiceWorkerReadiness]);

  // Regularly check service worker status
  useEffect(() => {
    if (!isServiceWorkerSupported || isServiceWorkerReady) return;

    // Check service worker readiness on initial load
    checkServiceWorkerReadiness();

    // Set up periodic checks for service worker status
    const intervalId = setInterval(() => {
      if (isServiceWorkerReady) {
        clearInterval(intervalId);
      } else {
        checkServiceWorkerReadiness();
        setInitializationAttempts(prev => prev + 1);
      }
    }, 1000); // Check every second
    
    // Stop checking after a reasonable number of attempts
    if (initializationAttempts > 15) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isServiceWorkerSupported, isServiceWorkerReady, checkServiceWorkerReadiness, initializationAttempts]);

  // Display a toast when connection status changes
  useEffect(() => {
    if (isOfflineMode) {
      if (!isOnline) {
        toast({
          title: "You're offline",
          description: "App is running in offline mode.",
          duration: 3000,
        });
      } else {
        toast({
          title: "You're online",
          description: "But still running in offline mode.",
          duration: 3000,
        });
      }
    }
  }, [isOnline, isOfflineMode]);

  // Wait for service worker to become ready with more robust checking
  const waitForServiceWorker = async (timeoutMs = 5000): Promise<boolean> => {
    if (isServiceWorkerReady) return true;
    if (!isServiceWorkerSupported) return false;
    
    setIsCheckingServiceWorker(true);
    console.log('[OfflineMode] Waiting for service worker to become ready');
    
    // Try to register the service worker again if needed
    if (!navigator.serviceWorker.controller && !(window as any).swRegistration) {
      try {
        console.log('[OfflineMode] Re-registering service worker');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        (window as any).swRegistration = registration;
        
        // Force it to activate immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (error) {
        console.error('[OfflineMode] Failed to register service worker during wait:', error);
      }
    }
    
    try {
      const startTime = Date.now();
      
      // Create a promise that resolves when the sw-controlling event fires
      const controlPromise = new Promise<boolean>(resolve => {
        const handleSwControlling = () => {
          console.log('[OfflineMode] Service worker took control during wait');
          (window as any).swEvents.removeEventListener('sw-controlling', handleSwControlling);
          resolve(true);
        };
        
        (window as any).swEvents.addEventListener('sw-controlling', handleSwControlling);
        
        // Cleanup after timeout
        setTimeout(() => {
          (window as any).swEvents.removeEventListener('sw-controlling', handleSwControlling);
          resolve(false);
        }, timeoutMs);
      });
      
      // Regularly check readiness while waiting for the event
      while (Date.now() - startTime < timeoutMs) {
        // Check if service worker is ready
        const isReady = await checkServiceWorkerReadiness();
        
        if (isReady) {
          setIsServiceWorkerReady(true);
          setIsCheckingServiceWorker(false);
          return true;
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Check if the control event was triggered
      const controlEventTriggered = await controlPromise;
      if (controlEventTriggered) {
        setIsServiceWorkerReady(true);
        return true;
      }
      
      // One final check before giving up
      const finalCheck = await checkServiceWorkerReadiness();
      setIsServiceWorkerReady(finalCheck);
      return finalCheck;
    } catch (error) {
      console.error('[OfflineMode] Error waiting for service worker:', error);
      return false;
    } finally {
      setIsCheckingServiceWorker(false);
    }
  };

  const enableOfflineMode = async () => {
    if (!isServiceWorkerSupported) {
      toast({
        title: "Offline mode not supported",
        description: "Your browser doesn't support service workers.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Wait for service worker to be ready if needed
    if (!isServiceWorkerReady) {
      toast({
        title: "Preparing offline mode",
        description: "Setting up service worker...",
        duration: 3000,
      });
      
      const ready = await waitForServiceWorker(10000); // Increase timeout to 10 seconds
      
      if (!ready) {
        // If service worker isn't ready but could be supported, show a different message
        if (isServiceWorkerSupported) {
          toast({
            title: "Service worker initialization issue",
            description: "Try refreshing the page before enabling offline mode.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: "Offline mode not supported",
            description: "Your browser doesn't support service workers.",
            variant: "destructive",
            duration: 5000,
          });
        }
        return;
      }
    }
    
    // Listen for cache complete event
    const cacheCompletePromise = new Promise<boolean>(resolve => {
      const handleCacheComplete = () => {
        console.log('[OfflineMode] Cache completed event received');
        (window as any).swEvents.removeEventListener('sw-cache-complete', handleCacheComplete);
        resolve(true);
      };
      
      (window as any).swEvents.addEventListener('sw-cache-complete', handleCacheComplete);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        (window as any).swEvents.removeEventListener('sw-cache-complete', handleCacheComplete);
        resolve(false);
      }, 10000);
    });
    
    try {
      setIsDownloading(true);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 95) { // Only go up to 95% with the simulation
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 200);

      // Cache data files if service worker controller is available
      if (navigator.serviceWorker.controller) {
        console.log('[OfflineMode] Sending cache request to service worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA_FILES'
        });
        
        // Wait for cache complete event or timeout
        await cacheCompletePromise;
      } else {
        console.warn('[OfflineMode] No service worker controller available to cache data files');
        // One more attempt to wait for controller
        await waitForServiceWorker(3000);
        
        if (navigator.serviceWorker.controller) {
          console.log('[OfflineMode] Controller now available, sending cache request');
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_DATA_FILES'
          });
          // Wait for cache completion
          await cacheCompletePromise;
        } else {
          console.error('[OfflineMode] Still no controller after waiting');
        }
      }

      // Mark download as complete
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      // Short delay before finalizing
      setTimeout(() => {
        setIsDownloading(false);
        setIsOfflineMode(true);
        
        toast({
          title: "Offline mode enabled",
          description: "App data has been cached for offline use.",
          duration: 3000,
        });
      }, 500);
    } catch (error) {
      console.error('[OfflineMode] Failed to enable offline mode:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      
      toast({
        title: "Failed to enable offline mode",
        description: "Please try again or refresh the page.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const disableOfflineMode = () => {
    setIsOfflineMode(false);
    toast({
      title: "Offline mode disabled",
      description: "App will now fetch the latest data from the server.",
      duration: 3000,
    });
  };

  const toggleOfflineMode = () => {
    if (isOfflineMode) {
      disableOfflineMode();
    } else {
      enableOfflineMode();
    }
  };

  // This helps manually reload service worker if needed
  const reloadServiceWorker = async () => {
    if (!isServiceWorkerSupported) return false;
    
    try {
      // Try to register the service worker again
      if ((window as any).swRegistration) {
        await (window as any).swRegistration.update();
      } else {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        (window as any).swRegistration = registration;
      }
      
      // Wait for it to become ready
      return await waitForServiceWorker(5000);
    } catch (error) {
      console.error('[OfflineMode] Failed to reload service worker:', error);
      return false;
    }
  };

  return {
    isOfflineMode,
    isOnline,
    isDownloading,
    downloadProgress,
    toggleOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
    isServiceWorkerSupported,
    isServiceWorkerReady,
    isCheckingServiceWorker,
    reloadServiceWorker
  };
}
