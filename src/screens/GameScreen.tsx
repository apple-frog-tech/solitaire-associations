import React, { useMemo, useReducer, useState, useRef, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BOARD,
  createInitialBoardData,
  isPointInsideRect,
} from '../gamelogic/boardConfig';
import { solitaireReducer } from '../gamelogic/solitaireReducer';
import type {
  DropResult,
  GameState,
  CardState,
} from '../gamelogic/solitaireTypes';
import DraggableCard from '../components/DraggableCard';
import DraggablePile from '../components/DraggablePile';
import { LEVEL_1 } from '../data/solitaireLevel';
import { buildCategoryCardTotals } from '../gamelogic/slotCompletionUtils';
import SlotCompletionZoomOut from '../components/SlotCompletionZoomOut';
import BottomActions from '../components/BottomActions';
import SlotPlaceholder from '../components/SlotPlaceholder';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';
import { calculateInitialMoves } from '../gamelogic/movesLogic';
import HintButton from '../components/HintButton';
import HintFlyAnimation from '../components/HintFlyAnimation';
import { getHintMove } from '../gamelogic/hintUtils';
import PileHintAnimation from '../components/PileHintAnimation';
import UndoMoveAnimation from '../components/UndoMoveAnimation';
import MasterCard from '../components/MasterCard';
import StackedCardUI from '../components/StackedCardUI';
import MasterCardBreakAnimation from '../components/MasterCardBreakAnimation';
import TopHeader from '../components/TopHeader';
import { getRemainingMoveCoinReward } from '../gamelogic/coinLogic';
import CoinReward from '../components/CoinReward';
import LevelCompleteScreen from './LevelCompleteScreen';
import BottomBannerAd from '../components/BottomBannerAd';
import { showRewardedIfReady } from '../ads/adService';
import SettingsPopup from '../components/SettingsPopup';
import { useAppSettings } from '../context/AppSettingsContext';

function createInitialState(screenWidth: number): GameState {
  const board = createInitialBoardData(screenWidth, LEVEL_1);
  const movesLeft = calculateInitialMoves(LEVEL_1, {
    startingFaceUpCards: 4,
    difficultyMultiplier: 1.25,
  });

  return {
    level: LEVEL_1.level,
    movesLeft,
    stockCount: board.stockIds.length,
    stockIds: board.stockIds,
    wasteIds: [],
    slots: board.slots,
    columns: board.columns,
    cards: board.cards,
    categoryCardTotals: buildCategoryCardTotals(LEVEL_1),
    hintsLeft: 3,
    coins: 0,
  };
}

type HintOverlayState = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cardId: string;
  stackCardIds: string[];
  animationKey: number;
};

type UndoRecord = {
  previousState: GameState;
  animationKey: number;
  cardIds: string[];
  originX: number;
  originY: number;
};

type UndoOverlayState = {
  previousState: GameState;
  animationKey: number;
  cardIds: string[];
  originX: number;
  originY: number;
  x: number;
  y: number;
  cards: {
    id: string;
    label: string;
    cardType: 'category' | 'item';
    width: number;
    height: number;
    x: number;
    y: number;
  }[];
};

type MasterBreakOverlayState = {
  x: number;
  y: number;
  width: number;
  height: number;
  animationKey: number;
};

type Props = {
  onRequestNextLevel?: () => void;
  onRequestHome?: () => void;
};

