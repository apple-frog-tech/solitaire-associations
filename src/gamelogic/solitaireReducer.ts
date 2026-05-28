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
  | { type: 'USE_HINT' }
  | { type: 'ADD_HINT'; amount?: number }
  | { type: 'RESTORE_STATE'; state: GameState }
  | { type: 'PLACE_MASTER_CARD'; targetCardId: string }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'SPEND_COINS'; amount: number };

  function insertAfterCard(
  cardIds: string[],
  targetCardId: string,
  newCardId: string,
) {
  const index = cardIds.indexOf(targetCardId);
  if (index === -1) {
    cardIds.push(newCardId);
    return;
  }

  cardIds.splice(index + 1, 0, newCardId);
}

function isTargetOnMasterTop(
  column: {
    masterTopCardIds: string[];
  },
  targetCardId: string | undefined,
) {
  return !!targetCardId && column.masterTopCardIds.includes(targetCardId);
}

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

function clearMasterFromColumn(
  nextCards: GameState['cards'],
  column: {
    masterCardId: string | null;
    masterAnchorCardId: string | null;
    masterTopCardIds: string[];
    cardIds: string[];
  },
) {
  if (column.masterCardId) {
    delete nextCards[column.masterCardId];
  }

  // unlock the underlying column again
  column.cardIds.forEach(cardId => {
    const card = nextCards[cardId];
    if (!card) return;

    nextCards[cardId] = {
      ...card,
      lockedByMaster: false,
    };
  });

  column.masterCardId = null;
  column.masterAnchorCardId = null;
  column.masterTopCardIds = [];
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

function reflowMasterTopCards(
  nextCards: GameState['cards'],
  column: {
    id: string;
    x: number;
    y: number;
    cardIds: string[];
    masterTopCardIds: string[];
    masterCardId: string | null;
  }
) {
  if (!column.masterCardId) return;

  const masterCard = nextCards[column.masterCardId];
  if (!masterCard) return;

  column.masterTopCardIds.forEach((cardId, index) => {
    const card = nextCards[cardId];
    if (!card) return;

    const newY = masterCard.y + BOARD.stackOffsetY * (index + 1);

    nextCards[cardId] = {
      ...card,
      x: masterCard.x,
      y: newY,
      homeX: masterCard.x,
      homeY: newY,
      faceUp: true,
      movable: index === column.masterTopCardIds.length - 1,
      location: 'column',
      zIndex: masterCard.zIndex + 1 + index,
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

  if (targetSlot.categoryId === null) {
  if (card.cardType !== 'category') return state;

  targetSlot.categoryId = card.categoryId;
  targetSlot.categoryTitle = card.categoryTitle;
  targetSlot.cardId = card.id;

  targetSlot.matchedCardIds = [];
}
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
    if (bottomCard.cardType !== 'item') return state;
    if (bottomCard.categoryId !== targetSlot.categoryId) return state;
  }

  if (bottomCard.columnId) {
    removeCardsFromColumn(nextColumns, bottomCard.columnId, action.cardIds);
    revealTopCardAfterRemoval(nextCards, nextColumns, bottomCard.columnId);
  }

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

  
  

  if (card.columnId === targetColumn.id) {
    const targetCard = action.targetCardId
      ? state.cards[action.targetCardId]
      : null;

    if (!targetCard?.isMaster) {
      return state;
    }
  }

  if (action.targetCardId) {
    const targetCard = state.cards[action.targetCardId];
    if (!targetCard) return state;

    if (!targetCard.isMaster) {
      if (targetCard.cardType !== 'item') {
        return state;
      }

      if (card.categoryId !== targetCard.categoryId) {
        return state;
      }
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
      const isFromMasterTop =
        !!originColumn.masterCardId &&
        originColumn.masterTopCardIds.includes(card.id);

     if (isFromMasterTop) {
  originColumn.masterTopCardIds = originColumn.masterTopCardIds.filter(
    id => id !== card.id,
  );

  if (originColumn.masterTopCardIds.length === 0) {
    clearMasterFromColumn(nextCards, originColumn);
    reflowVisibleColumnCards(nextCards, originColumn);
  } else {
    reflowMasterTopCards(nextCards, originColumn);
  }
} else {
  originColumn.cardIds = originColumn.cardIds.filter(id => id !== card.id);
  revealTopCardAfterRemoval(nextCards, nextColumns, originColumn.id);
  reflowVisibleColumnCards(nextCards, originColumn);
}
    }
  }

  const target = nextColumns.find(c => c.id === targetColumn.id);
  if (!target) return state;

  const targetCard = action.targetCardId ? nextCards[action.targetCardId] : null;
  const targetIsMasterTop = isTargetOnMasterTop(target, action.targetCardId);

  if (targetCard?.isMaster) {
    target.masterTopCardIds = [...target.masterTopCardIds, card.id];
  } else if (targetIsMasterTop && action.targetCardId) {
    insertAfterCard(target.masterTopCardIds, action.targetCardId, card.id);
  } else if (action.targetCardId) {
    insertAfterCard(target.cardIds, action.targetCardId, card.id);
  } else {
    target.cardIds.push(card.id);
  }

  nextCards[action.cardId] = {
    ...card,
    columnId: target.id,
    location: 'column',
    faceUp: true,
    placed: false,
    placedSlotId: null,
  };

  if (targetCard?.isMaster || targetIsMasterTop) {
    reflowMasterTopCards(nextCards, target);
  } else {
    reflowVisibleColumnCards(nextCards, target);
  }

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

    if (!targetCard.isMaster) {
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
  }

  if (firstCard.columnId === targetColumn.id) {
    const targetCard = action.targetCardId
      ? state.cards[action.targetCardId]
      : null;

    if (!targetCard?.isMaster) {
      return state;
    }
  }

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({ ...c }));

  if (firstCard.columnId) {
    const originColumn = nextColumns.find(c => c.id === firstCard.columnId);
    if (originColumn) {
      const movingFromMasterTop =
        !!originColumn.masterCardId &&
        action.cardIds.every(id => originColumn.masterTopCardIds.includes(id));

     if (movingFromMasterTop) {
  originColumn.masterTopCardIds = originColumn.masterTopCardIds.filter(
    id => !action.cardIds.includes(id),
  );

  if (originColumn.masterTopCardIds.length === 0) {
    clearMasterFromColumn(nextCards, originColumn);
    reflowVisibleColumnCards(nextCards, originColumn);
  } else {
    reflowMasterTopCards(nextCards, originColumn);
  }
} else {
  removeCardsFromColumn(nextColumns, firstCard.columnId, action.cardIds);
  revealTopCardAfterRemoval(nextCards, nextColumns, firstCard.columnId);
  reflowVisibleColumnCards(nextCards, originColumn);
}
    }
  }

  const target = nextColumns.find(c => c.id === targetColumn.id);
  if (!target) return state;

  const targetCard = action.targetCardId ? nextCards[action.targetCardId] : null;
  const targetIsMasterTop = isTargetOnMasterTop(target, action.targetCardId);

  if (targetCard?.isMaster) {
    target.masterTopCardIds = [...target.masterTopCardIds, ...action.cardIds];
  } else if (targetIsMasterTop && action.targetCardId) {
    const targetIndex = target.masterTopCardIds.indexOf(action.targetCardId);
    if (targetIndex >= 0) {
      target.masterTopCardIds.splice(targetIndex + 1, 0, ...action.cardIds);
    } else {
      target.masterTopCardIds.push(...action.cardIds);
    }
  } else if (action.targetCardId) {
    const targetIndex = target.cardIds.indexOf(action.targetCardId);
    if (targetIndex >= 0) {
      target.cardIds.splice(targetIndex + 1, 0, ...action.cardIds);
    } else {
      target.cardIds.push(...action.cardIds);
    }
  } else {
    target.cardIds.push(...action.cardIds);
  }

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

  if (targetCard?.isMaster || targetIsMasterTop) {
    reflowMasterTopCards(nextCards, target);
  } else {
    reflowVisibleColumnCards(nextCards, target);
  }

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

case 'ADD_HINT': {
  return {
    ...state,
    hintsLeft: state.hintsLeft + (action.amount ?? 1),
  };
}

case 'RESTORE_STATE':
  return action.state;


 case 'PLACE_MASTER_CARD': {
  const targetCard = state.cards[action.targetCardId];
  if (!targetCard) return state;
  if (targetCard.location !== 'column') return state;
  if (targetCard.isMaster) return state;

  const targetColumn = state.columns.find(c => c.id === targetCard.columnId);
  if (!targetColumn) return state;
  if (targetColumn.masterCardId) return state;

  const nextCards = { ...state.cards };
  const nextColumns = state.columns.map(c => ({
    ...c,
    cardIds: [...c.cardIds],
    masterTopCardIds: [...c.masterTopCardIds],
  }));

  const column = nextColumns.find(c => c.id === targetColumn.id);
  if (!column) return state;

  const anchorIndex = column.cardIds.indexOf(targetCard.id);
  if (anchorIndex === -1) return state;

  const masterId = `master-${Date.now()}`;

  const masterX = targetCard.x;
  const masterY = targetCard.y + BOARD.stackOffsetY;

  nextCards[masterId] = {
  id: masterId,
  label: 'MASTER',
  anchorLabel: targetCard.label,
  cardType: 'item',
  categoryId: targetCard.categoryId,
  categoryTitle: targetCard.categoryTitle,
  x: masterX,
  y: masterY,
  width: targetCard.width,
  height: targetCard.height,
  homeX: masterX,
  homeY: masterY,
  movable: false,
  faceUp: true,
  placed: false,
  placedSlotId: null,
  columnId: column.id,
  location: 'column',
  zIndex: targetCard.zIndex + 1,
  isMaster: true,
};

  const lowerStack = column.cardIds.slice(0, anchorIndex + 1);
  lowerStack.forEach(cardId => {
  const lowerCard = nextCards[cardId];
  if (!lowerCard) return;

  nextCards[cardId] = {
    ...lowerCard,
    movable: false,
    lockedByMaster: true,
  };
});
  const topStack = column.cardIds.slice(anchorIndex + 1);

  column.cardIds = lowerStack;
  column.masterCardId = masterId;
  column.masterAnchorCardId = targetCard.id;
  column.masterTopCardIds = topStack;

  reflowMasterTopCards(nextCards, column);

  return {
    ...state,
    cards: nextCards,
    columns: nextColumns,
  };
}

case 'ADD_COINS': {
  return {
    ...state,
    coins: state.coins + action.amount,
  };
}

case 'SPEND_COINS': {
  if (state.coins < action.amount) return state;

  return {
    ...state,
    coins: state.coins - action.amount,
  };
}

    default:
      return state;
  }
  
}

