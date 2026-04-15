import type { LevelData } from '../data/solitaireLevel';

type MoveOptions = {
  startingFaceUpCards?: number;
  difficultyMultiplier?: number;
};

export function calculateInitialMoves(
  levelData: LevelData,
  options: MoveOptions = {}
): number {
  const startingFaceUpCards = options.startingFaceUpCards ?? 4;
  const difficultyMultiplier = options.difficultyMultiplier ?? 1;

  const categoryCount = levelData.categories.length;
  const itemCount = levelData.categories.reduce(
    (sum, category) => sum + category.items.length,
    0
  );

  const totalCards = categoryCount + itemCount;
  const hiddenCards = Math.max(0, totalCards - startingFaceUpCards);

  const averageItemsPerCategory =
    categoryCount > 0 ? itemCount / categoryCount : 0;

  const estimatedSolveMoves =
    hiddenCards * 0.7 +
    categoryCount * 1.2 +
    averageItemsPerCategory * 0.8;

  const movesWithBuffer = estimatedSolveMoves * difficultyMultiplier + 2;

  return Math.max(12, Math.ceil(movesWithBuffer));
}