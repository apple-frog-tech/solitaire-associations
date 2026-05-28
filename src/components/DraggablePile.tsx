import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import type { CardState, DropResult, SlotState } from '../gamelogic/solitaireTypes';
import StackedCardUI from './StackedCardUI';
import { playCardDropFeedback } from '../services/cardDropSound';

type Props = {
  pileCards: CardState[];
  onDropPile: (cardIds: string[], finalX: number, finalY: number) => DropResult;
  slots: SlotState[];
  categoryCardTotals: Record<string, number>;
  onTouchHintCancel?: () => void;
  masterPlacementMode?: boolean;
  onMasterTargetPress?: (cardId: string) => void;
};

export default function DraggablePile({
  pileCards,
  onDropPile,
  slots,
  categoryCardTotals,
  onTouchHintCancel,
  masterPlacementMode = false,
  onMasterTargetPress,
}: Props) {
  const rootCard = pileCards[0];
  const pan = useRef(new Animated.ValueXY({ x: rootCard.x, y: rootCard.y })).current;
  const startPos = useRef({ x: rootCard.x, y: rootCard.y });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    pan.setValue({ x: rootCard.x, y: rootCard.y });
    startPos.current = { x: rootCard.x, y: rootCard.y };
  }, [rootCard.x, rootCard.y, rootCard.id, pan]);

  const bounds = useMemo(() => {
    const maxX = Math.max(...pileCards.map(card => card.x - rootCard.x + card.width));
    const maxY = Math.max(...pileCards.map(card => card.y - rootCard.y + card.height));

    return {
      width: maxX,
      height: maxY,
    };
  }, [pileCards, rootCard.x, rootCard.y]);

 const responder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => !masterPlacementMode,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => !masterPlacementMode,

      onPanResponderGrant: () => {
        onTouchHintCancel?.();

        if (masterPlacementMode) {
          return;
        }

        setIsDragging(true);
        startPos.current = { x: rootCard.x, y: rootCard.y };
        pan.stopAnimation();
      },

      onPanResponderMove: (_, gestureState) => {
        if (masterPlacementMode) return;

        pan.setValue({
          x: startPos.current.x + gestureState.dx,
          y: startPos.current.y + gestureState.dy,
        });
      },

      onPanResponderRelease: (_, gestureState) => {
  if (masterPlacementMode) {
    const topCard = pileCards[pileCards.length - 1];
    if (topCard) {
      onMasterTargetPress?.(topCard.id);
    }
    return;
  }

  const finalX = startPos.current.x + gestureState.dx;
  const finalY = startPos.current.y + gestureState.dy;

  const result = onDropPile(
    pileCards.map(card => card.id),
    finalX,
    finalY
  );

  playCardDropFeedback();

  Animated.spring(pan, {
    toValue: { x: result.targetX, y: result.targetY },
    friction: 7,
    tension: 90,
    useNativeDriver: false,
  }).start(() => {
    setIsDragging(false);
    startPos.current = { x: result.targetX, y: result.targetY };
  });
},

      onPanResponderTerminate: () => {
        if (masterPlacementMode) return;

        Animated.spring(pan, {
          toValue: { x: rootCard.x, y: rootCard.y },
          friction: 7,
          tension: 90,
          useNativeDriver: false,
        }).start(() => {
          setIsDragging(false);
          startPos.current = { x: rootCard.x, y: rootCard.y };
        });
      },
    }),
  [masterPlacementMode, onDropPile, onMasterTargetPress, onTouchHintCancel, pileCards, pan, rootCard.x, rootCard.y]
);

  return (
    <Animated.View
    onTouchStart={onTouchHintCancel}
      {...responder.panHandlers}
      style={[
        styles.wrapper,
        {
          width: bounds.width,
          height: bounds.height,
          zIndex: isDragging ? 9999 : pileCards[pileCards.length - 1].zIndex,
          elevation: isDragging ? 9999 : pileCards[pileCards.length - 1].zIndex,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
    >
      {pileCards.map((card, index) => (
        <StackedCardUI
  key={card.id}
  card={card}
  rootCard={rootCard}
  stackIndex={index}
  totalCards={pileCards.length}
  slots={slots}
  categoryCardTotals={categoryCardTotals}
  isActive={index === pileCards.length - 1}
/>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});