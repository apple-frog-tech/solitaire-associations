// src/components/TopHeader.tsx

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = {
  coins: number;
  level: number;
  onMenuPress?: () => void;
};

export default function TopHeader({ coins, level, onMenuPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.coinWrap}>
        <View style={styles.coinIcon}>
          <Text style={styles.coinEmoji}>👑</Text>
        </View>

        <View style={styles.coinBox}>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <Text style={styles.levelText}>Level {level}</Text>

      <Pressable onPress={onMenuPress} style={styles.menuButton}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3C441',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  coinEmoji: {
    fontSize: 18,
  },
  coinBox: {
    minWidth: 78,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1E2C16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  levelText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
  },
});