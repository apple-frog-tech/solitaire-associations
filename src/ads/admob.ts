import mobileAds, {
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';

let initialized = false;

export const AD_UNITS = {
  banner: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : 'ca-app-pub-7500474458725523/9905084839',
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-7500474458725523/2140861024',
  rewarded: __DEV__
    ? TestIds.REWARDED
    : 'ca-app-pub-7500474458725523/8570538000',
};

export async function initializeAds() {
  if (initialized) return;
  initialized = true;

  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
    testDeviceIdentifiers: ['EMULATOR'],
  });

  await mobileAds().initialize();
}
