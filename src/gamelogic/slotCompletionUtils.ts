import type { LevelData } from '../data/solitaireLevel';
import type { SlotState } from './solitaireTypes';

export type CategoryCardTotals = Record<string, number>;


export function buildCategoryCardTotals(levelData: LevelData): CategoryCardTotals {
  const totals: CategoryCardTotals = {};

  levelData.categories.forEach(category => {
    totals[category.id] = category.items.length;
  });

  return totals;
}


export function getSlotPlacedCount(slot: SlotState): number {
  return slot.matchedCardIds.length;
}


export function isSlotComplete(
  slot: SlotState,
  categoryCardTotals: CategoryCardTotals
): boolean {
  if (!slot.categoryId) return false;

  const requiredCount = categoryCardTotals[slot.categoryId];
  if (!requiredCount) return false;

  return slot.matchedCardIds.length >= requiredCount;
}


export function shouldPlaySlotCompletionAnimation(
  slot: SlotState,
  categoryCardTotals: CategoryCardTotals
): boolean {
  return isSlotComplete(slot, categoryCardTotals);
}