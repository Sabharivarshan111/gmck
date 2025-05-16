
import { Switch } from "@/components/ui/switch";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { Wifi, WifiOff, AlertTriangle, Loader, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function OfflineToggle() {
  const { 
    isOfflineMode, 
    isOnline, 
    isDownloading, 
    downloadProgress, 
    toggleOfflineMode,
    isServiceWorkerSupported,
    isServiceWorkerReady,
    isCheckingServiceWorker,
    reloadServiceWorker
  } = useOfflineMode();
  
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Auto-retry service worker registration if needed
  useEffect(() => {
    if (!isServiceWorkerSupported || isServiceWorkerReady || retryCount >= 3 || isRetrying) return;
    
    const timeoutId = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      handleRetryServiceWorker();
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [isServiceWorkerSupported, isServiceWorkerReady, retryCount, isRetrying]);

  const handleRetryServiceWorker = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    await reloadServiceWorker();
    setIsRetrying(false);
  };

  // Render different state based on service worker status
  const renderServiceWorkerStatus = () => {
    if (!isServiceWorkerSupported) {
      return (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>Browser doesn't support offline mode</span>
        </div>
      );
    }
    
    if (isCheckingServiceWorker) {
      return (
        <div className="flex items-center gap-1 text-blue-500 text-xs">
          <Loader className="h-3 w-3 animate-spin" />
          <span>Checking service worker...</span>
        </div>
      );
    }
    
    if (!isServiceWorkerReady) {
      return (
        <div className="flex items-center gap-1 text-orange-500 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>Service worker not ready</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 px-1 py-0 text-xs"
            onClick={handleRetryServiceWorker}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {isRetrying ? "Retrying" : "Retry"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 px-1 py-0 text-xs"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isOfflineMode ? (
            <WifiOff className="h-4 w-4 text-orange-500" />
          ) : (
            <Wifi className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
          )}
          <span className="text-xs font-medium">
            {isOfflineMode ? "Offline Mode" : isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <Switch
          checked={isOfflineMode}
          onCheckedChange={toggleOfflineMode}
          disabled={isDownloading || !isServiceWorkerSupported || (!isServiceWorkerReady && !isOfflineMode)}
          aria-label="Toggle offline mode"
        />
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => setShowDetails(!showDetails)}
        >
          <AlertTriangle className={`h-3 w-3 ${showDetails ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </Button>
      </div>
      
      {showDetails && renderServiceWorkerStatus()}

      {isDownloading && (
        <div className="w-full pt-1">
          <Progress value={downloadProgress} className="h-1 w-full" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Downloading app data ({downloadProgress}%)...
          </p>
        </div>
      )}
    </div>
  );
}
