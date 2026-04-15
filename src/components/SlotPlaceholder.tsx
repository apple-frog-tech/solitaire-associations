import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
};

export default function SlotPlaceholder({
  x,
  y,
  width,
  height,
  style,
}: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.slot,
        { left: x, top: y, width, height },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    borderRadius: SOLITAIRE_THEME.radius.slot,
    backgroundColor: SOLITAIRE_THEME.colors.slotBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.slotBorder,
    shadowColor: SOLITAIRE_THEME.colors.panelGlow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 36,
  },
});