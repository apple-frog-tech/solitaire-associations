import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import type { CardState } from '../gamelogic/solitaireTypes';

type Props = {
  card: CardState;
};

export default function MasterCard({ card }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.card,
        {
          left: card.x,
          top: card.y,
          width: card.width,
          height: card.height,
          zIndex: card.zIndex,
        },
      ]}
    >
      <ImageBackground
        source={require('../assets/mastercard.png')}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});