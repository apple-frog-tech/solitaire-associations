import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setCardDropSoundEnabled } from '../services/cardDropSound';

type AppSettingsContextValue = {
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setCardDropSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const value = useMemo(
    () => ({
      soundEnabled,
      setSoundEnabled,
    }),
    [soundEnabled],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }
  return context;
}