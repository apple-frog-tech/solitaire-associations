// // src/components/BottomActions.tsx

// import React from 'react';
// import { View, Text, StyleSheet, Pressable } from 'react-native';

// type Props = {
//   onHintPress?: () => void;
//   onUndoPress?: () => void;
//   onMasterPress?: () => void;
// };

// export default function BottomActions({
//   onHintPress,
//   onUndoPress,
//   onMasterPress,
// }: Props) {
//   return (
//     <View style={styles.row}>
//       <Pressable onPress={onHintPress} style={styles.button}>
//         <Text style={styles.buttonText}>Hint</Text>
//       </Pressable>

//       <Pressable onPress={onUndoPress} style={styles.button}>
//         <Text style={styles.buttonText}>Undo</Text>
//       </Pressable>

//       <Pressable onPress={onMasterPress} style={styles.button}>
//         <Text style={styles.buttonText}>Master Card</Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   row: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 10,
//     marginTop: 'auto',
//     paddingBottom: 12,
//   },
//   button: {
//     flex: 1,
//     height: 48,
//     borderRadius: 14,
//     backgroundColor: '#F3D05B',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   buttonText: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#5B3D05',
//   },
// });


import React from 'react';
import { View, StyleSheet } from 'react-native';
import GameButton from './GameButton';
import HintButton from './HintButton';

type Props = {
  hintsLeft: number;
  onHintPress?: () => void;
  onUndoPress?: () => void;
  onMasterPress?: () => void;
};

export default function BottomActions({
  hintsLeft,
  onHintPress,
  onUndoPress,
  onMasterPress,
}: Props) {
  return (
    <View style={styles.row}>
      <HintButton hintsLeft={hintsLeft} onPress={onHintPress} style={styles.button} />
      <GameButton title="Undo" onPress={onUndoPress} style={styles.button} />
      <GameButton
        title="Master Card"
        onPress={onMasterPress}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 'auto',
    paddingBottom: 12,
  },
  button: {
    flex: 1,
  },
});