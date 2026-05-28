import React, { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeAds } from './src/ads/admob';
import {
  initCardFeedback,
  releaseCardFeedback,
} from './src/services/cardDropSound';
import { AppSettingsProvider } from './src/context/AppSettingsContext';

export default function App() {
  useEffect(() => {
    initializeAds();
    initCardFeedback();

    return () => {
      releaseCardFeedback();
    };
  }, []);

  return (
    <AppSettingsProvider>
      <RootNavigator />
    </AppSettingsProvider>
  );
}