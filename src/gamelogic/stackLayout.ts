import { BOARD } from './boardConfig';

export const STACK_OFFSET_Y = BOARD.stackOffsetY;

export function getStackCardPosition(baseX: number, baseY: number, index: number) {
  return {
    x: baseX,
    y: baseY + index * STACK_OFFSET_Y,
  };
}