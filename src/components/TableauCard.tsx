// src/components/TableauCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CardData } from '../data/solitaireLevel';

type Props = {
  card: CardData;
  offsetY?: number;
};

export default function TableauCard({ card, offsetY = 0 }: Props) {
  return (
    <View style={[styles.card, { top: offsetY }]}>
      <View style={styles.inner}>
        <Text style={styles.title}>{card.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 84,
    height: 114,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E7DDCC',
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 'auto' as any,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4030',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});