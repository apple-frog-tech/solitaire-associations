import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { AD_UNITS } from '../ads/adService';

export default function BottomBannerAd() {
  return (
    <View style={styles.wrapper}>
      <BannerAd
        unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
});