
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/components/ui/use-toast';

export function useOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useLocalStorage<boolean>('offlineMode', false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

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

  const enableOfflineMode = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
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

        // Cache data files
        await navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA_FILES'
        });

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
    } else {
      toast({
        title: "Offline mode not supported",
        description: "Your browser doesn't support service workers.",
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
  };
}
