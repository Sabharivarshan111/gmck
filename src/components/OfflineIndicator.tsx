
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const { isOfflineMode, isOnline } = useOfflineMode();

  if (!isOfflineMode && isOnline) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 py-1 px-3 rounded-full 
        ${isOfflineMode 
          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50" 
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50"
        } shadow-lg flex items-center gap-1.5 text-xs font-medium animate-pulse z-50`}
    >
      {isOfflineMode ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline mode</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" />
          <span>No internet connection</span>
        </>
      )}
    </div>
  );
}
