import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = {
  visible: boolean;
  animationKey: number;
  onDone?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const LIFT_UP = -2;
const SHAKE_X = 2;

export default function PileHintAnimation({
  visible,
  animationKey,
  onDone,
  style,
  children,
}: Props) {
  const lift = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    lift.stopAnimation();
    shake.stopAnimation();
    lift.setValue(0);
    shake.setValue(0);

    if (!visible) {
      return;
    }

    const run = () => {
      Animated.sequence([
        Animated.timing(lift, {
          toValue: LIFT_UP,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shake, {
            toValue: -SHAKE_X,
            duration: 55,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: SHAKE_X,
            duration: 55,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: -SHAKE_X,
            duration: 55,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: SHAKE_X,
            duration: 55,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: 55,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(lift, {
          toValue: 0,
          duration: 70,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !stopRef.current) {
          onDone?.();
        }
      });
    };

    run();

    return () => {
      stopRef.current = true;
      lift.stopAnimation();
      shake.stopAnimation();
    };
  }, [animationKey, visible, lift, shake, onDone]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        style,
        {
          transform: [
            { translateX: visible ? shake : 0 },
            { translateY: visible ? lift : 0 },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}