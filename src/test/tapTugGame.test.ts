import { describe, it, expect } from 'vitest';
import type { TapTugGameState, TapTugPowerUp } from '../features/games/types';

// Pure logic helper functions matching the TapTug game engine for unit test verification
export function calculatePushForce(
  baseForce: number,
  isOverdrive: boolean,
  hasDoublePower: boolean,
  targetHasShield: boolean
): number {
  let force = baseForce;
  if (isOverdrive) {
    force *= 1.75;
  }
  if (hasDoublePower) {
    force *= 2.0;
  }
  if (targetHasShield) {
    force *= 0.25; // 75% absorbed
  }
  return force;
}

export function applyTap(
  currentState: TapTugGameState,
  player: 'p1' | 'p2',
  force: number
): { nextPos: number; isKO: boolean; winner: 'p1' | 'p2' | null } {
  // If player is frozen, tap has 0 effect
  const isFrozen = player === 'p1' ? currentState.p1FrozenUntil > Date.now() : currentState.p2FrozenUntil > Date.now();
  if (isFrozen) {
    return {
      nextPos: currentState.ropePos,
      isKO: false,
      winner: null,
    };
  }

  // p1 pushes towards 100%, p2 pulls towards 0%
  let nextPos = currentState.ropePos + (player === 'p1' ? force : -force);
  nextPos = Math.max(0, Math.min(100, nextPos));

  if (nextPos >= 100) {
    return { nextPos: 100, isKO: true, winner: 'p1' };
  }
  if (nextPos <= 0) {
    return { nextPos: 0, isKO: true, winner: 'p2' };
  }

  return { nextPos, isKO: false, winner: null };
}

export function resolveTimeoutWinner(
  ropePos: number,
  p1Taps: number,
  p2Taps: number
): 'p1' | 'p2' | 'draw' {
  if (ropePos > 52) return 'p1';
  if (ropePos < 48) return 'p2';
  // Deadlock center: fallback to total tap count
  if (p1Taps > p2Taps) return 'p1';
  if (p2Taps > p1Taps) return 'p2';
  return 'draw';
}

describe('Tap Blitz / Tug of War Game Engine', () => {
  it('correctly calculates basic push force', () => {
    const force = calculatePushForce(1.2, false, false, false);
    expect(force).toBeCloseTo(1.2);
  });

  it('amplifies push force by 1.75x in Overdrive heat mode', () => {
    const force = calculatePushForce(1.0, true, false, false);
    expect(force).toBeCloseTo(1.75);
  });

  it('amplifies push force by 2.0x when 2X Overcharge power-up is active', () => {
    const force = calculatePushForce(1.0, false, true, false);
    expect(force).toBeCloseTo(2.0);
  });

  it('stacks Overdrive (1.75x) and 2X Overcharge for massive 3.5x boost', () => {
    const force = calculatePushForce(1.0, true, true, false);
    expect(force).toBeCloseTo(3.5);
  });

  it('kinetic shield absorbs 75% of incoming push force (reduces to 25%)', () => {
    const force = calculatePushForce(2.0, false, false, true);
    expect(force).toBeCloseTo(0.5);
  });

  it('clamps rope position between 0 and 100', () => {
    const mockState: TapTugGameState = {
      ropePos: 98,
      p1Taps: 50,
      p2Taps: 50,
      p1Heat: 100,
      p2Heat: 50,
      p1PowerUp: null,
      p2PowerUp: null,
      p1FrozenUntil: 0,
      p2FrozenUntil: 0,
      p1ShieldUntil: 0,
      p2ShieldUntil: 0,
      p1DoubleTapsLeft: 0,
      p2DoubleTapsLeft: 0,
      lastTapPlayer: null,
      isKO: false,
    };

    const res = applyTap(mockState, 'p1', 5.0);
    expect(res.nextPos).toBe(100);
    expect(res.isKO).toBe(true);
    expect(res.winner).toBe('p1');
  });

  it('triggers instant KO when player 2 pulls rope to 0', () => {
    const mockState: TapTugGameState = {
      ropePos: 2,
      p1Taps: 10,
      p2Taps: 30,
      p1Heat: 0,
      p2Heat: 80,
      p1PowerUp: null,
      p2PowerUp: null,
      p1FrozenUntil: 0,
      p2FrozenUntil: 0,
      p1ShieldUntil: 0,
      p2ShieldUntil: 0,
      p1DoubleTapsLeft: 0,
      p2DoubleTapsLeft: 0,
      lastTapPlayer: null,
      isKO: false,
    };

    const res = applyTap(mockState, 'p2', 4.0);
    expect(res.nextPos).toBe(0);
    expect(res.isKO).toBe(true);
    expect(res.winner).toBe('p2');
  });

  it('prevents taps from registering when player is under Freeze lock', () => {
    const futureTime = Date.now() + 5000;
    const mockState: TapTugGameState = {
      ropePos: 50,
      p1Taps: 20,
      p2Taps: 20,
      p1Heat: 50,
      p2Heat: 50,
      p1PowerUp: null,
      p2PowerUp: null,
      p1FrozenUntil: futureTime,
      p2FrozenUntil: 0,
      p1ShieldUntil: 0,
      p2ShieldUntil: 0,
      p1DoubleTapsLeft: 0,
      p2DoubleTapsLeft: 0,
      lastTapPlayer: null,
      isKO: false,
    };

    const res = applyTap(mockState, 'p1', 3.0);
    expect(res.nextPos).toBe(50); // Unchanged!
    expect(res.isKO).toBe(false);
    expect(res.winner).toBe(null);
  });

  it('resolves timeout winner by dominant territory (>52% or <48%)', () => {
    expect(resolveTimeoutWinner(55, 100, 120)).toBe('p1');
    expect(resolveTimeoutWinner(45, 120, 100)).toBe('p2');
  });

  it('breaks deadlock center ties using total tap count when time expires', () => {
    expect(resolveTimeoutWinner(50, 85, 80)).toBe('p1');
    expect(resolveTimeoutWinner(50, 75, 90)).toBe('p2');
    expect(resolveTimeoutWinner(50, 80, 80)).toBe('draw');
  });
});
