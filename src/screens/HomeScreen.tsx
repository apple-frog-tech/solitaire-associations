import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>

      <Pressable
        onPress={() => navigation.navigate('Game')}
        style={{ marginTop: 20, padding: 12, backgroundColor: 'black' }}
      >
        <Text style={{ color: 'white' }}>Start Game</Text>
      </Pressable>
    </View>
  );
}