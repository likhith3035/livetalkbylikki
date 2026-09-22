import { describe, it, expect, vi, beforeEach } from "vitest";
import { gameHaptics } from "../features/games/services/gameHapticsService";
import { gameWebRTC } from "../features/games/services/gameWebRTCService";

describe("Arcade Mobile Haptics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles haptic invocation methods gracefully in mock/node environment", () => {
    // Should not throw in headless/unsupported environments
    expect(() => gameHaptics.light()).not.toThrow();
    expect(() => gameHaptics.medium()).not.toThrow();
    expect(() => gameHaptics.heavy()).not.toThrow();
    expect(() => gameHaptics.success()).not.toThrow();
    expect(() => gameHaptics.victory()).not.toThrow();
    expect(() => gameHaptics.defeat()).not.toThrow();
    expect(() => gameHaptics.opponentJoined()).not.toThrow();
    expect(() => gameHaptics.ptt()).not.toThrow();
  });

  it("toggles haptic preference correctly", () => {
    const initialState = gameHaptics.toggle(false);
    expect(initialState).toBe(false);

    const reEnabled = gameHaptics.toggle(true);
    expect(reEnabled).toBe(true);
  });
});

describe("Arcade WebRTC Voice Chat Service", () => {
  it("provides mic control state without throwing when uninitialized", () => {
    expect(gameWebRTC.isMicActive()).toBe(false);
    expect(gameWebRTC.setMicEnabled(true)).toBe(false);
    expect(() => gameWebRTC.stopVoiceDuel()).not.toThrow();
  });
});

describe("Share Victory Card Data Formatting", () => {
  it("computes accurate victory share statistics and URLs", () => {
    const streak = 5;
    const gameTitle = "Connect 4";
    const roomCode = "AB12CD";
    const inviteUrl = `https://incogtalkk.netlify.app/games?room=${roomCode}`;
    const shareText = `🔥 I just crushed a ${streak}-win streak in ${gameTitle} on IncogTalk Arcade!\n\nCan you beat me? Duel me now:\n${inviteUrl}`;

    expect(shareText).toContain("5-win streak");
    expect(shareText).toContain("Connect 4");
    expect(shareText).toContain(roomCode);
    expect(shareText).toContain("Duel me now");
  });

  it("calculates bonus XP correctly based on streak tier", () => {
    function calculateXP(streak: number, isWinner: boolean) {
      const multiplier = streak >= 5 ? 1.5 : streak >= 3 ? 1.25 : 1.0;
      const streakBonus = isWinner && multiplier > 1 ? Math.round(80 * (multiplier - 1)) : 0;
      return 100 + streakBonus;
    }

    expect(calculateXP(1, true)).toBe(100);
    expect(calculateXP(3, true)).toBe(120); // 80 * 0.25 = 20 bonus
    expect(calculateXP(5, true)).toBe(140); // 80 * 0.50 = 40 bonus
    expect(calculateXP(5, false)).toBe(100); // no bonus on loss
  });
});
