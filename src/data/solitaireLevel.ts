// src/data/solitaireLevel.ts

export type CardData = {
  id: string;
  title: string;
  faceUp: boolean;
};

export type ColumnData = {
  id: string;
  hiddenCount: number;
  cards: CardData[];
};

export type SlotData = {
  id: string;
  card: CardData | null;
};

export type LevelCategory = {
  id: string;
  title: string;
  items: string[];
};

export const LEVEL_1 = {
  level: 1,
  categories: [
    { id: 'a', title: 'A', items: ['A1', 'A2', 'A3', 'A4'] },
    { id: 'b', title: 'B', items: ['B1', 'B2', 'B3', 'B4'] },
    { id: 'c', title: 'C', items: ['C1', 'C2', 'C3', 'C4'] },
    { id: 'd', title: 'D', items: ['D1', 'D2', 'D3', 'D4', 'D5'] },
    { id: 'e', title: 'E', items: ['E1', 'E2', 'E3', 'E4'] },
  ],
};

export type LevelData = typeof LEVEL_1;