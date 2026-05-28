import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CardState, SlotState } from '../gamelogic/solitaireTypes';
import { getCardProgressInfo } from '../gamelogic/cardProgress';

type Props = {
  card: CardState;
  rootCard: CardState;
  stackIndex: number;
  totalCards: number;
  slots: SlotState[];
  categoryCardTotals: Record<string, number>;
  isActive?: boolean;
  hideTopLabel?: boolean;
};

export default function StackedCardUI({
  card,
  rootCard,
  stackIndex,
  totalCards,
  slots,
  categoryCardTotals,
  isActive = false,
  hideTopLabel
}: Props) {
  const isTopCard = stackIndex === totalCards - 1;

  const { isCategoryCard, showProgress, progressText } = useMemo(
    () => getCardProgressInfo(card, slots, categoryCardTotals),
    [card, slots, categoryCardTotals]
  );

  const cardStyle = card.cardType === 'category'
  ? styles.categoryCard
  : isActive
    ? styles.activeCard
    : styles.inactiveCard;

  return (
    <View
      pointerEvents="none"
      style={[
  styles.card,
  cardStyle,
  {
    left: card.x - rootCard.x,
    top: card.y - rootCard.y,
    width: card.width,
    height: card.height,
    zIndex: card.zIndex,
    elevation: 0,
  },
]}
    >
     {isTopCard ? (
  hideTopLabel ? (
    <View style={styles.centerWrap} />
  ) : (
    <View style={styles.centerWrap}>
      {isCategoryCard && <Text style={styles.crown}>👑</Text>}

      {showProgress && (
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>
      )}

      <Text style={styles.centerLabel} numberOfLines={2}>
        {card.label}
      </Text>
    </View>
  )
) : (
  <View style={styles.coverLabelWrap}>
    <Text style={styles.coveredLabel} numberOfLines={1}>
      {card.label}
    </Text>
  </View>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
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
  centerWrap: {
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
  centerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
  },
  coverLabelWrap: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coveredLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
  },
});
