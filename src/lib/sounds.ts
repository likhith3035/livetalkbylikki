// Web Audio API sound effects — no external files needed

const audioCtx = () => {
  if (!(window as any).__echoAudioCtx) {
    (window as any).__echoAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__echoAudioCtx as AudioContext;
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
};
