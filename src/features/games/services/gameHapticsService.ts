/**
 * Mobile Haptics Service for IncogTalk Arcade
 * Provides tactile vibration feedback for native app feel on mobile devices
 */

class GameHapticsService {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("incogtalk_haptics_enabled");
        if (stored !== null) {
          this.enabled = stored === "true";
        }
      } catch {
        this.enabled = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function";
  }

  public isHapticsEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  public toggle(forceState?: boolean): boolean {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("incogtalk_haptics_enabled", String(this.enabled));
      } catch {}
    }
    if (this.enabled) {
      this.light();
    }
    return this.enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on browsers with restricted permissions
    }
  }

  /** Subtle tick for UI tabs, column hover, small buttons */
  public light(): void {
    this.vibrate(12);
  }

  /** Tactile bump for chip drop, card selection, hand cricket number pick */
  public medium(): void {
    this.vibrate(28);
  }

  /** Heavy impact for timeout warnings, strikes, or turn expiration */
  public heavy(): void {
    this.vibrate(50);
  }

  /** Positive feedback: SOS line completed, Bingo line stamped, pair matched */
  public success(): void {
    this.vibrate([15, 30, 20]);
  }

  /** Match victory, series champion, or level-up celebration */
  public victory(): void {
    this.vibrate([30, 40, 30, 50, 70]);
  }

  /** Match defeat or loss */
  public defeat(): void {
    this.vibrate([60, 50, 80]);
  }

  /** Triggered the moment an opponent joins and QR modal auto-dismisses */
  public opponentJoined(): void {
    this.vibrate([25, 40, 35]);
  }

  /** Walkie-talkie Push-to-Talk activation / release */
  public ptt(): void {
    this.vibrate(18);
  }
}

export const gameHaptics = new GameHapticsService();
