import type { CardState, SlotState } from './solitaireTypes';

type CategoryTotals = Record<string, number>;

export function getCardProgressInfo(
  card: CardState,
  slots: SlotState[],
  categoryCardTotals: CategoryTotals
) {
  const slot = card.placedSlotId
    ? slots.find(s => s.id === card.placedSlotId)
    : null;

  const total = categoryCardTotals[card.categoryId] ?? 0;

  const current = slot ? slot.matchedCardIds.length : 0;

  const showProgress =
    card.cardType === 'category' || !!card.placedSlotId;

  return {
    isCategoryCard: card.cardType === 'category',
    showProgress,
    progressText: showProgress ? `${current}/${total}` : '',
  };
}