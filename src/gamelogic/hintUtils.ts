import type { CardState, GameState } from './solitaireTypes';

export type HintTarget =
  | {
      kind: 'slot';
      slotId: string;
    }
  | {
      kind: 'card';
      cardId: string;
    };

export type HintMove = {
  sourceCardId: string;
  stackCardIds: string[];
  target: HintTarget;
};

function getVisibleColumnStackCardIds(state: GameState, columnId: string): string[] {
  const column = state.columns.find(c => c.id === columnId);
  if (!column) return [];

  return column.cardIds
    .map(id => state.cards[id])
    .filter((card): card is CardState => !!card && card.faceUp && !card.placed)
    .map(card => card.id);
}

function getHintStackCardIds(state: GameState, sourceCardId: string): string[] {
  const sourceCard = state.cards[sourceCardId];
  if (!sourceCard) return [sourceCardId];

  if (sourceCard.location !== 'column' || !sourceCard.columnId) {
    return [sourceCardId];
  }

  const visibleStack = getVisibleColumnStackCardIds(state, sourceCard.columnId);
  return visibleStack.length > 0 ? visibleStack : [sourceCardId];
}

function findMatchingCategorySlot(state: GameState, categoryId: string) {
  return state.slots.find(slot => {
    return (
      slot.categoryId === categoryId &&
      !slot.isCompleting &&
      !slot.isCompleted
    );
  });
}

function findMatchingItemTarget(
  state: GameState,
  sourceCard: CardState,
): HintTarget | null {
  const slotTarget = findMatchingCategorySlot(state, sourceCard.categoryId);
  if (slotTarget) {
    return {
      kind: 'slot',
      slotId: slotTarget.id,
    };
  }

  const targetCard = Object.values(state.cards)
    .filter(card => {
      if (!card.faceUp) return false;
      if (card.placed) return false;
      if (card.id === sourceCard.id) return false;
      if (card.cardType !== 'item') return false;
      return card.categoryId === sourceCard.categoryId;
    })
    .sort((a, b) => b.zIndex - a.zIndex)[0];

  if (targetCard) {
    return {
      kind: 'card',
      cardId: targetCard.id,
    };
  }

  return null;
}

export function getHintMove(state: GameState): HintMove | null {
  const faceUpMovableCards = Object.values(state.cards)
    .filter(card => card.faceUp && card.movable && !card.placed)
    .sort((a, b) => b.zIndex - a.zIndex);

  if (faceUpMovableCards.length === 0) return null;

  const itemCards = faceUpMovableCards.filter(card => card.cardType === 'item');

  for (const sourceCard of itemCards) {
    const target = findMatchingItemTarget(state, sourceCard);
    if (target) {
      const stackCardIds = getHintStackCardIds(state, sourceCard.id);

      return {
        sourceCardId: stackCardIds[0] ?? sourceCard.id,
        stackCardIds,
        target,
      };
    }
  }

  const emptySlot = state.slots.find(
    slot => !slot.categoryId && !slot.isCompleting && !slot.isCompleted,
  );

  if (emptySlot) {
    const categoryCard = faceUpMovableCards.find(card => card.cardType === 'category');

    if (categoryCard) {
      const stackCardIds = getHintStackCardIds(state, categoryCard.id);

      return {
        sourceCardId: stackCardIds[0] ?? categoryCard.id,
        stackCardIds,
        target: {
          kind: 'slot',
          slotId: emptySlot.id,
        },
      };
    }
  }

  return null;
}