export default function GameScreen({ onRequestNextLevel, onRequestHome  }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width - BOARD.paddingX * 2;
  const initialState = useMemo(
    () => createInitialState(contentWidth),
    [contentWidth],
  );
  const [state, dispatch] = useReducer(solitaireReducer, initialState);
  const [hintOverlay, setHintOverlay] = useState<HintOverlayState | null>(null);

  const [deckHintActive, setDeckHintActive] = useState(false);
const [deckHintKey, setDeckHintKey] = useState(0);

const [undoOverlay, setUndoOverlay] = useState<UndoOverlayState | null>(null);
const [masterLeft, setMasterLeft] = useState(1);
const [masterPlacementMode, setMasterPlacementMode] = useState(false);
const undoRef = useRef<UndoRecord | null>(null);
const [undoLeft, setUndoLeft] = useState(1);
const levelBonusGrantedRef = useRef(false);
const [showLevelComplete, setShowLevelComplete] = useState(false);
const [levelRewardCoins, setLevelRewardCoins] = useState(0);
const { soundEnabled, setSoundEnabled } = useAppSettings();
const [showSettings, setShowSettings] = useState(false);

const [movesLayout, setMovesLayout] = useState({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});

const [rewardBurst, setRewardBurst] = useState<{
  animationKey: number;
  count: number;
  x: number;
  y: number;
} | null>(null);

const [rewardMovesDisplay, setRewardMovesDisplay] = useState<number | null>(null);
const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

const [masterBreakOverlay, setMasterBreakOverlay] =
  useState<MasterBreakOverlayState | null>(null);

  const [deckLayout, setDeckLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [boardLayout, setBoardLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const toAbsoluteUndoCard = (card: CardState) => {
  const base = card.location === 'waste' ? deckLayout : boardLayout;

  return {
    id: card.id,
    label: card.label,
    cardType: card.cardType,
    width: card.width,
    height: card.height,
    x: base.x + card.x,
    y: base.y + card.y,
  };
};

  const DROP_TOLERANCE = 14;
  const REWARD_STEP_MS = 420;
  const UNDO_COST = 50;
  const canBuyUndo = state.coins >= UNDO_COST;

  const grantRewardedHint = () => {
  setHintOverlay(null);
  setDeckHintActive(false);

  showRewardedIfReady(() => {
    dispatch({ type: 'ADD_HINT', amount: 1 });
  });
};

const grantRewardedMaster = () => {
  setHintOverlay(null);
  setDeckHintActive(false);
  setMasterPlacementMode(false);

  showRewardedIfReady(() => {
    setMasterLeft(prev => prev + 1);
  });
};

  const handleRewardDone = React.useCallback(() => {
  setRewardBurst(null);
}, []);

  const getCardLayoutRect = (card: CardState) => {
    const base = card.location === 'waste' ? deckLayout : boardLayout;

    return {
      x: base.x + card.x,
      y: base.y + card.y,
      width: card.width,
      height: card.height,
    };
  };

  const getSlotLayoutRect = (slotId: string) => {
    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) return null;

    return {
      x: boardLayout.x + slot.x,
      y: boardLayout.y + slot.y,
      width: slot.width,
      height: slot.height,
    };
  };

  const cloneState = (value: GameState): GameState =>
  JSON.parse(JSON.stringify(value)) as GameState;

  const findEmptyColumnAtPoint = (
    centerWindowX: number,
    centerWindowY: number,
  ) => {
    return (
      state.columns.find(column => {
        const isEmpty = column.cardIds.every(cardId => {
          const card = state.cards[cardId];
          return !card || !card.faceUp;
        });

        if (!isEmpty) return false;

        return isPointInsideRect(centerWindowX, centerWindowY, {
          x: boardLayout.x + column.x,
          y: boardLayout.y + column.y,
          width: column.width,
          height: column.height,
        });
      }) ?? null
    );
  };

  const restartLevel = () => {
  const nextState = createInitialState(contentWidth);
  nextState.coins = state.coins;

  dispatch({
    type: 'RESET_LEVEL',
    nextState,
  });

  setHintOverlay(null);
  setDeckHintActive(false);
  setUndoOverlay(null);
  setMasterBreakOverlay(null);
  setShowLevelComplete(false);
  setRewardBurst(null);
  setRewardMovesDisplay(null);
  setUndoLeft(1);
  setMasterLeft(1);
  setMasterPlacementMode(false);
  undoRef.current = null;
  levelBonusGrantedRef.current = false;
};

  const getDeckCenter = () => ({
  x: deckLayout.x + BOARD.deckAreaWidth - BOARD.deckWidth + BOARD.deckWidth / 2,
  y: deckLayout.y + BOARD.cardHeight / 2,
});

  const handleDeckPress = () => {
  if (state.stockIds.length > 0) {
    const drawnCardId = state.stockIds[state.stockIds.length - 1];
    const drawnCard = state.cards[drawnCardId];

    if (drawnCard) {
      const deckCenter = getDeckCenter();

      undoRef.current = {
        previousState: cloneState(state),
        animationKey: Date.now(),
        cardIds: [drawnCardId],
        originX: deckCenter.x,
        originY: deckCenter.y,
      };
    }

    dispatch({ type: 'DRAW_CARD' });
    return;
  }

  if (state.wasteIds.length > 0) {
    dispatch({ type: 'RESTOCK_STOCK' });
  }
};

  function isPointInsideExpandedRect(
  px: number,
  py: number,
  rect: { x: number; y: number; width: number; height: number },
  padding = DROP_TOLERANCE,
) {
  return (
    px >= rect.x - padding &&
    px <= rect.x + rect.width + padding &&
    py >= rect.y - padding &&
    py <= rect.y + rect.height + padding
  );
}

const findMasterCardAtPoint = (centerWindowX: number, centerWindowY: number) => {
  return (
    state.columns
      .map(column => (column.masterCardId ? state.cards[column.masterCardId] : null))
      .filter((card): card is CardState => !!card)
      .find(card =>
        isPointInsideExpandedRect(centerWindowX, centerWindowY, {
          x: boardLayout.x + card.x,
          y: boardLayout.y + card.y,
          width: card.width,
          height: card.height,
        }, 10),
      ) ?? null
  );
};

const getMasterDropPosition = (masterCard: CardState) => {
  const column = state.columns.find(c => c.id === masterCard.columnId);
  const topCount = column?.masterTopCardIds.length ?? 0;

  return {
    x: masterCard.x,
    y: masterCard.y + BOARD.stackOffsetY * (topCount + 1),
  };
};

const triggerMasterBreakIfNeeded = (
  cardIds: string[],
  sourceCard: CardState,
) => {
  if (!sourceCard.columnId) return;

  const sourceColumn = state.columns.find(c => c.id === sourceCard.columnId);
  if (!sourceColumn?.masterCardId) return;

  const movingFromMasterTop = cardIds.every(id =>
    sourceColumn.masterTopCardIds.includes(id),
  );

  if (!movingFromMasterTop) return;

  const masterCard = state.cards[sourceColumn.masterCardId];
  if (!masterCard) return;

  if (sourceColumn.masterTopCardIds.length !== cardIds.length) return;

  setMasterBreakOverlay({
    x: boardLayout.x + masterCard.x,
    y: boardLayout.y + masterCard.y,
    width: masterCard.width,
    height: masterCard.height,
    animationKey: Date.now(),
  });
};

const saveUndoForMove = (cardIds: string[], sourceCard: CardState) => {
  const sourceBase = sourceCard.location === 'waste' ? deckLayout : boardLayout;

  undoRef.current = {
    previousState: cloneState(state),
    animationKey: Date.now(),
    cardIds,
    originX: sourceBase.x + sourceCard.homeX + sourceCard.width / 2,
    originY: sourceBase.y + sourceCard.homeY + sourceCard.height / 2,
  };
};

const handleUndoPress = () => {
  if (undoOverlay) return;

  if (undoLeft <= 0) {
    if (!undoRef.current) return;
    if (!canBuyUndo) return;

    dispatch({ type: 'SPEND_COINS', amount: UNDO_COST });
    setUndoLeft(1);
    return;
  }

  const record = undoRef.current;
  if (!record) return;

  const movedCards = record.cardIds
    .map(id => state.cards[id])
    .filter((card): card is CardState => !!card)
    .map(toAbsoluteUndoCard);

  if (movedCards.length === 0) {
    dispatch({ type: 'RESTORE_STATE', state: record.previousState });
    undoRef.current = null;
    setUndoLeft(0);
    return;
  }

  dispatch({ type: 'RESTORE_STATE', state: record.previousState });
  undoRef.current = null;
  setUndoLeft(0);

  setUndoOverlay({
    ...record,
    cards: movedCards,
    x: record.originX,
    y: record.originY,
    animationKey: Date.now(),
  });
};


  const handleCardDrop = (
    cardId: string,
    finalX: number,
    finalY: number,
  ): DropResult => {
    const card = state.cards[cardId];

    if (!card) {
      return {
        accepted: false,
        targetX: finalX,
        targetY: finalY,
        targetSlotId: null,
      };
    }

    const isWasteCard = card.location === 'waste';

    const cardWindowX = isWasteCard
      ? deckLayout.x + finalX
      : boardLayout.x + finalX;
    const cardWindowY = isWasteCard
      ? deckLayout.y + finalY
      : boardLayout.y + finalY;

    const centerWindowX = cardWindowX + card.width / 2;
    const centerWindowY = cardWindowY + card.height / 2;

   const targetSlot = state.slots.find(slot =>
  isPointInsideExpandedRect(centerWindowX, centerWindowY, {
    x: boardLayout.x + slot.x,
    y: boardLayout.y + slot.y,
    width: slot.width,
    height: slot.height,
  }),
);

    if (targetSlot && targetSlot.isCompleting) {
      return {
        accepted: false,
        targetX: card.homeX,
        targetY: card.homeY,
        targetSlotId: null,
      };
    }

    if (targetSlot) {
      const slotIsEmpty = targetSlot.categoryId === null;

      const allowed =
        (slotIsEmpty && card.cardType === 'category') ||
        (!slotIsEmpty &&
          card.cardType === 'item' &&
          card.categoryId === targetSlot.categoryId);

      if (!allowed) {
        return {
          accepted: false,
          targetX: card.homeX,
          targetY: card.homeY,
          targetSlotId: null,
        };
      }

      setHintOverlay(null);
      saveUndoForMove([card.id], card);

      dispatch({ type: 'PLACE_CARD', cardId, slotId: targetSlot.id });

      return {
        accepted: true,
        targetX: finalX,
        targetY: finalY,
        targetSlotId: targetSlot.id,
      };
    }

   const masterTargetCard = findMasterCardAtPoint(centerWindowX, centerWindowY);

if (masterTargetCard?.isMaster) {
  if (card.columnId === masterTargetCard.columnId) {
    return {
      accepted: false,
      targetX: card.homeX,
      targetY: card.homeY,
      targetSlotId: null,
    };
  }

  const dropPos = getMasterDropPosition(masterTargetCard);

  setHintOverlay(null);
  saveUndoForMove([card.id], card);

  triggerMasterBreakIfNeeded([card.id], card);

  dispatch({
    type: 'MOVE_CARD_TO_COLUMN',
    cardId,
    columnId: masterTargetCard.columnId!,
    targetCardId: masterTargetCard.id,
  });

  return {
    accepted: true,
    targetX: dropPos.x,
    targetY: dropPos.y,
    targetSlotId: null,
  };
}

const targetCard = Object.values(state.cards)
  .filter(c => c.faceUp && c.id !== cardId)
  .sort((a, b) => b.zIndex - a.zIndex)
  .find(c =>
    isPointInsideExpandedRect(centerWindowX, centerWindowY, {
      x: boardLayout.x + c.x,
      y: boardLayout.y + c.y,
      width: c.width,
      height: c.height,
    }),
  );

if (targetCard) {
  if (targetCard.isMaster) {
    const allowed = card.categoryId === targetCard.categoryId;

    if (!allowed) {
      return {
        accepted: false,
        targetX: card.homeX,
        targetY: card.homeY,
        targetSlotId: null,
      };
    }

    setHintOverlay(null);
    saveUndoForMove([card.id], card);

    triggerMasterBreakIfNeeded([card.id], card);

    dispatch({
      type: 'MOVE_CARD_TO_COLUMN',
      cardId,
      columnId: targetCard.columnId!,
      targetCardId: targetCard.id,
    });

    return {
      accepted: true,
      targetX: finalX,
      targetY: finalY,
      targetSlotId: null,
    };
  }

  const targetCategoryId = targetCard.placedSlotId
    ? state.slots.find(s => s.id === targetCard.placedSlotId)?.categoryId
    : targetCard.categoryId;

  if (!targetCategoryId) {
    return {
      accepted: false,
      targetX: card.homeX,
      targetY: card.homeY,
      targetSlotId: null,
    };
  }

  const allowed =
    targetCard.cardType === 'item' && card.categoryId === targetCategoryId;

      if (!allowed) {
        return {
          accepted: false,
          targetX: card.homeX,
          targetY: card.homeY,
          targetSlotId: null,
        };
      }

      const targetSlotId = targetCard.placedSlotId ?? null;

      if (targetSlotId) {
        setHintOverlay(null);
        dispatch({
          type: 'PLACE_CARD',
          cardId,
          slotId: targetSlotId,
        });

        return {
          accepted: true,
          targetX: finalX,
          targetY: finalY,
          targetSlotId,
        };
      }

    if (targetCard.columnId) {
  setHintOverlay(null);
  saveUndoForMove([card.id], card);

  triggerMasterBreakIfNeeded([card.id], card);

  dispatch({
    type: 'MOVE_CARD_TO_COLUMN',
    cardId,
    columnId: targetCard.columnId,
    targetCardId: targetCard.id,
  });

        return {
          accepted: true,
          targetX: finalX,
          targetY: finalY,
          targetSlotId: null,
        };
      }
    }

    const emptyColumn = findEmptyColumnAtPoint(centerWindowX, centerWindowY);

    if (emptyColumn) {
      setHintOverlay(null);
      saveUndoForMove([card.id], card);
      triggerMasterBreakIfNeeded([card.id], card);
      dispatch({
        type: 'MOVE_CARD_TO_COLUMN',
        cardId,
        columnId: emptyColumn.id,
      });

      return {
        accepted: true,
        targetX: emptyColumn.x,
        targetY: emptyColumn.y,
        targetSlotId: null,
      };
    }

    return {
      accepted: false,
      targetX: card.homeX,
      targetY: card.homeY,
      targetSlotId: null,
    };
  };

 const handlePileDrop = (
  cardIds: string[],
  finalX: number,
  finalY: number,
): DropResult => {
  const leadCard = state.cards[cardIds[0]];

  if (!leadCard) {
    return {
      accepted: false,
      targetX: finalX,
      targetY: finalY,
      targetSlotId: null,
    };
  }

  const centerWindowX = boardLayout.x + finalX + leadCard.width / 2;
  const centerWindowY = boardLayout.y + finalY + leadCard.height / 2;

  const targetSlot = state.slots.find(slot =>
    isPointInsideExpandedRect(centerWindowX, centerWindowY, {
      x: boardLayout.x + slot.x,
      y: boardLayout.y + slot.y,
      width: slot.width,
      height: slot.height,
    }),
  );

  if (targetSlot && targetSlot.isCompleting) {
    return {
      accepted: false,
      targetX: leadCard.homeX,
      targetY: leadCard.homeY,
      targetSlotId: null,
    };
  }

  if (targetSlot) {
    const slotIsEmpty = targetSlot.categoryId === null;

    const bottomCard = state.cards[cardIds[0]];
    const topCard = state.cards[cardIds[cardIds.length - 1]];

    if (!bottomCard || !topCard) {
      return {
        accepted: false,
        targetX: leadCard.homeX,
        targetY: leadCard.homeY,
        targetSlotId: null,
      };
    }

    let allowed = false;

    if (slotIsEmpty) {
      allowed =
        topCard.cardType === 'category' &&
        cardIds.every(id => state.cards[id]?.categoryId === topCard.categoryId);
    } else {
      allowed =
        bottomCard.cardType === 'item' &&
        bottomCard.categoryId === targetSlot.categoryId;
    }

    if (!allowed) {
      return {
        accepted: false,
        targetX: leadCard.homeX,
        targetY: leadCard.homeY,
        targetSlotId: null,
      };
    }

    setHintOverlay(null);
    saveUndoForMove(cardIds, leadCard);


    triggerMasterBreakIfNeeded(cardIds, leadCard);

    dispatch({
      type: 'PLACE_PILE',
      cardIds,
      slotId: targetSlot.id,
    });

    return {
      accepted: true,
      targetX: targetSlot.x,
      targetY: targetSlot.y,
      targetSlotId: targetSlot.id,
    };
  }

  const masterTargetCard = findMasterCardAtPoint(centerWindowX, centerWindowY);

  if (masterTargetCard?.isMaster) {
    if (leadCard.columnId === masterTargetCard.columnId) {
      return {
        accepted: false,
        targetX: leadCard.homeX,
        targetY: leadCard.homeY,
        targetSlotId: null,
      };
    }

    const dropPos = getMasterDropPosition(masterTargetCard);

    saveUndoForMove(cardIds, leadCard);

  
    triggerMasterBreakIfNeeded(cardIds, leadCard);

    dispatch({
      type: 'MOVE_PILE_TO_COLUMN',
      cardIds,
      columnId: masterTargetCard.columnId!,
      targetCardId: masterTargetCard.id,
    });

    return {
      accepted: true,
      targetX: dropPos.x,
      targetY: dropPos.y,
      targetSlotId: null,
    };
  }

  const targetCard = Object.values(state.cards)
    .filter(c => c.faceUp && !cardIds.includes(c.id))
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(c =>
      isPointInsideExpandedRect(centerWindowX, centerWindowY, {
        x: boardLayout.x + c.x,
        y: boardLayout.y + c.y,
        width: c.width,
        height: c.height,
      }),
    );

  if (targetCard) {
    if (targetCard.isMaster) {
      const allowed = leadCard.categoryId === targetCard.categoryId;

      if (!allowed) {
        return {
          accepted: false,
          targetX: leadCard.homeX,
          targetY: leadCard.homeY,
          targetSlotId: null,
        };
      }

      if (targetCard.columnId) {
        saveUndoForMove(cardIds, leadCard);

        
        triggerMasterBreakIfNeeded(cardIds, leadCard);

        dispatch({
          type: 'MOVE_PILE_TO_COLUMN',
          cardIds,
          columnId: targetCard.columnId,
          targetCardId: targetCard.id,
        });

        return {
          accepted: true,
          targetX: targetCard.x,
          targetY: targetCard.y,
          targetSlotId: null,
        };
      }
    }

    const targetCategoryId = targetCard.placedSlotId
      ? state.slots.find(s => s.id === targetCard.placedSlotId)?.categoryId
      : targetCard.categoryId;

    if (!targetCategoryId) {
      return {
        accepted: false,
        targetX: leadCard.homeX,
        targetY: leadCard.homeY,
        targetSlotId: null,
      };
    }

    const allowed =
      targetCard.cardType === 'item' &&
      leadCard.categoryId === targetCategoryId;

    if (!allowed) {
      return {
        accepted: false,
        targetX: leadCard.homeX,
        targetY: leadCard.homeY,
        targetSlotId: null,
      };
    }

    if (targetCard.placedSlotId) {
      saveUndoForMove(cardIds, leadCard);

      triggerMasterBreakIfNeeded(cardIds, leadCard);

      dispatch({
        type: 'PLACE_PILE',
        cardIds,
        slotId: targetCard.placedSlotId,
      });

      return {
        accepted: true,
        targetX: targetCard.x,
        targetY: targetCard.y,
        targetSlotId: targetCard.placedSlotId,
      };
    }

    if (targetCard.columnId) {
      saveUndoForMove(cardIds, leadCard);

      triggerMasterBreakIfNeeded(cardIds, leadCard);

      dispatch({
        type: 'MOVE_PILE_TO_COLUMN',
        cardIds,
        columnId: targetCard.columnId,
        targetCardId: targetCard.id,
      });

      return {
        accepted: true,
        targetX: targetCard.x,
        targetY: targetCard.y,
        targetSlotId: null,
      };
    }
  }

  const emptyColumn = findEmptyColumnAtPoint(centerWindowX, centerWindowY);

  if (emptyColumn) {
    saveUndoForMove(cardIds, leadCard);

    triggerMasterBreakIfNeeded(cardIds, leadCard);

    dispatch({
      type: 'MOVE_PILE_TO_COLUMN',
      cardIds,
      columnId: emptyColumn.id,
    });

    return {
      accepted: true,
      targetX: emptyColumn.x,
      targetY: emptyColumn.y,
      targetSlotId: null,
    };
  }

  return {
    accepted: false,
    targetX: leadCard.homeX,
    targetY: leadCard.homeY,
    targetSlotId: null,
  };
};

  const visibleWasteIds = state.wasteIds.slice(-3);

  const completingSlotIds = useMemo(() => {
    return new Set(
      state.slots.filter(slot => slot.isCompleting).map(slot => slot.id),
    );
  }, [state.slots]);

  const visiblePlacedCards = useMemo(() => {
    return Object.values(state.cards).filter(card => {
      if (!card.placed) return false;

      if (!card.placedSlotId) return true;

      return !completingSlotIds.has(card.placedSlotId);
    });
  }, [state.cards, completingSlotIds]);

  const canRestock = state.stockIds.length === 0 && state.wasteIds.length > 0;

  const activePlacedCardIds = useMemo(() => {
    const ids = new Set<string>();

    state.slots.forEach(slot => {
      const lastItemId = [...slot.matchedCardIds]
        .reverse()
        .find(cardId => state.cards[cardId]?.cardType === 'item');

      if (lastItemId) {
        ids.add(lastItemId);
      }
    });

    return ids;
  }, [state.slots, state.cards]);

  const triggerDeckHint = () => {
  setHintOverlay(null);
  setDeckHintKey(Date.now());
  setDeckHintActive(true);
};

 const handleHintPress = () => {
  if (hintOverlay || deckHintActive) return;

  if (state.hintsLeft <= 0) {
    grantRewardedHint();
    return;
  }

  const move = getHintMove(state);

  if (!move) {
    if (state.stockCount > 0 || state.wasteIds.length > 0) {
      dispatch({ type: 'USE_HINT' });
      triggerDeckHint();
    }
    return;
  }

  const sourceCard = state.cards[move.sourceCardId];

  if (!sourceCard || !sourceCard.faceUp || !sourceCard.movable) {
    if (state.stockCount > 0 || state.wasteIds.length > 0) {
      dispatch({ type: 'USE_HINT' });
      triggerDeckHint();
    }
    return;
  }

  const stackCardIds =
    move.stackCardIds.length > 0 ? move.stackCardIds : [sourceCard.id];

  const stackCards = stackCardIds
    .map(id => state.cards[id])
    .filter((card): card is CardState => !!card);

  if (stackCards.length !== stackCardIds.length || stackCards.some(card => !card.faceUp)) {
    if (state.stockCount > 0 || state.wasteIds.length > 0) {
      dispatch({ type: 'USE_HINT' });
      triggerDeckHint();
    }
    return;
  }

  const firstStackCard = stackCards[0];
  if (!firstStackCard) return;

  const sourceRect = getCardLayoutRect(firstStackCard);

  const startX = sourceRect.x + sourceRect.width / 2;
  const startY = sourceRect.y + sourceRect.height / 2;

  let endX = startX;
  let endY = startY;

  if (move.target.kind === 'slot') {
    const slotRect = getSlotLayoutRect(move.target.slotId);
    if (!slotRect) return;

    endX = slotRect.x + slotRect.width / 2;
    endY = slotRect.y + slotRect.height / 2;
  } else {
    const targetCard = state.cards[move.target.cardId];
    if (!targetCard) return;

    const targetRect = getCardLayoutRect(targetCard);
    endX = targetRect.x + targetRect.width / 2;
    endY = targetRect.y + targetRect.height / 2;
  }

  dispatch({ type: 'USE_HINT' });
  setDeckHintActive(false);

  setHintOverlay({
    startX,
    startY,
    endX,
    endY,
    cardId: sourceCard.id,
    stackCardIds,
    animationKey: Date.now(),
  });
};

const handleMasterPress = () => {
  if (masterPlacementMode) return;

  if (masterLeft <= 0) {
    grantRewardedMaster();
    return;
  }

  setHintOverlay(null);
  setDeckHintActive(false);
  setMasterPlacementMode(true);
};

const handleMasterTargetPress = (targetCardId: string) => {
  dispatch({
    type: 'PLACE_MASTER_CARD',
    targetCardId,
  });

  setMasterPlacementMode(false);
  setMasterLeft(prev => Math.max(prev - 1, 0));
};

  const clearHint = () => {
  setHintOverlay(null);
  setDeckHintActive(false);
};

const isLevelComplete = useMemo(() => {
  return Object.keys(state.cards).length === 0;
}, [state.cards]);

useEffect(() => {
  if (!isLevelComplete) {
    levelBonusGrantedRef.current = false;
    setShowLevelComplete(false);
    setRewardBurst(null);
    setRewardMovesDisplay(null);

    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
      rewardTimerRef.current = null;
    }

    return;
  }

  if (levelBonusGrantedRef.current) return;
  if (movesLayout.width === 0 || movesLayout.height === 0) return;

  levelBonusGrantedRef.current = true;

  const remainingMoves = state.movesLeft;
  setLevelRewardCoins(getRemainingMoveCoinReward(remainingMoves));

  if (remainingMoves <= 0) {
    setRewardMovesDisplay(0);
    setShowLevelComplete(true);
    return;
  }

  setRewardMovesDisplay(remainingMoves);

  setRewardBurst({
    animationKey: Date.now(),
    count: remainingMoves,
    x: movesLayout.x + movesLayout.width + 8,
    y: movesLayout.y + Math.round(movesLayout.height / 2 - 10),
  });

  if (rewardTimerRef.current) {
    clearInterval(rewardTimerRef.current);
    rewardTimerRef.current = null;
  }

  let currentMoves = remainingMoves;

  rewardTimerRef.current = setInterval(() => {
    currentMoves = Math.max(currentMoves - 1, 0);
    setRewardMovesDisplay(currentMoves);

    dispatch({
      type: 'ADD_COINS',
      amount: 2,
    });

    if (currentMoves <= 0) {
      if (rewardTimerRef.current) {
        clearInterval(rewardTimerRef.current);
        rewardTimerRef.current = null;
      }

      setTimeout(() => {
        setRewardBurst(null);
        setShowLevelComplete(true);
      }, 250);
    }
  }, REWARD_STEP_MS);

  return () => {
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
      rewardTimerRef.current = null;
    }
  };
}, [
  isLevelComplete,
  state.movesLeft,
  movesLayout.x,
  movesLayout.y,
  movesLayout.width,
  movesLayout.height,
]);

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.screenRoot}>
          <StatusBar barStyle="light-content" />

          {!showLevelComplete && (
  <TopHeader
    coins={state.coins}
    level={state.level}
    onMenuPress={() => setShowSettings(true)}
  />
)}
{rewardBurst && rewardBurst.count > 0 && !showLevelComplete && (
  <View
    pointerEvents="none"
    style={{
      ...StyleSheet.absoluteFill,
      zIndex: 99999,
      elevation: 99999,
    }}
  >
    <CoinReward
      visible
      animationKey={rewardBurst.animationKey}
      x={rewardBurst.x}
      y={rewardBurst.y}
      count={rewardBurst.count}
      onDone={handleRewardDone}
    />
  </View>
)}

          <View style={styles.movesDeckRow}>
            <View
  style={styles.movesTag}
  onLayout={event => setMovesLayout(event.nativeEvent.layout)}
