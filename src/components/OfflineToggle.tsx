
import { Switch } from "@/components/ui/switch";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { Wifi, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function OfflineToggle() {
  const { 
    isOfflineMode, 
    isOnline, 
    isDownloading, 
    downloadProgress, 
    toggleOfflineMode 
  } = useOfflineMode();

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
          disabled={isDownloading}
          aria-label="Toggle offline mode"
        />
      </div>

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
