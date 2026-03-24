import { useCallback, useRef } from "react";

/**
 * Uses the Web Audio API to produce subtle notification pings.
 * No external sound files needed — all generated programmatically.
 */
export const useSoundNotifications = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  /** Double rising ping — played when a stranger connects */
  const playConnect = useCallback(() => {
    try {
      const ctx = getCtx();
      const notes = [880, 1100]; // A5 → C#6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  /** Single falling tone — played when a stranger disconnects */
  const playDisconnect = useCallback(() => {
    try {
      const ctx = getCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(660, ctx.currentTime);         // E5
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.25); // A4

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  return { playConnect, playDisconnect };
};
