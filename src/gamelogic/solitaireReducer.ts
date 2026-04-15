import { BOARD, getWasteHomePosition } from './boardConfig';
import { GameState } from './solitaireTypes';
import { isSlotComplete } from './slotCompletionUtils';

type Action =
  | { type: 'DRAW_CARD' }
  | { type: 'PLACE_CARD'; cardId: string; slotId: string }
  | { type: 'MOVE_CARD_TO_COLUMN'; cardId: string; columnId: string; targetCardId?: string }
  | { type: 'PLACE_PILE'; cardIds: string[]; slotId: string }
  | { type: 'MOVE_PILE_TO_COLUMN'; cardIds: string[]; columnId: string; targetCardId?: string }
  | { type: 'FINALIZE_SLOT_COMPLETION'; slotId: string }
  | { type: 'RESET_LEVEL'; nextState: GameState }
  | { type: 'RESTOCK_STOCK' }
  | { type: 'USE_HINT' };

function syncWastePile(nextCards: GameState['cards'], wasteIds: string[]) {
  const visibleIds = wasteIds.slice(-3);

  wasteIds.forEach(id => {
    const card = nextCards[id];
    if (!card) return;

    const visibleIndex = visibleIds.indexOf(id);

    if (visibleIndex === -1) {
      nextCards[id] = {
        ...card,
        faceUp: false,
        movable: false,
        location: 'waste',
      };
      return;
    }

    const pos = getWasteHomePosition(visibleIndex);

    nextCards[id] = {
      ...card,
      x: pos.x,
      y: pos.y,
      homeX: pos.x,
      homeY: pos.y,
      faceUp: true,
      movable: visibleIndex === visibleIds.length - 1,
      location: 'waste',
      zIndex: 300 + visibleIndex,
    };
  });
}

function restockWasteToStock(nextCards: GameState['cards'], stockIds: string[]) {
  stockIds.forEach(id => {
    const card = nextCards[id];
    if (!card) return;

    nextCards[id] = {
      ...card,
      faceUp: false,
      movable: false,
      placed: false,
      placedSlotId: null,
      columnId: null,
      location: 'stock',
    };
  });
}

function revealTopCardAfterRemoval(
  nextCards: GameState['cards'],
  nextColumns: GameState['columns'],
  originColumnId: string
) {
  const originColumn = nextColumns.find(c => c.id === originColumnId);
  if (!originColumn || originColumn.cardIds.length === 0) return;

  const revealCardId = originColumn.cardIds[originColumn.cardIds.length - 1];
  const revealCard = nextCards[revealCardId];
  if (!revealCard) return;

  const revealIndex = originColumn.cardIds.length - 1;

  nextCards[revealCardId] = {
    ...revealCard,
    x: originColumn.x,
    y: originColumn.y + revealIndex * BOARD.hiddenOffsetY,
    homeX: originColumn.x,
    homeY: originColumn.y + revealIndex * BOARD.hiddenOffsetY,
    faceUp: true,
    movable: true,
    location: 'column',
  };
}

function removeFromWaste(nextWasteIds: string[], cardId: string) {
  const index = nextWasteIds.lastIndexOf(cardId);
  if (index >= 0) nextWasteIds.splice(index, 1);
}

function removeCardsFromColumn(
  nextColumns: GameState['columns'],
  columnId: string,
  cardIds: string[]
) {
  const originColumn = nextColumns.find(c => c.id === columnId);
  if (!originColumn) return;

  originColumn.cardIds = originColumn.cardIds.filter(id => !cardIds.includes(id));
}


function reflowVisibleColumnCards(
  nextCards: GameState['cards'],
  column: { id: string; x: number; y: number; cardIds: string[] }
) {
  const hiddenCount = column.cardIds.filter(id => {
    const card = nextCards[id];
    return !!card && !card.faceUp;
  }).length;

  const visibleIds = column.cardIds.filter(id => {
    const card = nextCards[id];
    return !!card && card.faceUp;
  });

  visibleIds.forEach((cardId, visibleIndex) => {
    const card = nextCards[cardId];
    if (!card) return;

    const newY =
      column.y +
      hiddenCount * BOARD.hiddenOffsetY +
      visibleIndex * BOARD.stackOffsetY;

    nextCards[cardId] = {
      ...card,
      x: column.x,
      y: newY,
      homeX: column.x,
      homeY: newY,
      faceUp: true,
      movable: visibleIndex === visibleIds.length - 1,
      location: 'column',
      zIndex: 100 + hiddenCount + visibleIndex,
    };
  });
}

