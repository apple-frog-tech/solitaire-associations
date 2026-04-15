import { BoardLayout, CardState, ColumnState, SlotState } from './solitaireTypes';
import type { LevelData } from '../data/solitaireLevel';

export const BOARD = {
  paddingX: 14,
  foundationTop: 70,
  tableauTop: 190,
  // 330 - 210 = 120
  // 200 - 80 = 120
  slotWidth: 85,
  slotHeight: 112,
  cardWidth: 85,
  cardHeight: 112,
  hiddenOffsetY: 14,
  deckWidth: 90,
  deckAreaWidth: 260,
  wasteGap: 8,
  wasteOverlapX: 22,
  stackOffsetY: 30,
};

// const VISIBLE_TABLEAU_CARDS = 4;
// const HIDDEN_TABLEAU_CARDS = 12;
const TABLEAU_COLUMN_COUNT = 4;
const VISIBLE_TABLEAU_CARDS = 4;

// This gives the classic 1, 2, 4, 5 feel for a 25-card level.
const BASE_HIDDEN_COUNTS = [1, 2, 4, 5];
const BASE_TOTAL_HIDDEN = BASE_HIDDEN_COUNTS.reduce((sum, n) => sum + n, 0); // 12

function getTargetHiddenTotal(totalCards: number) {
  const baseHidden = BASE_TOTAL_HIDDEN;

  // For your current 25-card level, this stays exactly 12 hidden cards.
  if (totalCards <= 25) {
    return Math.min(baseHidden, Math.max(0, totalCards - VISIBLE_TABLEAU_CARDS));
  }

  // For bigger levels, hidden cards grow slowly.
  // You can tweak 0.4 later if you want faster/slower growth.
  const extraCards = totalCards - 25;
  const extraHidden = Math.ceil(extraCards * 0.4);

  return Math.min(
    Math.max(0, totalCards - VISIBLE_TABLEAU_CARDS),
    baseHidden + extraHidden
  );
}

function buildHiddenCardCounts(totalHiddenCards: number) {
  const weights = BASE_HIDDEN_COUNTS;
  const weightSum = weights.reduce((sum, n) => sum + n, 0);

  const raw = weights.map(w => (totalHiddenCards * w) / weightSum);
  const counts = raw.map(n => Math.floor(n));

  let remaining = totalHiddenCards - counts.reduce((sum, n) => sum + n, 0);

  const fractions = raw
    .map((value, index) => ({
      index,
      fraction: value - counts[index],
    }))
    .sort((a, b) => b.fraction - a.fraction);

  let i = 0;
  while (remaining > 0) {
    counts[fractions[i % fractions.length].index] += 1;
    remaining -= 1;
    i += 1;
  }

  return counts;
}

function shuffleArray<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildEvenXPositions(contentWidth: number, itemWidth: number, count: number) {
  const usable = contentWidth - BOARD.paddingX * 2;
  const gap = count > 1 ? Math.max(16, (usable - itemWidth * count) / (count - 1)) : 0;
  const startX = BOARD.paddingX - 2;

  return Array.from({ length: count }, (_, i) => startX + i * (itemWidth + gap));
}

export function getWasteHomePosition(index: number) {
  const deckX = BOARD.deckAreaWidth - BOARD.deckWidth;
  return {
    x: deckX - BOARD.cardWidth - BOARD.wasteGap - index * BOARD.wasteOverlapX,
    y: 0,
  };
}

export function buildBoardLayout(contentWidth: number): Omit<BoardLayout, 'cards'> {
  const slotXs = buildEvenXPositions(contentWidth, BOARD.slotWidth, 4);
  const columnXs = buildEvenXPositions(contentWidth, BOARD.cardWidth, 4);

const slots: SlotState[] = slotXs.map((x, index) => ({
  id: `slot-${index + 1}`,
  x,
  y: BOARD.foundationTop,
  width: BOARD.slotWidth,
  height: BOARD.slotHeight,
  cardId: null,
  categoryId: null,
  categoryTitle: null,
  matchedCardIds: [],
}));

  const columns: ColumnState[] = columnXs.map((x, index) => ({
    id: `col-${index + 1}`,
    x,
    y: BOARD.tableauTop,
    width: BOARD.cardWidth,
    height: BOARD.cardHeight,
    cardIds: [],
  }));

  return { slots, columns };
}

type FlatLevelCard = {
  id: string;
  label: string;
  categoryId: string;
  categoryTitle: string;
  cardType: 'category' | 'item';
};

