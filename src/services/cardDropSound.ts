import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const DROP_SOUND_FILE = 'carddropsound.mp3';

let dropSound: Sound | null = null;
let loadingPromise: Promise<Sound | null> | null = null;
let soundEnabled = true;

function loadDropSound(): Promise<Sound | null> {
  if (dropSound) return Promise.resolve(dropSound);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise(resolve => {
    const sound = new Sound(DROP_SOUND_FILE, Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.warn('Failed to load card drop sound:', error);
        loadingPromise = null;
        resolve(null);
        return;
      }

      dropSound = sound;
      loadingPromise = null;
      resolve(sound);
    });
  });

  return loadingPromise;
}

export function initCardFeedback() {
  void loadDropSound();
}

export function releaseCardFeedback() {
  dropSound?.release();
  dropSound = null;
  loadingPromise = null;
}

export function setCardDropSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playCardDropFeedback() {

  if (!soundEnabled) return;

  void loadDropSound().then(sound => {
    if (!sound) return;

    sound.stop(() => {
      sound.play(success => {
        if (!success) {
          console.warn('Card drop sound playback failed.');
        }
      });
    });
  });
}