export function solitaireReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'DRAW_CARD': {
      if (state.stockIds.length <= 0) return state;

      const nextCards = { ...state.cards };
      const nextStockIds = [...state.stockIds];
      const nextWasteIds = [...state.wasteIds];

      const drawnCardId = nextStockIds.pop();
      if (!drawnCardId) return state;

      nextWasteIds.push(drawnCardId);
      syncWastePile(nextCards, nextWasteIds);

      return {
        ...state,
        stockCount: nextStockIds.length,
        movesLeft: Math.max(state.movesLeft - 1, 0),
        stockIds: nextStockIds,
        wasteIds: nextWasteIds,
        cards: nextCards,
      };
    }

    case 'PLACE_CARD': {
  const slot = state.slots.find(s => s.id === action.slotId);
  const card = state.cards[action.cardId];

  if (!slot || !card) return state;
  if (!card.faceUp || card.placed) return state;

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({ ...c }));
  const nextWasteIds = [...state.wasteIds];
  const nextSlots = state.slots.map(s => ({
    ...s,
    matchedCardIds: [...s.matchedCardIds],
  }));

  

  const targetSlot = nextSlots.find(s => s.id === action.slotId);
  if (!targetSlot) return state;

  if (card.location === 'waste') {
    removeFromWaste(nextWasteIds, card.id);
    syncWastePile(nextCards, nextWasteIds);
  }

  if (card.columnId) {
    const originColumn = nextColumns.find(c => c.id === card.columnId);
    if (originColumn) {
      originColumn.cardIds = originColumn.cardIds.filter(id => id !== card.id);
      revealTopCardAfterRemoval(nextCards, nextColumns, originColumn.id);
    }
  }

  // 1) empty slot -> only category card allowed
  if (targetSlot.categoryId === null) {
  if (card.cardType !== 'category') return state;

  targetSlot.categoryId = card.categoryId;
  targetSlot.categoryTitle = card.categoryTitle;
  targetSlot.cardId = card.id;

  // key change: category card does NOT count as progress
  targetSlot.matchedCardIds = [];
}
  // 2) already locked slot -> only item cards of same category allowed
  else {
    if (card.cardType !== 'item') return state;
    if (card.categoryId !== targetSlot.categoryId) return state;

    targetSlot.matchedCardIds.push(card.id);
  }

  const slotIndex = nextSlots.findIndex(s => s.id === action.slotId);
if (slotIndex >= 0) {
  const slot = nextSlots[slotIndex];

  if (
    !slot.isCompleted &&
    !slot.isCompleting &&
    isSlotComplete(slot, state.categoryCardTotals)
  ) {
    nextSlots[slotIndex] = {
      ...slot,
      isCompleting: true,
    };
  }
}

const stackIndex = targetSlot.matchedCardIds.length;

  nextCards[action.cardId] = {
    ...card,
    x: targetSlot.x,
    y: targetSlot.y,
    homeX: targetSlot.x,
    homeY: targetSlot.y,
    movable: false,
    faceUp: true,
    placed: true,
    placedSlotId: action.slotId,
    columnId: null,
    location: 'slot',
    zIndex: 500 + targetSlot.matchedCardIds.length,
  };

  return {
    ...state,
    movesLeft: Math.max(state.movesLeft - 1, 0),
    slots: nextSlots,
    columns: nextColumns,
    wasteIds: nextWasteIds,
    cards: nextCards,
  };
}