function flattenLevelCards(levelData: LevelData): FlatLevelCard[] {
  return levelData.categories.flatMap((category): FlatLevelCard[] => [
    {
      id: `${category.id}-category`,
      label: category.title,
      categoryId: category.id,
      categoryTitle: category.title,
      cardType: 'category',
    },
    ...category.items.map((item): FlatLevelCard => ({
      id: `${category.id}-${item}`,
      label: item,
      categoryId: category.id,
      categoryTitle: category.title,
      cardType: 'item',
    })),
  ]);
}

export function createInitialBoardData(screenWidth: number, levelData: LevelData): BoardLayout & {
  stockIds: string[];
} {
  const layout = buildBoardLayout(screenWidth);
  const cards: Record<string, CardState> = {};

  const allCards = shuffleArray(flattenLevelCards(levelData));

const visibleCards = allCards.slice(0, Math.min(VISIBLE_TABLEAU_CARDS, allCards.length));

const totalHiddenCards = getTargetHiddenTotal(allCards.length);
const hiddenCards = allCards.slice(
  visibleCards.length,
  visibleCards.length + totalHiddenCards
);
const stockCards = allCards.slice(visibleCards.length + hiddenCards.length);

const hiddenCountPerColumn = buildHiddenCardCounts(hiddenCards.length);

const columnBuckets = Array.from({ length: TABLEAU_COLUMN_COUNT }, () => ({
  hidden: [] as FlatLevelCard[],
  visible: null as FlatLevelCard | null,
}));

let hiddenCursor = 0;

hiddenCountPerColumn.forEach((count, columnIndex) => {
  for (let i = 0; i < count; i++) {
    const item = hiddenCards[hiddenCursor++];
    if (item) {
      columnBuckets[columnIndex].hidden.push(item);
    }
  }
});

  visibleCards.forEach((item, index) => {
    columnBuckets[index].visible = item;
  });

  const columns: ColumnState[] = layout.columns.map((col, colIndex) => {
    const bucket = columnBuckets[colIndex];
    const cardIds: string[] = [];

    bucket.hidden.forEach((item, hiddenIndex) => {
      const id = `${col.id}-hidden-${hiddenIndex + 1}`;
      const x = col.x;
      const y = col.y + hiddenIndex * BOARD.hiddenOffsetY;

      cards[id] = {
  id,
  label: item.label,
  categoryId: item.categoryId,
  categoryTitle: item.categoryTitle,
  cardType: item.cardType,
  x,
  y,
  width: BOARD.cardWidth,
  height: BOARD.cardHeight,
  homeX: x,
  homeY: y,
  movable: false,
  faceUp: false,
  placed: false,
  placedSlotId: null,
  columnId: col.id,
  location: 'column',
  zIndex: 10 + hiddenIndex,
};

      cardIds.push(id);
    });

    const visibleItem = bucket.visible;
    if (visibleItem) {
      const visibleIndex = bucket.hidden.length;
      const id = `${col.id}-visible`;
      const x = col.x;
      const y = col.y + visibleIndex * BOARD.hiddenOffsetY;

      cards[id] = {
  id,
  label: visibleItem.label,
  categoryId: visibleItem.categoryId,
  categoryTitle: visibleItem.categoryTitle,
  cardType: visibleItem.cardType,
  x,
  y,
  width: BOARD.cardWidth,
  height: BOARD.cardHeight,
  homeX: x,
  homeY: y,
  movable: true,
  faceUp: true,
  placed: false,
  placedSlotId: null,
  columnId: col.id,
  location: 'column',
  zIndex: 100 + visibleIndex,
};

      cardIds.push(id);
    }

    return {
      ...col,
      cardIds,
    };
  });

  const stockIds: string[] = [];

  stockCards.forEach((item, index) => {
    const id = `stock-${index + 1}`;

    cards[id] = {
  id,
  label: item.label,
  categoryId: item.categoryId,
  categoryTitle: item.categoryTitle,
  cardType: item.cardType,
  x: 0,
  y: 0,
  width: BOARD.cardWidth,
  height: BOARD.cardHeight,
  homeX: 0,
  homeY: 0,
  movable: false,
  faceUp: false,
  placed: false,
  placedSlotId: null,
  columnId: null,
  location: 'stock',
  zIndex: 1,
};

    stockIds.push(id);
  });

  return {
    slots: layout.slots,
    columns,
    cards,
    stockIds,
  };
}

export function isPointInsideRect(
  px: number,
  py: number,
  rect: { x: number; y: number; width: number; height: number }
) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}