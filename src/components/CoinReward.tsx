import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  animationKey: number;
  x: number;
  y: number;
  count: number;
  onDone?: () => void;
};

const STAGGER_MS = 180;
const DURATION_MS = 420;

export default function CoinReward({
  visible,
  animationKey,
  x,
  y,
  count,
  onDone,
}: Props) {
  const valuesRef = useRef<Animated.Value[]>([]);

  if (valuesRef.current.length !== count) {
    valuesRef.current = Array.from({ length: count }, () => new Animated.Value(0));
  }

  useEffect(() => {
    if (!visible || count <= 0) return;

    valuesRef.current.forEach(v => v.setValue(0));

    const animations = valuesRef.current.slice(0, count).map(v =>
      Animated.timing(v, {
        toValue: 1,
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    Animated.stagger(STAGGER_MS, animations).start(({ finished }) => {
      if (finished) onDone?.();
    });

    return () => {
      valuesRef.current.forEach(v => v.stopAnimation());
    };
  }, [visible, animationKey, count]);

  if (!visible || count <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: x,
          top: y,
          height: count * 12 + 40,
        },
      ]}
    >
      {valuesRef.current.slice(0, count).map((v, index) => {
        const translateY = v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(24 + index * 2)],
        });

        const opacity = v.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        const scale = v.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.85, 1, 0.95],
        });

        return (
          <Animated.View
            key={`${animationKey}-${index}`}
            style={[
              styles.burstItem,
              {
                top: index * 10,
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <Text style={styles.burstText}>+2</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 90,
    overflow: 'visible',
    alignItems: 'center',
  },
  burstItem: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  burstText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});