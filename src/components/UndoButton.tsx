import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  Image,
} from 'react-native';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  undoLeft: number;
  coins: number;
  cost?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function UndoButton({
  undoLeft,
  coins,
  cost = 50,
  onPress,
  disabled = false,
  style,
}: Props) {
  const rewardMode = undoLeft <= 0;
  const canBuy = coins >= cost;
  const finalDisabled = disabled || (rewardMode && !canBuy);

  return (
    <Pressable
      onPress={onPress}
      disabled={finalDisabled}
      style={({ pressed }) => [
        styles.button,
        style,
        finalDisabled && styles.disabled,
        pressed && !finalDisabled && styles.pressed,
      ]}
    >
      <Text style={styles.title}>Undo</Text>

      <View style={[styles.badge, rewardMode && styles.rewardBadge]}>
        {rewardMode ? (
          <View style={styles.coinRow}>
            <Image
              source={require('../assets/coin.png')}
              style={styles.coinImage}
              resizeMode="contain"
            />
            <Text style={styles.costText}>{cost}</Text>
          </View>
        ) : (
          <Text style={styles.badgeText}>{undoLeft}</Text>
        )}
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
  rewardBadge: {
    minWidth: 48,
    paddingHorizontal: 8,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImage: {
    width: 14,
    height: 14,
    marginRight: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
  costText: {
    fontSize: 11,
    fontWeight: '900',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
});