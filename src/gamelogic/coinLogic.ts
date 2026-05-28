export const COINS_PER_REMAINING_MOVE = 2;

export function getRemainingMoveCoinReward(movesLeft: number): number {
  return Math.max(0, movesLeft) * COINS_PER_REMAINING_MOVE;
}