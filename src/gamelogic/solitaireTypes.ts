export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SlotState = Rect & {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cardId: string | null;
  categoryId: string | null;
  categoryTitle: string | null;
  matchedCardIds: string[];
  isCompleting?: boolean;
  isCompleted?: boolean;
};

export type CardState = Rect & {
  id: string;
  label: string;
  categoryId: string;
  categoryTitle: string;
  cardType: 'category' | 'item';
  homeX: number;
  homeY: number;
  movable: boolean;
  faceUp: boolean;
  placed: boolean;
  placedSlotId: string | null;
  columnId: string | null;
  location: 'stock' | 'waste' | 'column' | 'slot';
  zIndex: number;
  isMaster?: boolean;
  anchorLabel?: string;
  lockedByMaster?: boolean;
};

export type ColumnState = Rect & {
  id: string;
  cardIds: string[];
  masterCardId: string | null;
masterAnchorCardId: string | null;
masterTopCardIds: string[];
};

export type GameState = {
  level: number;
  movesLeft: number;
  stockCount: number;
  stockIds: string[];
  wasteIds: string[];
  slots: SlotState[];
  columns: ColumnState[];
  cards: Record<string, CardState>;
  categoryCardTotals: Record<string, number>;
  hintsLeft: number;
  coins: number;
};

export type BoardLayout = {
  slots: SlotState[];
  columns: ColumnState[];
  cards: Record<string, CardState>;
};

export type DropResult = {
  accepted: boolean;
  targetX: number;
  targetY: number;
  targetSlotId: string | null;
};