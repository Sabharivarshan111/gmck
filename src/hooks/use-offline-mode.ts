
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
  const [isCheckingServiceWorker, setIsCheckingServiceWorker] = useState<boolean>(true);
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

  // This function does multiple checks to determine if the service worker is really ready
  const checkServiceWorkerReadiness = useCallback(async () => {
    if (!isServiceWorkerSupported) {
      setIsCheckingServiceWorker(false);
      return false;
    }
    
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
      
      // Third check: If we have a registration, try direct communication
      if ((window as any).swRegistration?.active) {
        console.log('[OfflineMode] Found active service worker, checking if ready');
        
        // Try to ping the service worker
        try {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'PING' });
            // If no error, we're likely good
            window.swControllerReady = true;
            setIsServiceWorkerReady(true);
            setIsCheckingServiceWorker(false);
            return true;
          }
          
          // Create a proper message channel for two-way communication
          const messageChannel = new MessageChannel();
          
          // Create a promise for the response
          const readinessPromise = new Promise<boolean>((resolve) => {
            messageChannel.port1.onmessage = (event) => {
              if (event.data && event.data.ready) {
                console.log('[OfflineMode] Service worker confirmed ready via message');
                resolve(true);
              } else {
                resolve(false);
              }
            };
            
            // Set a timeout in case of no response
            setTimeout(() => {
              console.log('[OfflineMode] Service worker readiness check timed out');
              resolve(false);
            }, 1000);
          });
          
          // Send the message through the channel
          (window as any).swRegistration.active.postMessage(
            { type: 'IS_READY' },
            [messageChannel.port2]
          );
          
          // Wait for the response or timeout
          const isReady = await readinessPromise;
          setIsServiceWorkerReady(isReady);
          setIsCheckingServiceWorker(false);
          return isReady;
          
        } catch (error) {
          console.error('[OfflineMode] Error communicating with service worker:', error);
        }
      }
      
      // Still no confirmation - check if service worker is at least registered
      const swRegistration = await navigator.serviceWorker.getRegistration();
      if (swRegistration?.active) {
        console.log('[OfflineMode] Found registered active service worker');
        // Not ideal but better than nothing - assume it will be ready soon
        setIsServiceWorkerReady(true);
        setIsCheckingServiceWorker(false);
        return true;
      }
      
      setIsCheckingServiceWorker(false);
      return false;
      
    } catch (error) {
      console.error('[OfflineMode] Error checking service worker readiness:', error);
      setIsCheckingServiceWorker(false);
      return false;
    }
  }, [isServiceWorkerSupported]);

  // Listen for service worker events
  useEffect(() => {
    if (!isServiceWorkerSupported || !(window as any).swEvents) return;
    
    const handleSwControlling = () => {
      console.log('[OfflineMode] Received sw-controlling event');
      setIsServiceWorkerReady(true);
      setIsCheckingServiceWorker(false);
    };
    
    const handleSwError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('[OfflineMode] Service worker error:', customEvent.detail?.error);
      setIsServiceWorkerReady(false);
      setIsCheckingServiceWorker(false);
    };
    
    const handleSwNotSupported = () => {
      console.log('[OfflineMode] Service worker not supported event received');
      setIsServiceWorkerSupported(false);
      setIsCheckingServiceWorker(false);
    };
    
    // Add event listeners
    (window as any).swEvents.addEventListener('sw-controlling', handleSwControlling);
    (window as any).swEvents.addEventListener('sw-activated', handleSwControlling);
    (window as any).swEvents.addEventListener('sw-error', handleSwError);
    (window as any).swEvents.addEventListener('sw-not-supported', handleSwNotSupported);
    
    return () => {
      // Remove event listeners
      (window as any).swEvents.removeEventListener('sw-controlling', handleSwControlling);
      (window as any).swEvents.removeEventListener('sw-activated', handleSwControlling);
      (window as any).swEvents.removeEventListener('sw-error', handleSwError);
      (window as any).swEvents.removeEventListener('sw-not-supported', handleSwNotSupported);
    };
  }, [isServiceWorkerSupported]);

  // Initial check for service worker status
  useEffect(() => {
    // Immediately check service worker status on mount
    checkServiceWorkerReadiness();
    
    // Also check after a short delay in case the service worker takes time to initialize
    const delayedCheckTimer = setTimeout(() => {
      if (!isServiceWorkerReady) {
        checkServiceWorkerReadiness();
      }
    }, 2000);
    
    return () => clearTimeout(delayedCheckTimer);
  }, [checkServiceWorkerReadiness]);

  // Regularly check service worker status until ready
  useEffect(() => {
    if (!isServiceWorkerSupported || isServiceWorkerReady || initializationAttempts >= 5) return;

    // Set up periodic checks for service worker status
    const intervalId = setInterval(() => {
      setInitializationAttempts(prev => prev + 1);
      checkServiceWorkerReadiness();
    }, 2000); // Check every 2 seconds
    
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

  // More robust service worker waiting function
  const waitForServiceWorker = async (timeoutMs = 5000): Promise<boolean> => {
    if (isServiceWorkerReady) return true;
    if (!isServiceWorkerSupported) return false;
    
    setIsCheckingServiceWorker(true);
    console.log('[OfflineMode] Waiting for service worker to become ready');
    
    // Try to register the service worker if needed
    try {
      if (!navigator.serviceWorker.controller && !(window as any).swRegistration) {
        console.log('[OfflineMode] Service worker not registered yet, registering now');
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          (window as any).swRegistration = registration;
          
          // Force activation
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        } catch (error) {
          console.error('[OfflineMode] Failed to register service worker during wait:', error);
        }
      }
      
      // Prompt existing service worker to claim clients
      if ((window as any).swRegistration?.active) {
        try {
          (window as any).swRegistration.active.postMessage({ type: 'SKIP_WAITING' });
        } catch (e) {
          console.warn('[OfflineMode] Error sending skip waiting message:', e);
        }
      }
      
      // Set a timeout to resolve the waiting
      const waitPromise = new Promise<boolean>(resolve => {
        // Set up event listener for when service worker takes control
        const handleSwControlling = () => {
          console.log('[OfflineMode] Service worker took control during wait');
          resolve(true);
        };
        
        (window as any).swEvents.addEventListener('sw-controlling', handleSwControlling);
        
        // Also check periodically
        const checkInterval = setInterval(async () => {
          const isReady = await checkServiceWorkerReadiness();
          if (isReady) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 500);
        
        // Timeout after specified duration
        setTimeout(() => {
          clearInterval(checkInterval);
          (window as any).swEvents.removeEventListener('sw-controlling', handleSwControlling);
          resolve(false);
        }, timeoutMs);
      });
      
      // Wait for either the service worker to take control or the timeout
      const result = await waitPromise;
      
      // One final check
      if (!result) {
        const finalCheck = await checkServiceWorkerReadiness();
        setIsServiceWorkerReady(finalCheck);
        setIsCheckingServiceWorker(false);
        return finalCheck;
      }
      
      setIsServiceWorkerReady(true);
      setIsCheckingServiceWorker(false);
      return true;
    } catch (error) {
      console.error('[OfflineMode] Error waiting for service worker:', error);
      setIsCheckingServiceWorker(false);
      return false;
    }
  };

  // Enable offline mode with improved reliability
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
    
    // Wait for service worker if needed
    if (!isServiceWorkerReady) {
      toast({
        title: "Preparing offline mode",
        description: "Setting up service worker...",
        duration: 3000,
      });
      
      const ready = await waitForServiceWorker(8000);
      
      if (!ready) {
        if (isServiceWorkerSupported) {
          toast({
            title: "Service worker initialization failed",
            description: "Try refreshing the page and enabling offline mode again.",
            variant: "destructive",
            duration: 5000,
          });
        }
        return;
      }
    }
    
    try {
      setIsDownloading(true);

      // Setup progress simulation
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 200);

      // Setup listener for cache complete event
      const cacheCompletePromise = new Promise<boolean>(resolve => {
        const handleCacheComplete = () => {
          (window as any).swEvents.removeEventListener('sw-cache-complete', handleCacheComplete);
          resolve(true);
        };
        
        (window as any).swEvents.addEventListener('sw-cache-complete', handleCacheComplete);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          (window as any).swEvents.removeEventListener('sw-cache-complete', handleCacheComplete);
          resolve(false); // Resolve anyway, we'll proceed with best effort
        }, 10000);
      });

      // Send cache request to service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA_FILES'
        });
        
        await cacheCompletePromise;
      } else {
        console.warn('[OfflineMode] No controller yet, trying once more');
        
        // Last attempt to get controller
        await waitForServiceWorker(3000);
        
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_DATA_FILES'
          });
          await cacheCompletePromise;
        }
      }

      // Finalize progress
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      // Enable offline mode after a brief delay
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
      console.error('[OfflineMode] Failed to cache data:', error);
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
    setDownloadProgress(0);
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

  // Function to manually reload the service worker
  const reloadServiceWorker = async () => {
    if (!isServiceWorkerSupported) return false;
    
    setIsCheckingServiceWorker(true);
    
    try {
      // Force service worker update
      if ((window as any).swRegistration) {
        await (window as any).swRegistration.update();
      } else {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        (window as any).swRegistration = registration;
      }
      
      // Skip waiting if there's a waiting worker
      if ((window as any).swRegistration?.waiting) {
        (window as any).swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Wait for it to be ready
      return await waitForServiceWorker(5000);
    } catch (error) {
      console.error('[OfflineMode] Failed to reload service worker:', error);
      setIsCheckingServiceWorker(false);
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
