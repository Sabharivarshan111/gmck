
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { WifiOff, Wifi, AlertTriangle, Loader } from "lucide-react";

export function OfflineIndicator() {
  const { 
    isOfflineMode, 
    isOnline, 
    isServiceWorkerSupported,
    isServiceWorkerReady,
    isCheckingServiceWorker
  } = useOfflineMode();

  // Show when service worker is being initialized
  if (isCheckingServiceWorker) {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 py-1 px-3 rounded-full 
        bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 
        border border-blue-200 dark:border-blue-800/50 
        shadow-lg flex items-center gap-1.5 text-xs font-medium z-50"
      >
        <Loader className="h-3 w-3 animate-spin" />
        <span>Initializing offline capabilities...</span>
      </div>
    );
  }

  // Only show other indicators when there's something to show
  if (!isOfflineMode && isOnline && (isServiceWorkerSupported && isServiceWorkerReady)) {
    return null;
  }

  // Different indicators based on state
  let bgClass = "";
  let icon = null;
  let message = "";
  
  if (isOfflineMode) {
    bgClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50";
    icon = <WifiOff className="h-3 w-3" />;
    message = "Offline mode";
  } else if (!isOnline) {
    bgClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50";
    icon = <Wifi className="h-3 w-3" />;
    message = "No internet connection";
  } else if (!isServiceWorkerSupported) {
    bgClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50";
    icon = <AlertTriangle className="h-3 w-3" />;
    message = "Offline mode not supported";
  } else if (!isServiceWorkerReady) {
    bgClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50";
    icon = <AlertTriangle className="h-3 w-3" />;
    message = "Offline capabilities initializing";
  }

  return (
    <div 
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 py-1 px-3 rounded-full 
        ${bgClass} shadow-lg flex items-center gap-1.5 text-xs font-medium animate-pulse z-50`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
