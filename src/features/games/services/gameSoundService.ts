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
        if ((navigator as any).userActivation && !(navigator as any).userActivation.hasBeenActive) {
          return;
        }
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

  public playDraw() {
    this.vibrate([20, 20]);
    this.playTone(440, 0.1, "triangle", 0.12);
    this.playTone(440, 0.15, "sine", 0.12, 100);
  }

  public playGo() {
    this.vibrate(30);
    this.playTone(880, 0.12, "sine", 0.2);
  }

  public playTick() {
    this.playTone(1000, 0.02, "sine", 0.04);
  }

  public playHeartbeatTick() {
    this.vibrate(20);
    this.playTone(180, 0.05, "triangle", 0.18);
    this.playTone(140, 0.07, "sine", 0.15, 60);
  }

  public playCheer() {
    this.vibrate([20, 30, 40, 50]);
    this.playTone(523.25, 0.1, "sine", 0.12, 0);   // C5
    this.playTone(659.25, 0.12, "sine", 0.14, 80);  // E5
    this.playTone(783.99, 0.15, "sine", 0.15, 160); // G5
    this.playTone(1046.50, 0.25, "triangle", 0.18, 240); // C6
  }

  public playHorn() {
    this.vibrate([40, 30, 60]);
    // Dual frequency sawtooth airhorn burst
    this.playTone(466.16, 0.22, "sawtooth", 0.2, 0); // Bb4
    this.playTone(587.33, 0.22, "sawtooth", 0.18, 0); // D5
  }

  public playApplause() {
    this.vibrate([15, 15, 20, 20, 25]);
    // Rapid rhythmic bursts mimicking crowd clap
    for (let i = 0; i < 5; i++) {
      this.playTone(400 + Math.random() * 200, 0.04, "triangle", 0.08, i * 60);
    }
  }

  public playRocket() {
    this.vibrate([20, 20, 40]);
    // Rising sweep + burst
    this.playTone(300, 0.08, "sine", 0.1, 0);
    this.playTone(600, 0.08, "sine", 0.12, 60);
    this.playTone(1200, 0.15, "triangle", 0.16, 120);
  }

  public playLetterPlace(letter: "S" | "O" = "S") {
    this.vibrate(12);
    if (letter === "S") {
      this.playTone(580, 0.06, "triangle", 0.1, 0);
      this.playTone(870, 0.04, "sine", 0.08, 25);
    } else {
      this.playTone(440, 0.07, "sine", 0.12, 0);
      this.playTone(660, 0.05, "triangle", 0.09, 30);
    }
  }

  public playSOSStreak() {
    this.vibrate([25, 30, 45]);
    // Energetic ascending triad fanfare
    this.playTone(523.25, 0.08, "triangle", 0.16, 0);   // C5
    this.playTone(659.25, 0.08, "triangle", 0.16, 70);  // E5
    this.playTone(783.99, 0.12, "sine", 0.18, 140);     // G5
    this.playTone(1046.50, 0.22, "sine", 0.2, 210);     // C6
  }

  public playBonusTurn() {
    this.vibrate(20);
    this.playTone(880, 0.07, "sine", 0.14, 0);
    this.playTone(1320, 0.12, "triangle", 0.15, 60);
  }

  public playComboAscend(streakCount = 1) {
    this.vibrate([20, 25, 30, 40]);
    // Pitches up dynamically based on streak count (C5 -> E5 -> G5 -> C6 -> E6 -> G6)
    const baseFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const pitchOffset = Math.min(streakCount - 1, baseFreqs.length - 2);
    const f1 = baseFreqs[Math.max(0, pitchOffset)];
    const f2 = baseFreqs[Math.min(baseFreqs.length - 1, pitchOffset + 1)];
    const f3 = baseFreqs[Math.min(baseFreqs.length - 1, pitchOffset + 2)];

    this.playTone(f1, 0.09, "triangle", 0.18, 0);
    this.playTone(f2, 0.09, "triangle", 0.18, 60);
    this.playTone(f3, 0.18, "sine", 0.22, 120);
  }

  public playPowerUpTrigger() {
    this.vibrate([15, 20, 35]);
    // Sci-Fi Power charge sweep
    this.playTone(400, 0.08, "sine", 0.15, 0);
    this.playTone(800, 0.08, "sine", 0.18, 50);
    this.playTone(1600, 0.15, "triangle", 0.22, 100);
  }

  public playBombExplosion() {
    this.vibrate([40, 50, 80, 60]);
    // Low frequency sub-bass pulse + crunch
    this.playTone(120, 0.25, "sawtooth", 0.3, 0);
    this.playTone(80, 0.35, "triangle", 0.35, 40);
    this.playTone(50, 0.45, "sine", 0.4, 90);
  }

  public playBingoCall() {
    this.vibrate(15);
    // Hollow wooden ball drop & roll
    this.playTone(600, 0.05, "triangle", 0.12, 0);
    this.playTone(450, 0.07, "sine", 0.14, 30);
    this.playTone(300, 0.09, "sine", 0.16, 70);
  }

  public playBingoStamp() {
    this.vibrate(20);
    // Satisfying tactile stamp punch
    this.playTone(750, 0.04, "triangle", 0.14, 0);
    this.playTone(900, 0.06, "sine", 0.12, 20);
  }

  public playBingoLetterUnlock(lineIndex = 1) {
    this.vibrate([25, 30, 40]);
    // Ascending celebratory bell chime for B-I-N-G-O letters
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const f = freqs[Math.min(lineIndex - 1, freqs.length - 1)];
    this.playTone(f, 0.1, "sine", 0.18, 0);
    this.playTone(f * 1.5, 0.15, "triangle", 0.16, 80);
  }

  public playBingoWinFanfare() {
    this.vibrate([40, 40, 60, 60, 100]);
    // Glorious triumphant BINGO brass fanfare
    this.playTone(523.25, 0.12, "sine", 0.2, 0);    // C5
    this.playTone(659.25, 0.12, "sine", 0.2, 100);  // E5
    this.playTone(783.99, 0.15, "sine", 0.22, 200); // G5
    this.playTone(1046.50, 0.35, "triangle", 0.25, 300); // C6
    this.playTone(1318.51, 0.45, "sine", 0.25, 450); // E6
  }

  // ── Hand Cricket Sound Effects ──

  public playTossCoin() {
    this.vibrate(15);
    // Metallic ping of spinning coin
    this.playTone(1200, 0.05, "sine", 0.15, 0);
    this.playTone(1800, 0.08, "triangle", 0.12, 40);
    this.playTone(2400, 0.12, "sine", 0.1, 90);
  }

  public playBatHit(run = 1) {
    this.vibrate(run >= 4 ? [20, 25] : 15);
    // Solid willow bat-on-ball crack
    const pitch = 350 + run * 40;
    this.playTone(pitch, 0.06, "triangle", 0.2, 0);
    this.playTone(pitch * 1.5, 0.08, "sine", 0.15, 20);
  }

  public playBoundaryFour() {
    this.vibrate([20, 30, 40]);
    // Energetic double-chime for FOUR
    this.playTone(587.33, 0.08, "sine", 0.16, 0);   // D5
    this.playTone(783.99, 0.08, "sine", 0.18, 80);  // G5
    this.playTone(987.77, 0.18, "triangle", 0.2, 160); // B5
  }

  public playBoundarySix() {
    this.vibrate([30, 40, 50, 60]);
    // Stadium maximum SIX stadium fanfare
    this.playTone(523.25, 0.09, "sine", 0.18, 0);   // C5
    this.playTone(659.25, 0.09, "sine", 0.2, 70);   // E5
    this.playTone(783.99, 0.1, "sine", 0.22, 140);  // G5
    this.playTone(1046.50, 0.25, "triangle", 0.25, 210); // C6
    this.playTone(1318.51, 0.35, "sine", 0.22, 320); // E6
  }

  public playWicket() {
    this.vibrate([50, 40, 80]);
    // Stumps shattered: low crunch + descending slide
    this.playTone(250, 0.12, "sawtooth", 0.25, 0);
    this.playTone(160, 0.18, "triangle", 0.25, 60);
    this.playTone(90, 0.3, "sine", 0.3, 140);
  }

  public playUmpireWhistle() {
    this.vibrate(20);
    // Two quick high whistle bursts
    this.playTone(2200, 0.06, "sine", 0.14, 0);
    this.playTone(2600, 0.1, "sine", 0.16, 80);
  }
}

export const gameAudio = new GameSoundSynthesizer();
