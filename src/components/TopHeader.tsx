import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

type Props = {
  coins: number;
  level: number;
  onMenuPress?: () => void;
};

export default function TopHeader({ coins, level, onMenuPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.levelText}>Level {level}</Text>

      <View style={styles.coinWrap}>
        

        <Image
          source={require('../assets/coin.png')}
          style={styles.coinImage}
          resizeMode="contain"
        />

        <View style={styles.coinBox}>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <Pressable onPress={onMenuPress} style={styles.menuButton}>
        <Image
          source={require('../assets/hamburger.png')}
          style={styles.menuImage}
          resizeMode="contain"
        />
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
  levelText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  coinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 12,
    marginRight: 12,
  },
  coinBox: {
    minWidth: 72,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1E2C16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
    left: -12
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  coinImage: {
    width: 36,
    height: 36,
    zIndex: 2,
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
  menuImage: {
    width: 32,
    height: 32,
  },
});