case 'PLACE_PILE': {
  const slot = state.slots.find(s => s.id === action.slotId);
  if (!slot) return state;

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({ ...c }));
  const nextSlots = state.slots.map(s => ({
    ...s,
    matchedCardIds: [...s.matchedCardIds],
  }));

 

  const targetSlot = nextSlots.find(s => s.id === action.slotId);
  if (!targetSlot) return state;

  const pileCards = action.cardIds
    .map(cardId => nextCards[cardId])
    .filter((card): card is NonNullable<typeof card> => !!card);

  if (pileCards.length !== action.cardIds.length) return state;

  const pileCategoryId = pileCards[0].categoryId;
  if (!pileCards.every(card => card.categoryId === pileCategoryId)) return state;

  const bottomCard = pileCards[0];
  const topCard = pileCards[pileCards.length - 1];

  let orderedCardIds = [...action.cardIds];

  // Empty slot: category card must become the first/base card in the slot
  if (targetSlot.categoryId === null) {
  if (topCard.cardType !== 'category') return state;
  if (topCard.categoryId !== pileCategoryId) return state;

  const categoryIndex = action.cardIds.length - 1;

  orderedCardIds = [
    action.cardIds[categoryIndex],
    ...action.cardIds.slice(0, categoryIndex).reverse(),
  ];

  targetSlot.categoryId = topCard.categoryId;
  targetSlot.categoryTitle = topCard.categoryTitle;
  targetSlot.cardId = action.cardIds[categoryIndex];
} else {
    // Filled slot: item pile only, same category
    if (bottomCard.cardType !== 'item') return state;
    if (bottomCard.categoryId !== targetSlot.categoryId) return state;
  }

  if (bottomCard.columnId) {
    removeCardsFromColumn(nextColumns, bottomCard.columnId, action.cardIds);
    revealTopCardAfterRemoval(nextCards, nextColumns, bottomCard.columnId);
  }

//  targetSlot.matchedCardIds.push(...orderedCardIds);
const matchedItemIds = orderedCardIds.filter(
  id => nextCards[id]?.cardType === 'item'
);

targetSlot.matchedCardIds.push(...matchedItemIds);

  const slotIndex = nextSlots.findIndex(s => s.id === action.slotId);
