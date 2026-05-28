import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  masterLeft: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function MasterButton({
  masterLeft,
  onPress,
  disabled = false,
  style,
}: Props) {
  const rewardMode = masterLeft <= 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.title}>Master</Text>

      <View style={styles.badge}>
        <Text style={[styles.badgeText, rewardMode && styles.playIcon]}>
          {rewardMode ? '▶' : masterLeft}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
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
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
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
    textAlign: 'center',
  },
  playIcon: {
    fontSize: 10,
    marginLeft: 1,
  },
});