import React, { useMemo } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  level: number;
  totalCoins: number;
  earnedCoins: number;
  onContinue?: () => void;
};

const compliments = ['Perfect!', 'Nice!', 'Bravo!', 'Amazing!', 'Well done!'];

export default function LevelCompleteScreen({
  visible,
  level,
  totalCoins,
  earnedCoins,
  onContinue,
}: Props) {
  const compliment = useMemo(() => {
    return compliments[level % compliments.length];
  }, [level]);

  if (!visible) return null;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.coinWrap}>
            <Image
              source={require('../assets/coin.png')}
              style={styles.coinImage}
              resizeMode="contain"
            />
            <View style={styles.coinBox}>
              <Text style={styles.coinText}>{totalCoins}</Text>
            </View>
          </View>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.levelText}>Level {level}</Text>
          <Text style={styles.complimentText}>{compliment}</Text>

          <View style={styles.card}>
            <LottieView
              source={require('../assets/Congratulations.json')}
              autoPlay
              loop
              style={styles.congratsAnimation}
            />
          </View>

          <View style={styles.rewardRow}>
            <LottieView
              source={require('../assets/vectorcoin.json')}
              autoPlay
              loop
              style={styles.coinAnimation}
            />
            <Text style={styles.rewardText}>+{earnedCoins}</Text>
          </View>

          <Pressable
            onPress={onContinue}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  coinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinImage: {
    width: 36,
    height: 36,
    zIndex: 2,
  },
  coinBox: {
    minWidth: 72,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  levelText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  complimentText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 26,
  },
  card: {
    width: 160,
    height: 210,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: '#F4BE2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD84D',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  congratsAnimation: {
    width: 180,
    height: 180,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  coinAnimation: {
    width: 54,
    height: 54,
  },
  rewardText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 0,
  },
  continueButton: {
    marginTop: 20,
    minWidth: 160,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});