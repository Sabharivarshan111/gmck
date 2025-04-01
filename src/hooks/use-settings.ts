
import { useLocalStorage } from "./use-local-storage";

interface Settings {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  audioFeedback: boolean;
  chatResponseLength: 'concise' | 'detailed';
  notificationsEnabled: boolean;
}

const defaultSettings: Settings = {
  fontSize: 'medium',
  highContrast: false,
  audioFeedback: false,
  chatResponseLength: 'detailed',
  notificationsEnabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>("user-settings", defaultSettings);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(current => ({
      ...current,
      ...newSettings
    }));
  };

  return {
    settings,
    updateSettings
  };
}
