import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type UndoAnimCard = {
  id: string;
  label: string;
  cardType: 'category' | 'item';
  width: number;
  height: number;
  x: number;
  y: number;
};

type Props = {
  visible: boolean;
  animationKey: number;
  x: number;
  y: number;
  cards: UndoAnimCard[];
  onDone?: () => void;
};

const SHAKE_X = 2;

export default function UndoMoveAnimation({
  visible,
  animationKey,
  x,
  y,
  cards,
  onDone,
}: Props) {
  const shake = useRef(new Animated.Value(0)).current;
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    shake.stopAnimation();
    shake.setValue(0);

    if (!visible || cards.length === 0) return;

    Animated.sequence([
      Animated.timing(shake, {
        toValue: -SHAKE_X,
        duration: 45,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: SHAKE_X,
        duration: 45,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -SHAKE_X,
        duration: 45,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: SHAKE_X,
        duration: 45,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 45,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !stopRef.current) {
        onDone?.();
      }
    });

    return () => {
      stopRef.current = true;
      shake.stopAnimation();
    };
  }, [animationKey, visible, cards, shake, onDone]);

  if (!visible || cards.length === 0) return null;

  const anchorCard = cards[0];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.group,
          {
            left: x - anchorCard.width / 2,
            top: y - anchorCard.height / 2,
            transform: [{ translateX: shake }],
          },
        ]}
      >
        {cards.map((card, index) => {
          const offsetX = card.x - anchorCard.x;
          const offsetY = card.y - anchorCard.y;
          const isTopCard = index === cards.length - 1;

          return (
            <View
              key={card.id}
              style={[
                styles.card,
                card.cardType === 'category'
                  ? styles.categoryCard
                  : styles.itemCard,
                {
                  left: offsetX,
                  top: offsetY,
                  width: card.width,
                  height: card.height,
                  zIndex: index + 1,
                  elevation: index + 1,
                },
              ]}
            >
              <View style={styles.inner}>
                {isTopCard && (
                  <Text style={styles.label} numberOfLines={2}>
                    {card.label}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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