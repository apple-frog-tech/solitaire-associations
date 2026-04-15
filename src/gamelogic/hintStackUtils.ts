import type { CardState, GameState } from './solitaireTypes';

export function getHintAnimatedCards(state: GameState, sourceCardId: string): CardState[] {
  const sourceCard = state.cards[sourceCardId];
  if (!sourceCard) return [];

  // Waste or slot card = single card only
  if (!sourceCard.columnId) return [sourceCard];

  const column = state.columns.find(c => c.id === sourceCard.columnId);
  if (!column) return [sourceCard];

  // All visible cards in that column are the stack we want to squeeze
  const faceUpCards = column.cardIds
    .map(id => state.cards[id])
    .filter((card): card is CardState => !!card && card.faceUp && !card.placed);

  return faceUpCards.length > 1 ? faceUpCards : [sourceCard];
}