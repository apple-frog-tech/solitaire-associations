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

export default function GameScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = width - BOARD.paddingX * 2;
  // const initialState = useMemo(() => createInitialState(width), [width]);
  const initialState = useMemo(
    () => createInitialState(contentWidth),
    [contentWidth],
  );
  const [state, dispatch] = useReducer(solitaireReducer, initialState);
  // const deckAreaRef = useRef<View>(null);
  // const boardAreaRef = useRef<View>(null);

  // const deckWindow = useRef({ x: 0, y: 0 });
  // const boardWindow = useRef({ x: 0, y: 0 });

  const [hintOverlay, setHintOverlay] = useState<HintOverlayState | null>(null);

  // const measureAreas = () => {
  //   requestAnimationFrame(() => {
  //     deckAreaRef.current?.measureInWindow((x, y) => {
  //       deckWindow.current = { x, y };
  //     });

  //     boardAreaRef.current?.measureInWindow((x, y) => {
  //       boardWindow.current = { x, y };
  //     });
  //   });
  // };

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

  const DROP_TOLERANCE = 14;

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

  // const toBoardPoint = (x: number, y: number) => ({
  //   x: x + deckLayout.x - boardLayout.x,
  //   y: y + deckLayout.y - boardLayout.y,
  // });

  // const toDeckPoint = (x: number, y: number) => ({
  //   x: x + boardLayout.x - deckLayout.x,
  //   y: y + boardLayout.y - deckLayout.y,
  // });

  const handleDeckPress = () => {
    if (state.stockIds.length > 0) {
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

    // card center in WINDOW coordinates
    const cardWindowX = isWasteCard
      ? deckLayout.x + finalX
      : boardLayout.x + finalX;
    const cardWindowY = isWasteCard
      ? deckLayout.y + finalY
      : boardLayout.y + finalY;

    const centerWindowX = cardWindowX + card.width / 2;
    const centerWindowY = cardWindowY + card.height / 2;

    // 1) check slots
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

      dispatch({ type: 'PLACE_CARD', cardId, slotId: targetSlot.id });

      return {
        accepted: true,
        targetX: finalX,
        targetY: finalY,
        targetSlotId: targetSlot.id,
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
      // If target is a placed card, get its slot/category from placedSlotId.
      // If target is a column card, use its own categoryId.
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

      // If target card belongs to a slot, use that slot.
      // Otherwise, if it's a column card, just drop onto its column.
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
        // empty slot: pile must contain a category card on top
        allowed =
          topCard.cardType === 'category' &&
          cardIds.every(
            id => state.cards[id]?.categoryId === topCard.categoryId,
          );
      } else {
        // filled slot: pile must be same category and start with an item card
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

      // cards not in a slot are always visible
      if (!card.placedSlotId) return true;

      // hide cards that belong to a slot which is currently completing
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

  const handleHintPress = () => {
    if (state.hintsLeft <= 0) return;
    if (hintOverlay) return;

    const move = getHintMove(state);
    if (!move) return;

    const sourceCard = state.cards[move.sourceCardId];
    if (!sourceCard) return;

    const stackCardIds =
      move.stackCardIds.length > 0 ? move.stackCardIds : [sourceCard.id];
    const stackCards = stackCardIds
      .map(id => state.cards[id])
      .filter((card): card is CardState => !!card);

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

  // const handleHintDone = () => {
  //   setHintOverlay(null);
  // };

  // useEffect(() => {
  //   measureAreas();
  // }, [width]);

  

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.screenRoot}>
          <StatusBar barStyle="light-content" />

          {/* <View style={styles.pagePadding}> */}
          <View style={styles.headerRow}>
            <Text style={styles.levelText}>Level {state.level}</Text>

            <Pressable style={styles.menuButton}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>
          </View>

          <View style={styles.movesDeckRow}>
            <View style={styles.movesTag}>
              <Text style={styles.movesTitle}>Moves</Text>
              <View style={styles.movesDivider} />
              <Text style={styles.movesNumber}>{state.movesLeft}</Text>
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
                  />
                );
              })}

              {state.stockCount > 0 ? (
                <Pressable style={styles.deckWrap} onPress={handleDeckPress}>
                  <View style={styles.deckCard}>
                    <ImageBackground
                      source={require('../assets/hiddencardimage.png')}
                      resizeMode="cover"
                      style={styles.deckBackImage}
                    />

                    {/* <View style={styles.deckPeekCard1} />
               <View style={styles.deckPeekCard2} /> */}

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
            </View>
          </View>
          {/* </View> */}

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
              const hiddenCards = column.cardIds
                .map(cardId => state.cards[cardId])
                .filter((card): card is CardState => !!card && !card.faceUp);

              const faceUpCards = column.cardIds
                .map(cardId => state.cards[cardId])
                .filter((card): card is CardState => !!card && card.faceUp);

              const hasAnyVisibleCard = faceUpCards.length > 0;

              const topFaceUpCard = faceUpCards[faceUpCards.length - 1];

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

                  {faceUpCards.length === 1 && topFaceUpCard && (
                    <DraggableCard
                      card={topFaceUpCard}
                      onDrop={handleCardDrop}
                      slots={state.slots}
                      categoryCardTotals={state.categoryCardTotals}
                      isActive={true}
                    />
                  )}

                  {faceUpCards.length > 1 && (
                    <DraggablePile
                      pileCards={faceUpCards}
                      onDropPile={handlePileDrop}
                      slots={state.slots}
                      categoryCardTotals={state.categoryCardTotals}
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
              onHintPress={handleHintPress}
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
});
