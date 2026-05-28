import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, Text } from 'react-native';
import type { CardState, DropResult, SlotState } from '../gamelogic/solitaireTypes';
import { getCardProgressInfo } from '../gamelogic/cardProgress';
import { playCardDropFeedback } from '../services/cardDropSound';

type Props = {
  card: CardState;
  onDrop: (cardId: string, finalX: number, finalY: number) => DropResult;
  slots: SlotState[];
  categoryCardTotals: Record<string, number>;
  isActive?: boolean;
  onTouchHintCancel?: () => void;
  masterPlacementMode?: boolean;
  onMasterTargetPress?: (cardId: string) => void;
};

export default function DraggableCard({
  card,
  onDrop,
  slots,
  categoryCardTotals,
  isActive = false,
  onTouchHintCancel,
  masterPlacementMode = false,
  onMasterTargetPress,
}: Props) {
  const pan = useRef(new Animated.ValueXY({ x: card.x, y: card.y })).current;
  const startPos = useRef({ x: card.x, y: card.y });
  const [isDragging, setIsDragging] = useState(false);
  const isLocked = !!card.lockedByMaster || !!card.isMaster;
  

  const { isCategoryCard, showProgress, progressText } = useMemo(
    () => getCardProgressInfo(card, slots, categoryCardTotals),
    [card, slots, categoryCardTotals]
  );

  useEffect(() => {
    pan.setValue({ x: card.x, y: card.y });
    startPos.current = { x: card.x, y: card.y };
  }, [card.x, card.y, pan]);

 const responder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => card.faceUp && (card.movable || masterPlacementMode),
      onMoveShouldSetPanResponder: () => card.movable && !masterPlacementMode,

      onPanResponderGrant: () => {
        onTouchHintCancel?.();

        if (masterPlacementMode) {
          return;
        }

        setIsDragging(true);
        startPos.current = { x: card.x, y: card.y };
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
    onMasterTargetPress?.(card.id);
    return;
  }

  const finalX = startPos.current.x + gestureState.dx;
  const finalY = startPos.current.y + gestureState.dy;

  const result = onDrop(card.id, finalX, finalY);

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
          toValue: { x: card.homeX, y: card.homeY },
          friction: 7,
          tension: 90,
          useNativeDriver: false,
        }).start(() => {
          setIsDragging(false);
          startPos.current = { x: card.homeX, y: card.homeY };
        });
      },
    }),
  [card, onDrop, pan, masterPlacementMode, onMasterTargetPress, onTouchHintCancel]
);
 const cardStyle = isCategoryCard
  ? styles.categoryCard
  : isActive
    ? styles.activeCard
    : styles.inactiveCard;

  if (!card.faceUp) return null;
  

  return (
    <Animated.View
    onTouchStart={onTouchHintCancel}
    {...(card.movable && !isLocked ? responder.panHandlers : {})}
     style={[
  styles.card,
  cardStyle,
  {
    width: card.width,
    height: card.height,
    zIndex: isDragging ? 9999 : card.zIndex,
    elevation: isDragging ? 8 : 1,
    transform: [{ translateX: pan.x }, { translateY: pan.y }],
  },
]}
    >
      <View style={styles.inner}>
        {isCategoryCard && <Text style={styles.crown}>👑</Text>}

        {showProgress && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        )}

        <Text style={styles.label}>{card.label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E7DDCC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 0,
  },
  activeCard: {
  // borderColor: '#FCE0A4',
  borderColor: 'rgba(57,232,242,0.35)',
  borderWidth: 3,
  backgroundColor: '#FFF',
},
inactiveCard: {
  borderColor: '#E7DDCC',
  borderWidth: 2,
  backgroundColor: '#FFFFFF',
},
categoryCard: {
  borderColor: '#F0C400',
  borderWidth: 3,
  backgroundColor: '#FFF',
},
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  crown: {
    position: 'absolute',
    top: 6,
    left: 7,
    fontSize: 14,
    zIndex: 3,
  },
  progressBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    minWidth: 30,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A4030',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});