>
              <Text style={styles.movesTitle}>Moves</Text>
              <View style={styles.movesDivider} />
              <Text style={styles.movesNumber}>
  {rewardMovesDisplay ?? state.movesLeft}
</Text>
            </View>

            <View
              style={styles.deckArea}
              onLayout={event => setDeckLayout(event.nativeEvent.layout)}
            >
              {visibleWasteIds.map((cardId, index) => {
                const card = state.cards[cardId];
                if (!card || !card.faceUp) return null;

                const isActive = index === visibleWasteIds.length - 1;

                return (
                  <DraggableCard
                    key={card.id}
  card={card}
  onDrop={handleCardDrop}
  slots={state.slots}
  categoryCardTotals={state.categoryCardTotals}
  isActive={isActive}
  onTouchHintCancel={clearHint}
  masterPlacementMode={masterPlacementMode}
  onMasterTargetPress={handleMasterTargetPress}
                  />
                );
              })}

             <PileHintAnimation
  visible={deckHintActive}
  animationKey={deckHintKey}
  onDone={() => setDeckHintActive(false)}
  style={styles.deckHintWrapper}
>
  {state.stockCount > 0 ? (
    <Pressable style={styles.deckWrap} onPress={handleDeckPress}>
      <View style={styles.deckCard}>
        <ImageBackground
          source={require('../assets/hiddencardimage.png')}
          resizeMode="cover"
          style={styles.deckBackImage}
        />

        <View style={styles.deckCountPill}>
          <Text style={styles.deckCountText}>
            {state.stockCount}
          </Text>
        </View>
      </View>
    </Pressable>
  ) : state.wasteIds.length > 0 ? (
    <Pressable style={styles.restockWrap} onPress={handleDeckPress}>
      <View style={styles.restockCard}>
        <Text style={styles.restockIcon}>↻</Text>
        <Text style={styles.restockText}>Restock Again</Text>
      </View>
    </Pressable>
  ) : null}
