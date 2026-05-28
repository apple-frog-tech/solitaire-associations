import React from 'react';
import { View, StyleSheet } from 'react-native';
import HintButton from './HintButton';
import UndoButton from './UndoButton';
import MasterButton from './MasterButton';

type Props = {
  hintsLeft: number;
  coins: number;
  undoCost?: number;
  onHintPress?: () => void;
  onUndoPress?: () => void;
  onMasterPress?: () => void;
  undoLeft?: number;
  undoDisabled?: boolean;
  masterLeft?: number;
  masterDisabled?: boolean;
};

export default function BottomActions({
  hintsLeft,
  coins,
  undoCost = 50,
  onHintPress,
  onUndoPress,
  onMasterPress,
  undoLeft = 0,
  undoDisabled = false,
  masterLeft = 0,
  masterDisabled = false,
}: Props) {
  return (
    <View style={styles.row}>
      <HintButton hintsLeft={hintsLeft} onPress={onHintPress} style={styles.button} />

      <UndoButton
        undoLeft={undoLeft}
        coins={coins}
        cost={undoCost}
        onPress={onUndoPress}
        disabled={undoDisabled}
        style={styles.button}
      />

      <MasterButton
        masterLeft={masterLeft}
        onPress={onMasterPress}
        disabled={masterDisabled}
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