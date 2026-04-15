// src/components/TableauColumn.tsx

import React from 'react';
import { View, StyleSheet, ImageBackground  } from 'react-native';
import type { ColumnData } from '../data/solitaireLevel';
import TableauCard from './TableauCard';

type Props = {
  column: ColumnData;
};

export default function TableauColumn({ column }: Props) {
  return (
    <View style={styles.column}>
      {/* hidden cards */}
     {Array.from({ length: column.hiddenCount }).map((_, idx) => (
  <ImageBackground
    key={`hidden-${idx}`}
    source={require('../assets/hiddencardimage.png')}
    resizeMode="cover"
    style={[styles.hiddenCard, { top: idx * 10 }]}
  />
))}

      {/* face up cards */}
      {column.cards.map((card, idx) => (
        <TableauCard key={card.id} card={card} offsetY={column.hiddenCount * 10 + idx * 14} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 84,
    height: 260,
    position: 'relative',
  },
 hiddenCard: {
  width: 84,
  height: 114,
  borderRadius: 10,
  position: 'absolute',
  left: 0,
  right: 0,
  overflow: 'hidden',
},
});