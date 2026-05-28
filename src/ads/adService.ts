import {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

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

const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial);
const rewarded = RewardedAd.createForAdRequest(AD_UNITS.rewarded);

let interstitialLoaded = false;
let rewardedLoaded = false;

let pendingRewardCallback: null | (() => void) = null;
let pendingInterstitialResolve: null | (() => void) = null;

let listenersAttached = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    interstitial.load();
    pendingInterstitialResolve?.();
    pendingInterstitialResolve = null;
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    pendingInterstitialResolve?.();
    pendingInterstitialResolve = null;
  });

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });

  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    pendingRewardCallback?.();
  });

  rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedLoaded = false;
    pendingRewardCallback = null;
    rewarded.load();
  });

  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    pendingRewardCallback = null;
  });
}

export function preloadAds() {
  attachListeners();

  if (!interstitialLoaded) {
    interstitial.load();
  }

  if (!rewardedLoaded) {
    rewarded.load();
  }
}

export function showInterstitialIfReady(): Promise<void> {
  attachListeners();

  return new Promise(resolve => {
    pendingInterstitialResolve = resolve;

    if (interstitialLoaded) {
      interstitialLoaded = false;
      interstitial.show();
      return;
    }

    interstitial.load();
    resolve();
  });
}

export function showRewardedIfReady(onEarnReward: () => void): boolean {
  attachListeners();

  if (!rewardedLoaded) {
    rewarded.load();
    return false;
  }

  pendingRewardCallback = onEarnReward;
  rewardedLoaded = false;
  rewarded.show();
  return true;
}
