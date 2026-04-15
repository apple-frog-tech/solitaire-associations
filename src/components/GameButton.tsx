import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function GameButton({
  title,
  onPress,
  style,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={[styles.button, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 48,
    borderRadius: SOLITAIRE_THEME.radius.button,
    backgroundColor: SOLITAIRE_THEME.colors.buttonBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.buttonBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SOLITAIRE_THEME.colors.buttonGlow,
    shadowOpacity: 0.75,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.buttonText,
    letterSpacing: 0.2,
  },
});