</PileHintAnimation>
            </View>
          </View>

          <View
            style={styles.boardArea}
            onLayout={event => setBoardLayout(event.nativeEvent.layout)}
          >
            {state.slots.map(slot => (
              <SlotPlaceholder
                key={slot.id}
                x={slot.x}
                y={slot.y}
                width={slot.width}
                height={slot.height}
              />
            ))}

           {state.columns.map(column => {
  const lowerCards = column.cardIds
    .map(cardId => state.cards[cardId])
    .filter((card): card is CardState => !!card);

  const hiddenCards = lowerCards.filter(card => !card.faceUp);
  const faceUpCards = lowerCards.filter(card => card.faceUp);

  const masterCard = column.masterCardId
    ? state.cards[column.masterCardId]
    : null;

    const masterAnchorCard = column.masterAnchorCardId
  ? state.cards[column.masterAnchorCardId]
  : null;

 const upperCards = column.masterTopCardIds
  .map(cardId => state.cards[cardId])
  .filter((card): card is CardState => !!card && card.faceUp)
  .sort((a, b) => a.zIndex - b.zIndex);

  const hasAnyVisibleCard =
    faceUpCards.length > 0 || !!masterCard || upperCards.length > 0;

  const topFaceUpCard = faceUpCards[faceUpCards.length - 1];

  const stackRoot = faceUpCards[0];

const stackBounds = stackRoot
  ? {
      width: Math.max(
        ...faceUpCards.map(card => card.x - stackRoot.x + card.width),
      ),
      height: Math.max(
        ...faceUpCards.map(card => card.y - stackRoot.y + card.height),
      ),
    }
  : { width: 0, height: 0 };

  return (
    <React.Fragment key={column.id}>
      {!hasAnyVisibleCard && (
        <View
          pointerEvents="none"
          style={[
            styles.emptyColumnBox,
            {
              left: column.x,
              top: column.y,
              width: column.width,
              height: column.height,
            },
          ]}
        />
      )}

      {hiddenCards.map(card => (
        <ImageBackground
          key={card.id}
          source={require('../assets/hiddencardimage.png')}
          resizeMode="cover"
          style={[
            styles.hiddenBack,
            {
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
            },
          ]}
        />
      ))}

    {masterCard ? (
  stackRoot ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: stackRoot.x,
        top: stackRoot.y,
        width: stackBounds.width,
        height: stackBounds.height,
      }}
    >
      {faceUpCards.map((card, index) => (
        <StackedCardUI
          key={card.id}
          card={card}
          rootCard={stackRoot}
          stackIndex={index}
          totalCards={faceUpCards.length}
          slots={state.slots}
          categoryCardTotals={state.categoryCardTotals}
          isActive={false}
          hideTopLabel={card.id === masterAnchorCard?.id}
        />
      ))}
    </View>
  ) : null
) : (
  <>
    {faceUpCards.length === 1 && topFaceUpCard && (
      <DraggableCard
        card={topFaceUpCard}
        onDrop={handleCardDrop}
        slots={state.slots}
        categoryCardTotals={state.categoryCardTotals}
        isActive={true}
        onTouchHintCancel={clearHint}
        masterPlacementMode={masterPlacementMode}
        onMasterTargetPress={handleMasterTargetPress}
      />
    )}

    {faceUpCards.length > 1 && (
      <DraggablePile
        pileCards={faceUpCards}
        onDropPile={handlePileDrop}
        slots={state.slots}
        categoryCardTotals={state.categoryCardTotals}
        onTouchHintCancel={clearHint}
        masterPlacementMode={masterPlacementMode}
        onMasterTargetPress={handleMasterTargetPress}
      />
    )}
  </>
)}


{masterCard && masterAnchorCard && (
  <View
    pointerEvents="none"
    style={[
      styles.masterAnchorLabelWrap,
      {
        left: masterCard.x,
        top: masterCard.y - 26,
        width: masterCard.width,
        zIndex: masterCard.zIndex + 2,
      },
    ]}
  >
    <Text style={styles.masterAnchorLabel} numberOfLines={1}>
      {masterAnchorCard.label}
    </Text>
  </View>
)}

{masterCard && <MasterCard card={masterCard} />}
     
      {upperCards.length === 1 && upperCards[0] && (
        <DraggableCard
          card={upperCards[0]}
  onDrop={handleCardDrop}
  slots={state.slots}
  categoryCardTotals={state.categoryCardTotals}
  isActive={true}
  onTouchHintCancel={clearHint}
  masterPlacementMode={masterPlacementMode}
  onMasterTargetPress={handleMasterTargetPress}
        />
      )}

      {upperCards.length > 1 && (
        <DraggablePile
          pileCards={upperCards}
  onDropPile={handlePileDrop}
  slots={state.slots}
  categoryCardTotals={state.categoryCardTotals}
  onTouchHintCancel={clearHint}
  masterPlacementMode={masterPlacementMode}
  onMasterTargetPress={handleMasterTargetPress}
        />
      )}
    </React.Fragment>
  );
})}

            {visiblePlacedCards.map(card => (
              <DraggableCard
                key={card.id}
  card={card}
  onDrop={handleCardDrop}
  slots={state.slots}
  categoryCardTotals={state.categoryCardTotals}
  isActive={activePlacedCardIds.has(card.id)}
  onTouchHintCancel={clearHint}
  masterPlacementMode={masterPlacementMode}
  onMasterTargetPress={handleMasterTargetPress}
              />
            ))}
            {state.slots
              .filter(slot => slot.isCompleting)
              .map(slot => {
                const categoryCard = slot.cardId
                  ? state.cards[slot.cardId] ?? null
                  : null;

                const itemCards = slot.matchedCardIds
                  .map(cardId => state.cards[cardId])
                  .filter(
                    (card): card is CardState =>
                      !!card && card.cardType === 'item',
                  );

                if (!categoryCard && itemCards.length === 0) return null;

                return (
                  <SlotCompletionZoomOut
                    key={slot.id}
                    slot={slot}
                    categoryCard={categoryCard}
                    itemCards={itemCards}
                    onDone={() => {
                      dispatch({
                        type: 'FINALIZE_SLOT_COMPLETION',
                        slotId: slot.id,
                      });
                    }}
                  />
                );
              })}
          </View>

          <View style={styles.bottomArea}>
            <BottomActions
  hintsLeft={state.hintsLeft}
  coins={state.coins}
  undoCost={UNDO_COST}
  onHintPress={handleHintPress}
  onUndoPress={handleUndoPress}
  undoLeft={undoLeft}
  undoDisabled={undoLeft <= 0 && state.coins < UNDO_COST}
  onMasterPress={handleMasterPress}
  masterLeft={masterLeft}
  masterDisabled={masterPlacementMode}
