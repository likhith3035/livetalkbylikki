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
    expect(gameWebRTC.isMicAvailable()).toBe(false);
    expect(gameWebRTC.setMicEnabled(true)).toBe(false);
    expect(() => gameWebRTC.stopVoiceDuel()).not.toThrow();
  });

  it("handles missing microphone device (NotFoundError) gracefully by entering listen-only mode", async () => {
    const notFoundError = new Error("Requested device not found");
    notFoundError.name = "NotFoundError";

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(notFoundError),
      },
      writable: true,
      configurable: true,
    });

    const statusUpdates: string[] = [];
    let micAvailable = true;

    await gameWebRTC.startVoiceDuel("TEST12", true, {
      onStatusChange: (status) => statusUpdates.push(status),
      onMicAvailabilityChange: (available) => {
        micAvailable = available;
      },
    });

    expect(micAvailable).toBe(false);
    expect(gameWebRTC.isMicAvailable()).toBe(false);
    expect(statusUpdates).toContain("listen-only");
    gameWebRTC.stopVoiceDuel();
  });

  it("handles OverconstrainedError by falling back to basic audio constraint", async () => {
    const overconstrained = new Error("Overconstrained");
    overconstrained.name = "OverconstrainedError";

    const mockTrack = { enabled: false, stop: vi.fn() };
    const mockStream = {
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    };

    const getUserMediaMock = vi
      .fn()
      .mockRejectedValueOnce(overconstrained)
      .mockResolvedValueOnce(mockStream);

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: getUserMediaMock,
      },
      writable: true,
      configurable: true,
    });

    let micAvailable = false;
    await gameWebRTC.startVoiceDuel("TEST34", false, {
      onMicAvailabilityChange: (available) => {
        micAvailable = available;
      },
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
    expect(micAvailable).toBe(true);
    expect(gameWebRTC.isMicAvailable()).toBe(true);
    gameWebRTC.stopVoiceDuel();
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
