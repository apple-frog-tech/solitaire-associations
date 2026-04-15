// src/components/FoundationPlaceholder.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  index: number;
};

export default function FoundationPlaceholder({ index }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>♛</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 78,
    height: 112,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  iconWrap: {
    opacity: 0.22,
  },
  icon: {
    fontSize: 32,
    color: '#0D5B1C',
    fontWeight: '700',
  },
});