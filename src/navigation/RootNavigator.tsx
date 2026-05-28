import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import LevelLoadingScreen from '../screens/LevelLoadingScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type Mode = 'idle' | 'loading';

export default function RootNavigator() {
  const [mode, setMode] = useState<Mode>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  const [gameKey, setGameKey] = useState(0);

  const [initialRoute, setInitialRoute] = useState<'Home' | 'Game'>('Home');

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const startLoading = useCallback((nextRoute: 'Home' | 'Game') => {
    clearTimers();
    setInitialRoute(nextRoute);
    setMode('loading');
    setLoadingProgress(0);

    let progress = 0;

    progressTimerRef.current = setInterval(() => {
      progress = Math.min(progress + 0.07, 1);
      setLoadingProgress(progress);

      if (progress >= 1) {
        clearTimers();

        finishTimerRef.current = setTimeout(() => {
          setGameKey(prev => prev + 1);
          setMode('idle');
        }, 250);
      }
    }, 60);
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handleRequestNextLevel = useCallback(() => {
    setCurrentLevel(prev => prev + 1);
    startLoading('Game');
  }, [startLoading]);

  return (
    <>
      {mode === 'loading' ? (
        <LevelLoadingScreen
          visible
          level={currentLevel}
          progress={loadingProgress}
        />
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            key={`${gameKey}-${initialRoute}`}
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Game">
              {({ navigation }) => (
                <GameScreen
                  key={gameKey}
                  onRequestNextLevel={handleRequestNextLevel}
                  onRequestHome={() => navigation.navigate('Home')}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </>
  );
}