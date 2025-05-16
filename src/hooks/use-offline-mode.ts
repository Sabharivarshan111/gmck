
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/components/ui/use-toast';

export function useOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useLocalStorage<boolean>('offlineMode', false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState<boolean>('serviceWorker' in navigator);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState<boolean>(
    'serviceWorker' in navigator && 
    !!navigator.serviceWorker.controller && 
    !!(window as any).swControllerReady
  );
  const [isCheckingServiceWorker, setIsCheckingServiceWorker] = useState<boolean>(false);

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

  // Regularly check service worker status
  useEffect(() => {
    if (!isServiceWorkerSupported) return;

    // Check service worker readiness on initial load
    checkServiceWorkerReadiness();

    // Set up periodic checks for service worker status
    const intervalId = setInterval(() => {
      if (navigator.serviceWorker.controller && (window as any).swControllerReady) {
        setIsServiceWorkerReady(true);
        clearInterval(intervalId);
      } else {
        checkServiceWorkerReadiness();
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId);
  }, [isServiceWorkerSupported]);

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

  // Check if service worker is ready by sending a message to it and waiting for a response
  const checkServiceWorkerReadiness = async () => {
    if (!isServiceWorkerSupported || isCheckingServiceWorker) return false;
    
    setIsCheckingServiceWorker(true);
    
    try {
      if (navigator.serviceWorker.controller) {
        // Service worker is controlling the page
        setIsServiceWorkerReady(true);
        setIsCheckingServiceWorker(false);
        return true;
      }
      
      if ((window as any).swRegistration) {
        // Create a message channel
        const messageChannel = new MessageChannel();
        
        // Set up the promise
        const readinessPromise = new Promise<boolean>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.ready) {
              setIsServiceWorkerReady(true);
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          // Set a timeout in case the service worker doesn't respond
          setTimeout(() => resolve(false), 1000);
        });
        
        // Send the message
        (window as any).swRegistration.active?.postMessage(
          { type: 'IS_READY' },
          [messageChannel.port2]
        );
        
        // Wait for response
        const isReady = await readinessPromise;
        setIsServiceWorkerReady(isReady);
        return isReady;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking service worker readiness:', error);
      return false;
    } finally {
      setIsCheckingServiceWorker(false);
    }
  };

  // Wait for service worker to become ready
  const waitForServiceWorker = async (timeoutMs = 5000): Promise<boolean> => {
    if (isServiceWorkerReady) return true;
    if (!isServiceWorkerSupported) return false;
    
    setIsCheckingServiceWorker(true);
    
    // Try to register the service worker again if needed
    if (!navigator.serviceWorker.controller && !(window as any).swRegistration) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        (window as any).swRegistration = registration;
      } catch (error) {
        console.error('Failed to register service worker during wait:', error);
      }
    }
    
    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeoutMs) {
        // Check if service worker is ready
        const isReady = await checkServiceWorkerReadiness();
        
        if (isReady) {
          setIsServiceWorkerReady(true);
          setIsCheckingServiceWorker(false);
          return true;
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Timeout reached
      return false;
    } catch (error) {
      console.error('Error waiting for service worker:', error);
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
      
      const ready = await waitForServiceWorker();
      
      if (!ready) {
        toast({
          title: "Service worker not ready",
          description: "Please try again or reload the page.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    }
    
    try {
      setIsDownloading(true);

      // Simulate download progress (in a real app, you'd track actual progress)
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 300);

      // Cache data files if service worker controller is available
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA_FILES'
        });
      } else {
        console.warn('No service worker controller available to cache data files');
        // Try to wait for controller again
        await waitForServiceWorker(3000);
        
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_DATA_FILES'
          });
        }
      }

      // Clear interval just in case
      setTimeout(() => {
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        setTimeout(() => {
          setIsDownloading(false);
          setIsOfflineMode(true);
          
          toast({
            title: "Offline mode enabled",
            description: "App data has been cached for offline use.",
            duration: 3000,
          });
        }, 500);
      }, 3500);
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      
      toast({
        title: "Failed to enable offline mode",
        description: "Please try again.",
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
  };
}
