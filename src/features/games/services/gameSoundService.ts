// Pure Web Audio synthesizer with tactile haptic feedback for zero-asset game audio

class GameSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      this.muted = localStorage.getItem("livetalk_games_muted") === "true";
    } catch {
      this.muted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem("livetalk_games_muted", String(this.muted));
    } catch {}
    return this.muted;
  }

  public vibrate(pattern: number | number[] = 15) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.12, startDelay = 0) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(volume, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + duration);
        } catch {}
      }, startDelay);
    } catch {}
  }

  public playClick() {
    this.vibrate(10);
    this.playTone(550, 0.05, "sine", 0.08);
  }

  public playMove() {
    this.vibrate(15);
    this.playTone(440, 0.07, "triangle", 0.1);
    this.playTone(660, 0.07, "sine", 0.08, 40);
  }

  public playDrop() {
    this.vibrate(25);
    this.playTone(320, 0.09, "triangle", 0.14);
    this.playTone(220, 0.12, "sine", 0.12, 50);
  }

  public playFlip() {
    this.vibrate(12);
    this.playTone(700, 0.04, "sine", 0.06);
  }

  public playMatch() {
    this.vibrate([20, 30, 40]);
    this.playTone(523.25, 0.09, "sine", 0.1); // C5
    this.playTone(659.25, 0.09, "sine", 0.1, 70); // E5
    this.playTone(783.99, 0.15, "sine", 0.12, 140); // G5
  }

  public playWin() {
    this.vibrate([30, 40, 60, 40, 80]);
    this.playTone(523.25, 0.1, "sine", 0.15); // C5
    this.playTone(659.25, 0.1, "sine", 0.15, 90); // E5
    this.playTone(783.99, 0.1, "sine", 0.15, 180); // G5
    this.playTone(1046.50, 0.35, "triangle", 0.18, 270); // C6
  }

  public playLose() {
    this.vibrate([60, 40, 80]);
    this.playTone(392.00, 0.15, "sawtooth", 0.1); // G4
    this.playTone(329.63, 0.15, "sawtooth", 0.1, 120); // E4
    this.playTone(261.63, 0.3, "sawtooth", 0.12, 240); // C4
  }

  public playGo() {
    this.vibrate(30);
    this.playTone(880, 0.12, "sine", 0.2);
  }

  public playTick() {
    this.playTone(1000, 0.02, "sine", 0.04);
  }
}

export const gameAudio = new GameSoundSynthesizer();
