import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  level: number;
  progress: number; 
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export default function LevelLoadingScreen({
  visible,
  level,
  progress,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(clamp(progress))).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: clamp(progress),
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, trackWidth],
  });

  if (!visible) return null;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../assets/loadingscreen3.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.centerWrap}>
            <Text style={styles.levelText}>Loading Level {level}</Text>

            <View style={styles.animationWrap}>
              <LottieView
                source={require('../assets/catplayinganimation.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>

            <View style={styles.progressSection}>
              <View
                style={styles.progressTrack}
                onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: fillWidth,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressText}>
                {Math.round(clamp(progress) * 100)}%
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 18,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  animationWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 220,
    height: 220,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  progressTrack: {
    width: '72%',
    maxWidth: 300,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F4BE2A',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});