if (slotIndex >= 0) {
  const slot = nextSlots[slotIndex];

  if (
    !slot.isCompleted &&
    !slot.isCompleting &&
    isSlotComplete(slot, state.categoryCardTotals)
  ) {
    nextSlots[slotIndex] = {
      ...slot,
      isCompleting: true,
    };
  }
}

  orderedCardIds.forEach((cardId, index) => {
    const card = nextCards[cardId];
    if (!card) return;

    nextCards[cardId] = {
      ...card,
      x: targetSlot.x,
      y: targetSlot.y,
      homeX: targetSlot.x,
      homeY: targetSlot.y,
      movable: false,
      faceUp: true,
      placed: true,
      placedSlotId: action.slotId,
      columnId: null,
      location: 'slot',
      zIndex: 500 + targetSlot.matchedCardIds.length + index,
    };
  });

  return {
    ...state,
    movesLeft: Math.max(state.movesLeft - 1, 0),
    slots: nextSlots,
    columns: nextColumns,
    cards: nextCards,
  };
}

  case 'MOVE_CARD_TO_COLUMN': {
  const card = state.cards[action.cardId];
  const targetColumn = state.columns.find(c => c.id === action.columnId);

  if (!card || !targetColumn) return state;
  if (!card.faceUp || card.placed) return state;
  if (card.columnId === targetColumn.id) return state;

 if (action.targetCardId) {
  const targetCard = state.cards[action.targetCardId];
  if (!targetCard) return state;

  if (targetCard.cardType !== 'item') {
    return state;
  }

  if (card.categoryId !== targetCard.categoryId) {
    return state;
  }
}

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({ ...c }));
  const nextWasteIds = [...state.wasteIds];

  if (card.location === 'waste') {
    removeFromWaste(nextWasteIds, card.id);
    syncWastePile(nextCards, nextWasteIds);
  }

  if (card.columnId) {
    const originColumn = nextColumns.find(c => c.id === card.columnId);
    if (originColumn) {
      originColumn.cardIds = originColumn.cardIds.filter(id => id !== card.id);
      revealTopCardAfterRemoval(nextCards, nextColumns, originColumn.id);
      reflowVisibleColumnCards(nextCards, originColumn);
    }
  }

  const target = nextColumns.find(c => c.id === targetColumn.id);
  if (!target) return state;

  target.cardIds = [...target.cardIds, card.id];

  nextCards[action.cardId] = {
    ...card,
    columnId: target.id,
    location: 'column',
    faceUp: true,
    placed: false,
    placedSlotId: null,
  };

  reflowVisibleColumnCards(nextCards, target);

  return {
    ...state,
    movesLeft: Math.max(state.movesLeft - 1, 0),
    columns: nextColumns,
    wasteIds: nextWasteIds,
    cards: nextCards,
  };
}

 case 'MOVE_PILE_TO_COLUMN': {
  const firstCard = state.cards[action.cardIds[0]];
  const targetColumn = state.columns.find(c => c.id === action.columnId);

  if (!firstCard || !targetColumn) return state;
  if (!firstCard.faceUp || firstCard.placed) return state;
  if (firstCard.cardType !== 'item') return state;

 if (action.targetCardId) {
  const targetCard = state.cards[action.targetCardId];
  if (!targetCard) return state;

  const targetCategoryId = targetCard.placedSlotId
    ? state.slots.find(s => s.id === targetCard.placedSlotId)?.categoryId
    : targetCard.categoryId;

  if (
    targetCard.cardType !== 'item' ||
    !targetCategoryId ||
    firstCard.categoryId !== targetCategoryId
  ) {
    return state;
  }
 }

  if (firstCard.columnId === targetColumn.id) return state;

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({ ...c }));

  if (firstCard.columnId) {
    const originColumn = nextColumns.find(c => c.id === firstCard.columnId);
    if (originColumn) {
      removeCardsFromColumn(nextColumns, firstCard.columnId, action.cardIds);
      revealTopCardAfterRemoval(nextCards, nextColumns, firstCard.columnId);
      reflowVisibleColumnCards(nextCards, originColumn);
    }
  }

  const target = nextColumns.find(c => c.id === targetColumn.id);
  if (!target) return state;

  target.cardIds = [...target.cardIds, ...action.cardIds];

  action.cardIds.forEach(cardId => {
    const card = nextCards[cardId];
    if (!card) return;

    nextCards[cardId] = {
      ...card,
      columnId: target.id,
      location: 'column',
      faceUp: true,
      placed: false,
      placedSlotId: null,
    };
  });

  reflowVisibleColumnCards(nextCards, target);

  return {
    ...state,
    movesLeft: Math.max(state.movesLeft - 1, 0),
    columns: nextColumns,
    cards: nextCards,
  };
 }

    case 'RESET_LEVEL':
      return action.nextState;


      case 'FINALIZE_SLOT_COMPLETION': {
  const slot = state.slots.find(s => s.id === action.slotId);
  if (!slot) return state;

  const nextCards = { ...state.cards };
  const nextSlots = state.slots.map(s => ({ ...s }));

  const slotIndex = nextSlots.findIndex(s => s.id === action.slotId);
  if (slotIndex === -1) return state;

  const completedSlot = nextSlots[slotIndex];

  if (completedSlot.cardId) {
  delete nextCards[completedSlot.cardId];
}

completedSlot.matchedCardIds.forEach(cardId => {
  delete nextCards[cardId];
});

  nextSlots[slotIndex] = {
  ...completedSlot,
  matchedCardIds: [],
  cardId: null,
  categoryId: null,
  categoryTitle: null,
  isCompleting: false,
  isCompleted: false,
};

  return {
    ...state,
    slots: nextSlots,
    cards: nextCards,
  };
}

case 'RESTOCK_STOCK': {
  if (state.stockIds.length > 0) return state;
  if (state.wasteIds.length === 0) return state;

  const nextCards = { ...state.cards };
  const nextStockIds = [...state.wasteIds];

  restockWasteToStock(nextCards, nextStockIds);

  return {
    ...state,
    stockCount: nextStockIds.length,
    movesLeft: Math.max(state.movesLeft - 1, 0),
    stockIds: nextStockIds,
    wasteIds: [],
    cards: nextCards,
  };
}

case 'USE_HINT': {
  if (state.hintsLeft <= 0) return state;

  return {
    ...state,
    hintsLeft: state.hintsLeft - 1,
  };
}

    default:
      return state;
  }
  
}

