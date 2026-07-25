// Advanced Web & Native Haptics Engine

export const haptics = {
  /** Generic vibration wrapper */
  vibrate: (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently fail if vibration blocked by browser policy
      }
    }
  },

  /** Light impact for subtle button taps & skips */
  impactLight: () => {
    haptics.vibrate(10);
  },

  /** Medium impact for selections and game moves */
  impactMedium: () => {
    haptics.vibrate(25);
  },

  /** Heavy impact for primary actions */
  impactHeavy: () => {
    haptics.vibrate(45);
  },

  /** Double pulse when a stranger match is found */
  matchFound: () => {
    haptics.vibrate([40, 60, 40]);
  },

  /** Ascending celebratory pulse for game victory */
  gameVictory: () => {
    haptics.vibrate([30, 40, 50, 40, 80]);
  },

  /** Low heavy pulse for game defeat */
  gameDefeat: () => {
    haptics.vibrate([100, 50, 150]);
  },
};
