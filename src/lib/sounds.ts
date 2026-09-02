// Web Audio API sound effects — no external files needed

interface CustomWindow extends Window {
  __echoAudioCtx?: AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const audioCtx = () => {
  const win = window as unknown as CustomWindow;
  if (!win.__echoAudioCtx) {
    win.__echoAudioCtx = new (window.AudioContext || win.webkitAudioContext!)();
  }
  return win.__echoAudioCtx;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) => {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio context not available
  }
};

import { haptics } from "./haptics";
export { haptics };

export const sounds = {
  /** Two-tone ascending chime when stranger connects */
  connected: () => {
    playTone(523, 0.15, "sine", 0.12); // C5
    setTimeout(() => playTone(659, 0.2, "sine", 0.12), 120); // E5
    setTimeout(() => playTone(784, 0.3, "sine", 0.10), 240); // G5
  },

  /** Soft pop when a message arrives */
  messageReceived: () => {
    playTone(880, 0.08, "sine", 0.1);
    setTimeout(() => playTone(1047, 0.12, "sine", 0.08), 60);
  },

  /** Low tone when stranger disconnects */
  disconnected: () => {
    playTone(440, 0.15, "sine", 0.1); // A4
    setTimeout(() => playTone(330, 0.25, "sine", 0.08), 120); // E4
  },

  /** Subtle tick for sent messages */
  messageSent: () => {
    playTone(1200, 0.05, "sine", 0.06);
  },

  /** Fun sparkly tone for surprise effects */
  surprise: () => {
    playTone(880, 0.1, "sine", 0.08);
    playTone(1108, 0.1, "sine", 0.08); // C#6
    setTimeout(() => playTone(1318, 0.15, "sine", 0.06), 60); // E6
    setTimeout(() => playTone(1760, 0.2, "sine", 0.04), 120); // A6
  },

  /** Start loop for incoming or outgoing ringtone */
  startRingtone: (type: "incoming" | "outgoing" = "incoming") => {
    // Clear any existing ringtone loop
    sounds.stopRingtone();

    const playCycle = () => {
      if (type === "incoming") {
        // Melodic 2-burst marimba/phone ringtone chime
        playTone(659, 0.15, "triangle", 0.22); // E5
        setTimeout(() => playTone(880, 0.18, "triangle", 0.24), 140); // A5
        setTimeout(() => playTone(987, 0.25, "triangle", 0.20), 280); // B5
        setTimeout(() => {
          playTone(659, 0.15, "triangle", 0.22);
          setTimeout(() => playTone(880, 0.18, "triangle", 0.24), 140);
          setTimeout(() => playTone(1318, 0.35, "triangle", 0.22), 280); // E6
        }, 550);

        // Haptic phone ring vibration loop for mobile devices
        haptics.vibrate([400, 250, 400, 1200]);
      } else {
        // Soft standard PBX outgoing dial ringback pulse
        playTone(440, 1.2, "sine", 0.10);
        playTone(480, 1.2, "sine", 0.08);
      }
    };

    playCycle();
    const intervalId = setInterval(playCycle, type === "incoming" ? 2400 : 3500);
    (window as any).__echoRingtoneInterval = intervalId;
  },

  /** Stop any currently playing ringtone or vibration */
  stopRingtone: () => {
    if (typeof window !== "undefined" && (window as any).__echoRingtoneInterval) {
      clearInterval((window as any).__echoRingtoneInterval);
      (window as any).__echoRingtoneInterval = null;
    }
    // Cancel any active vibration
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Silently ignore
      }
    }
  },
};