/>
          </View>
          {hintOverlay && state.cards[hintOverlay.cardId] && (
            <HintFlyAnimation
              visible
              animationKey={hintOverlay.animationKey}
              startX={hintOverlay.startX}
              startY={hintOverlay.startY}
              endX={hintOverlay.endX}
              endY={hintOverlay.endY}
              card={state.cards[hintOverlay.cardId]}
              stackCards={hintOverlay.stackCardIds
                .map(id => state.cards[id])
                .filter((card): card is CardState => !!card)}
            />
          )}
      {undoOverlay && (
  <UndoMoveAnimation
    visible
    animationKey={undoOverlay.animationKey}
    x={undoOverlay.x}
    y={undoOverlay.y}
    cards={(undoOverlay as any).cards}
    onDone={() => setUndoOverlay(null)}
  />
)}

{masterBreakOverlay && (
  <View
    pointerEvents="none"
    style={{
      ...StyleSheet.absoluteFillObject,
      zIndex: 30000,
      elevation: 30000,
    }}
  >
    <MasterCardBreakAnimation
      visible
      animationKey={masterBreakOverlay.animationKey}
      x={masterBreakOverlay.x}
      y={masterBreakOverlay.y}
      width={masterBreakOverlay.width}
      height={masterBreakOverlay.height}
      onDone={() => setMasterBreakOverlay(null)}
    />
  </View>
)}
{showLevelComplete && (
  <View style={StyleSheet.absoluteFill}>
    <LevelCompleteScreen
      visible
      level={state.level}
      totalCoins={state.coins}
      earnedCoins={levelRewardCoins}
      onContinue={() => {
    setShowLevelComplete(false);
    onRequestNextLevel?.();
  }}
    />
  </View>
)}
<SettingsPopup
  visible={showSettings}
  soundEnabled={soundEnabled}
  onToggleSound={setSoundEnabled}
  onClose={() => setShowSettings(false)}
  onRestart={() => {
    setShowSettings(false);
    restartLevel();
  }}
  onMainMenu={() => {
    setShowSettings(false);
    onRequestHome?.();
  }}
