import React from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  hintsLeft: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function HintButton({ hintsLeft, onPress, style }: Props) {
  const disabled = hintsLeft <= 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.title}>Hint</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{hintsLeft}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
   // minWidth: 74,
    height: 48,
    borderRadius: SOLITAIRE_THEME.radius.button,
    backgroundColor: SOLITAIRE_THEME.colors.buttonBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.buttonBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'visible',
    shadowColor: SOLITAIRE_THEME.colors.panelGlow,
    shadowOpacity: 0.75,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#5A4030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F8F4EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
});