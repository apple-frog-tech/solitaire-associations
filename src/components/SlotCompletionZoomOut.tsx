// import React, { useEffect, useMemo, useRef } from 'react';
// import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
// import type { CardState, SlotState } from '../gamelogic/solitaireTypes';

// type Props = {
//   slot: SlotState;
//   cards: CardState[];
//   onDone: () => void;
// };

// export default function SlotCompletionZoomOut({ slot, cards, onDone }: Props) {
//   const pop = useRef(new Animated.Value(0)).current;

//   const categoryCard = useMemo(
//     () => cards.find(card => card.cardType === 'category') ?? null,
//     [cards]
//   );

//   const itemCards = useMemo(
//     () => cards.filter(card => card.cardType === 'item'),
//     [cards]
//   );

//   useEffect(() => {
//     Animated.sequence([
//       Animated.timing(pop, {
//         toValue: 0.55,
//         duration: 120,
//         easing: Easing.out(Easing.quad),
//         useNativeDriver: true,
//       }),
//       Animated.delay(1200),
//       Animated.timing(pop, {
//         toValue: 1,
//         duration: 220,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//     ]).start(({ finished }) => {
//       if (finished) onDone();
//     });
//   }, [onDone, pop]);

//   const scale = pop.interpolate({
//     inputRange: [0, 0.55, 1],
//     outputRange: [1, 1.08, 0.96],
//   });

//   const opacity = pop.interpolate({
//     inputRange: [0, 0.7, 1],
//     outputRange: [1, 1, 0],
//   });

//   const translateY = pop.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, -8],
//   });

//   return (
//     <Animated.View
//       pointerEvents="none"
//       style={[
//         styles.wrapper,
//         {
//           left: slot.x,
//           top: slot.y,
//           width: slot.width,
//           height: slot.height,
//           opacity,
//           transform: [{ scale }, { translateY }],
//         },
//       ]}
//     >
//       <View style={StyleSheet.absoluteFill}>
//         {itemCards.map((card, index) => (
//           <View
//             key={card.id}
//             style={[
//               styles.card,
//               {
//                 width: card.width,
//                 height: card.height,
//                 transform: [{ translateY: index * 2 }, { translateX: index * 1 }],
//               },
//             ]}
//           >
//             <View style={styles.inner}>
//               <Text style={styles.label} numberOfLines={2}>
//                 {card.label}
//               </Text>
//             </View>
//           </View>
//         ))}
//       </View>

//       {categoryCard && (
//         <View
//           style={[
//             styles.card,
//             styles.frontCard,
//             {
//               width: categoryCard.width,
//               height: categoryCard.height,
//               transform: [{ translateY: 1 }, { scale: 1 }],
//             },
//           ]}
//         >
//           <View style={styles.inner}>
//             <Text style={styles.label} numberOfLines={2}>
//               {categoryCard.label}
//             </Text>
//           </View>
//         </View>
//       )}
//     </Animated.View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: {
//     position: 'absolute',
//   },
//   card: {
//     position: 'absolute',
//     left: 0,
//     top: 0,
//     borderRadius: 10,
//     backgroundColor: '#F8F4EA',
//     borderWidth: 2,
//     borderColor: '#E7DDCC',
//     overflow: 'hidden',
//     elevation: 0,
//     shadowOpacity: 0,
//     shadowRadius: 0,
//     shadowOffset: { width: 0, height: 0 },
//   },
//   frontCard: {
//     borderColor: '#C9B79E',
//   },
//   inner: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 8,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#5A4030',
//     textAlign: 'center',
//   },
// });


import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import type { CardState, SlotState } from '../gamelogic/solitaireTypes';

type Props = {
  slot: SlotState;
  categoryCard: CardState | null;
  itemCards: CardState[];
  onDone: () => void;
};

const ORBIT_DELAY = 100;
const ORBIT_DURATION = 650;
const EXIT_DURATION = 220;

export default function SlotCompletionZoomOut({ slot, categoryCard, itemCards, onDone }: Props) {
  const exit = useRef(new Animated.Value(0)).current;

  const renderCards = useMemo(() => {
  return categoryCard ? [categoryCard, ...itemCards] : itemCards;
}, [categoryCard, itemCards]);

const animationCards = renderCards;
  const animationIndexById = useMemo(() => {
    const map = new Map<string, number>();
    animationCards.forEach((card, index) => {
      map.set(card.id, index);
    });
    return map;
  }, [animationCards]);

  const orbitValuesRef = useRef<Map<string, Animated.Value>>(new Map());

  const orbitValues = useMemo(() => {
    const map = orbitValuesRef.current;

    animationCards.forEach(card => {
      if (!map.has(card.id)) {
        map.set(card.id, new Animated.Value(0));
      }
    });

    for (const id of Array.from(map.keys())) {
      if (!animationCards.some(card => card.id === id)) {
        map.delete(id);
      }
    }

    return animationCards.map(card => map.get(card.id)!);
  }, [animationCards]);

  useEffect(() => {
    orbitValues.forEach(value => value.setValue(0));
    exit.setValue(0);

    const orbitAnimations = orbitValues.map(value =>
      Animated.timing(value, {
        toValue: 1,
        duration: ORBIT_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    Animated.stagger(ORBIT_DELAY, orbitAnimations).start();

    const totalOrbitTime =
      (animationCards.length - 1) * ORBIT_DELAY + ORBIT_DURATION + 80;

    Animated.sequence([
      Animated.delay(totalOrbitTime),
      Animated.timing(exit, {
        toValue: 1,
        duration: EXIT_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
  }, [animationCards.length, exit, onDone, orbitValues]);

  const wrapperOpacity = exit.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const wrapperScale = exit.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  const wrapperTranslateY = exit.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  if (renderCards.length === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          left: slot.x,
          top: slot.y,
          width: slot.width,
          height: slot.height,
          opacity: wrapperOpacity,
          transform: [{ scale: wrapperScale }, { translateY: wrapperTranslateY }],
        },
      ]}
    >
      {renderCards.map(card => {
        const index = animationIndexById.get(card.id) ?? 0;
        const orbitValue = orbitValues[index];

        const rotate = orbitValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const radius = Math.max(4, Math.min(card.width * 0.04, 6)) + Math.min(index * 1, 1);

        return (
          <Animated.View
            key={card.id}
            pointerEvents="none"
            style={[
              styles.orbitLayer,
              {
                transform: [{ rotate }],
              },
            ]}
          >
            <View
              style={[
                styles.card,
                {
                  width: card.width,
                  height: card.height,
                  transform: [{ translateX: radius }],
                },
              ]}
            >
              <View style={styles.inner}>
                <Text style={styles.label} numberOfLines={2}>
                  {card.label}
                </Text>
              </View>

              <View pointerEvents="none" style={styles.mascotWrap}>
                <LottieView
                  source={require('../assets/mascot.json')}
                  autoPlay
                  loop={false}
                  style={{
                    width: card.width * 0.62,
                    height: card.height * 0.62,
                  }}
                />
              </View>
            </View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  orbitLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 10,
    backgroundColor: '#F8F4EA',
    borderWidth: 2,
    borderColor: '#E7DDCC',
    overflow: 'hidden',
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    position: 'relative',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  mascotWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
  },
});