/>
<BottomBannerAd />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    // paddingHorizontal: BOARD.paddingX,
    // paddingTop: 8,
  },

  screenRoot: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: BOARD.paddingX,
    paddingTop: 8,
  },

  pagePadding: {
    paddingHorizontal: BOARD.paddingX,
    paddingTop: 8,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  levelText: {
    color: SOLITAIRE_THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  menuButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuLine: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: SOLITAIRE_THEME.colors.textPrimary,
    marginVertical: 2,
  },

  movesDeckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginBottom: 4,
  },

  movesTag: {
    width: 104,
    height: 122,
    borderRadius: SOLITAIRE_THEME.radius.panel,
    backgroundColor: SOLITAIRE_THEME.colors.panelBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.panelBorder,
    paddingTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: SOLITAIRE_THEME.colors.panelGlow,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 56,
  },

  movesTitle: {
    color: SOLITAIRE_THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  movesDivider: {
    width: '80%',
    height: 2,
    backgroundColor: SOLITAIRE_THEME.colors.panelBorderSoft,
    marginVertical: 10,
  },

  movesNumber: {
    color: SOLITAIRE_THEME.colors.textPrimary,
    fontSize: 35,
    fontWeight: '800',
    lineHeight: 30,
  },

  deckArea: {
    width: BOARD.deckAreaWidth,
    height: BOARD.cardHeight,
    position: 'relative',
    overflow: 'visible',
  },

  deckWrap: {
    width: BOARD.deckWidth,
    height: BOARD.cardHeight,
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },

  deckCard: {
    width: BOARD.deckWidth,
    height: BOARD.cardHeight,
    borderRadius: SOLITAIRE_THEME.radius.panel,
    backgroundColor: SOLITAIRE_THEME.colors.panelBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.panelBorder,
    overflow: 'hidden',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 6,
    shadowColor: SOLITAIRE_THEME.colors.panelGlow,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 56,
  },

  deckPattern: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  deckCountPill: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(6,16,15,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(57,232,242,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },

  deckCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },

  boardArea: {
    flex: 1,
    position: 'relative',
    // backgroundColor: '#000',
  },

  hiddenBack: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F4F4F4',
  },

  emptyColumnBox: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },
  restockWrap: {
    width: BOARD.deckWidth,
    height: BOARD.cardHeight,
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restockCard: {
    width: BOARD.deckWidth,
    height: BOARD.cardHeight,
    borderRadius: SOLITAIRE_THEME.radius.panel,
    backgroundColor: SOLITAIRE_THEME.colors.panelBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SOLITAIRE_THEME.colors.panelGlow,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 30,
  },

  restockIcon: {
    fontSize: 28,
    color: SOLITAIRE_THEME.colors.textPrimary,
    marginBottom: 6,
  },

  restockText: {
    fontSize: 13,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
    textAlign: 'center',
  },
  deckBackImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: SOLITAIRE_THEME.radius.panel,
  },

  deckBackStack: {
    ...StyleSheet.absoluteFill,
  },

  deckBackCard: {
    position: 'absolute',
    width: BOARD.deckWidth,
    height: BOARD.cardHeight,
    borderRadius: SOLITAIRE_THEME.radius.panel,
    overflow: 'hidden',
    borderWidth: 2,
    // borderColor: '#F4F4F4',
  },

  deckBackCard2: {
    right: -5,
    top: 5,
    zIndex: 1,
  },

  deckBackCard3: {
    right: -10,
    top: 10,
    zIndex: 0,
  },
  bottomArea: {
    paddingTop: 8,
  },

  deckHintWrapper: {
  position: 'absolute',
  right: 0,
  top: 0,
  width: BOARD.deckWidth,
  height: BOARD.cardHeight,
},

masterAnchorLabelWrap: {
   position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
},
masterAnchorLabel: {
  fontSize: 14.5,
  fontWeight: '700',
  color: '#5A4030',
  textAlign: 'center',
  // paddingHorizontal: 3,
  
},
});