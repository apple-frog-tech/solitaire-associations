import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { CardState } from '../gamelogic/solitaireTypes';

type Props = {
  visible: boolean;
  animationKey: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  card: CardState;
  stackCards?: CardState[];
};

const MOVE_DURATION = 1200;
const COMPRESS_DURATION = 180;
const PAUSE_AT_END = 650;
const PAUSE_AT_START = 800;
const STACK_SQUEEZE = 0.18;

export default function HintFlyAnimation({
  visible,
  animationKey,
  startX,
  startY,
  endX,
  endY,
  card,
  stackCards = [],
}: Props) {
  const travel = useRef(new Animated.Value(0)).current;
  const squeeze = useRef(new Animated.Value(0)).current;
  const stopRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cardsToRender = stackCards.length > 1 ? stackCards : [card];
  const anchorCard = cardsToRender[0];

  useEffect(() => {
    stopRef.current = false;
    travel.setValue(0);
    squeeze.setValue(0);

    const clearAll = () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current = [];
    };

   const runCycle = () => {
  if (stopRef.current || !visible) return;

  Animated.sequence([
    Animated.timing(squeeze, {
      toValue: 1,
      duration: COMPRESS_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(travel, {
      toValue: 1,
      duration: MOVE_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start(({ finished }) => {
    if (!finished || stopRef.current || !visible) return;

    const pause = setTimeout(() => {
      if (stopRef.current || !visible) return;

      travel.setValue(0);
      squeeze.setValue(0);

      const restart = setTimeout(() => {
        if (stopRef.current || !visible) return;
        runCycle();
      }, PAUSE_AT_START);

      timeoutsRef.current.push(restart);
    }, PAUSE_AT_END);

    timeoutsRef.current.push(pause);
  });
};

    if (visible) runCycle();

    return () => {
      stopRef.current = true;
      clearAll();
    };
  }, [animationKey, visible, travel, squeeze]);

  if (!visible) return null;

  const translateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [startX - anchorCard.width / 2, endX - anchorCard.width / 2],
  });

  const translateY = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [startY - anchorCard.height / 2, endY - anchorCard.height / 2],
  });

  const squeezeFactor = squeeze.interpolate({
    inputRange: [0, 1],
    outputRange: [1, STACK_SQUEEZE],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View style={[styles.group, { transform: [{ translateX }, { translateY }] }]}>
       {cardsToRender.map((renderCard, index) => {
  const offsetX = renderCard.x - anchorCard.x;
  const offsetY = renderCard.y - anchorCard.y;
  const isTopCard = index === cardsToRender.length - 1;

  return (
    <Animated.View
      key={renderCard.id}
      style={[
        styles.card,
        renderCard.cardType === 'category'
          ? styles.categoryCard
          : styles.itemCard,
        {
          width: renderCard.width,
          height: renderCard.height,
          zIndex: index + 1,
          elevation: index + 1,
          transform: [
            { translateX: offsetX },
            {
              translateY:
                index === 0
                  ? 0
                  : Animated.multiply(squeezeFactor, offsetY),
            },
          ],
        },
      ]}
    >
      <View style={styles.inner}>
        {isTopCard && (
          <Text style={styles.label} numberOfLines={2}>
            {renderCard.label}
          </Text>
        )}
      </View>
    </Animated.View>
  );
})}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99999,
    elevation: 99999,
  },
  group: {
    position: 'absolute',
  },
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E7DDCC',
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#F0C400',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});