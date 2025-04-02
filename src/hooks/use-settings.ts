
import { useState } from 'react';
import { useLocalStorage } from './use-local-storage';

interface Settings {
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'blackpink';
  // Add other settings as needed
}

const defaultSettings: Settings = {
  fontSize: 'medium',
  theme: 'dark',
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>('app-settings', defaultSettings);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  return {
    settings,
    updateSettings,
  };
}
