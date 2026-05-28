import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOLITAIRE_THEME } from '../theme/solitaireTheme';

type Props = {
  visible: boolean;
  soundEnabled: boolean;
  onToggleSound: (value: boolean) => void;
  onClose: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
};

export default function SettingsPopup({
  visible,
  soundEnabled,
  onToggleSound,
  onClose,
  onRestart,
  onMainMenu,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safeArea}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Settings</Text>

              <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
                <Image
                  source={require('../assets/close.png')}
                  style={styles.closeImage}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sound</Text>

              <Switch
                value={soundEnabled}
                onValueChange={onToggleSound}
                trackColor={{ false: '#7A6A5A', true: '#F4BE2A' }}
                thumbColor={soundEnabled ? '#FFFFFF' : '#E6E6E6'}
              />
            </View>

            <Pressable style={styles.actionButton} onPress={onRestart}>
              <Text style={styles.actionText}>Restart</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={onMainMenu}>
              <Text style={styles.actionText}>Main Menu</Text>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 250,
    borderRadius: 22,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.panelBorder,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeImage: {
    width: 20,
    height: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: SOLITAIRE_THEME.colors.buttonBg,
    borderWidth: 2,
    borderColor: SOLITAIRE_THEME.colors.buttonBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
    color: SOLITAIRE_THEME.colors.textPrimary,
  },
});