import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  animationKey: number;
  x: number;
  y: number;
  width: number;
  height: number;
  onDone?: () => void;
};

export default function MasterCardBreakAnimation({
  visible,
  animationKey,
  x,
  y,
  width,
  height,
  onDone,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }, [animationKey, visible, onDone, progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.68, 0.82, 1],
    outputRange: [1, 1, 0.55, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
    outputRange: [1, 1.03, 1.06, 1.05, 1.08, 1.04, 1],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 1],
    outputRange: [0, -6, 6, -5, 5, -4, 4, -2, 2, 0],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 1],
    outputRange: [0, -2, 2, -2, 2, -1, 1, -1, 1, 0],
  });

  const rotateZ = progress.interpolate({
    inputRange: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 1],
    outputRange: [
      '0deg',
      '-2deg',
      '2deg',
      '-2deg',
      '2deg',
      '-1.5deg',
      '1.5deg',
      '-1deg',
      '1deg',
      '0deg',
    ],
  });

  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.25, 0.6, 1],
    outputRange: [0, 0.18, 0.12, 0],
  });

  const borderOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.35, 0.72, 1],
    outputRange: [0, 0.25, 0.7, 0.45, 0],
  });

  const borderScale = progress.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [1, 1.01, 1.02, 1],
  });

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          left: x,
          top: y,
          width,
          height,
          opacity,
          transform: [{ translateX }, { translateY }, { rotateZ }, { scale }],
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.borderOverlay,
          {
            opacity: borderOpacity,
            transform: [{ scale: borderScale }],
          },
        ]}
      />

      <View style={styles.cardClip}>
        <ImageBackground
          source={require('../assets/mastercard.png')}
          resizeMode="cover"
          style={styles.image}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    overflow: 'visible',
    zIndex: 30000,
    elevation: 30000,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: 'rgba(57,232,242,0.35)',
  },
  cardClip: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});