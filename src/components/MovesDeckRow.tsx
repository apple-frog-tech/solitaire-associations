import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = {
  movesLeft: number;
  stockCount: number;
  onDeckPress?: () => void;
};

export default function MovesDeckRow({ movesLeft, stockCount, onDeckPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.movesTag}>
        <Text style={styles.movesTitle}>Moves</Text>
        <View style={styles.divider} />
        <Text style={styles.movesNumber}>{movesLeft}</Text>
      </View>

      <Pressable onPress={onDeckPress} style={styles.deckWrap}>
        <View style={styles.deckCard}>
          <View style={styles.deckPattern} />
          <View style={styles.deckCountPill}>
            <Text style={styles.deckCountText}>{stockCount}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  movesTag: {
    width: 104,
    height: 122,
    borderRadius: 10,
    backgroundColor: '#2ECC71',
    paddingTop: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  movesTitle: {
    color: '#183B1B',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(24,59,27,0.35)',
    marginVertical: 10,
  },
  movesNumber: {
    color: '#183B1B',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  deckWrap: {
    width: 90,
    height: 122,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  deckCard: {
    width: 90,
    height: 122,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#EDEDED',
    overflow: 'hidden',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 6,
  },
  deckPattern: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#3A93F7',
    opacity: 0.95,
  },
  deckCountPill: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },
  deckCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});