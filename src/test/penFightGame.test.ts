import { describe, it, expect } from "vitest";
import {
  PEN_MODELS,
  TABLE_DIMENSIONS,
  createInitialPenRigidBody,
} from "@/features/games/data/penFightData";
import {
  simulatePhysicsStep,
  applyFlickImpulse,
  getSmartPenAIFlick,
  getPenEndpoints,
} from "@/features/games/services/penPhysicsEngine";
import { createInitialGameState } from "@/features/games/services/gameRoomService";
import { PenFightGameState } from "@/features/games/types";

describe("Pen Fight Game Physics & Logic Engine", () => {
  describe("Pen Definitions & Stats", () => {
    it("should include all 5 iconic school pens with balanced physical properties", () => {
      const penIds = Object.keys(PEN_MODELS);
      expect(penIds).toContain("pilot_v5");
      expect(penIds).toContain("reynolds_045");
      expect(penIds).toContain("trimax");
      expect(penIds).toContain("cello_gripper");
      expect(penIds).toContain("parker_vector");

      for (const id of penIds) {
        const pen = PEN_MODELS[id as keyof typeof PEN_MODELS];
        expect(pen.mass).toBeGreaterThan(0);
        expect(pen.length).toBeGreaterThan(pen.width);
        expect(pen.friction).toBeGreaterThan(0.9);
        expect(pen.friction).toBeLessThan(1);
        expect(pen.elasticity).toBeGreaterThan(0.5);
        expect(pen.elasticity).toBeLessThanOrEqual(1);
        expect(pen.primaryColor).toBeDefined();
        expect(pen.secondaryColor).toBeDefined();
        expect(pen.clipColor).toBeDefined();
        expect(pen.stats).toBeDefined();
        expect(pen.stats.weight).toBeGreaterThanOrEqual(1);
        expect(pen.stats.speed).toBeGreaterThanOrEqual(1);
        expect(pen.stats.impact).toBeGreaterThanOrEqual(1);
      }
    });

    it("should correctly position host and guest pens on opposite ends of the wooden table", () => {
      const hostPen = createInitialPenRigidBody("host", "pilot_v5", false);
      const guestPen = createInitialPenRigidBody("guest", "trimax", true);

      expect(hostPen.x).toBe(TABLE_DIMENSIONS.width / 2);
      expect(hostPen.y).toBe(TABLE_DIMENSIONS.height - 350);
      expect(hostPen.isFallen).toBe(false);
      expect(hostPen.capOn).toBe(false);
      expect(hostPen.mass).toBe(PEN_MODELS.pilot_v5.mass);

      expect(guestPen.x).toBe(TABLE_DIMENSIONS.width / 2);
      expect(guestPen.y).toBe(350);
      expect(guestPen.isFallen).toBe(false);
      expect(guestPen.capOn).toBe(true);
      // Rear cap adds +0.25 mass to base pen
      expect(guestPen.mass).toBeCloseTo(PEN_MODELS.trimax.mass + 0.25, 2);
    });
  });

  describe("Capsule Geometry & Endpoints", () => {
    it("should compute tip and tail endpoints based on pen orientation angle", () => {
      const pen = createInitialPenRigidBody("host", "pilot_v5", false);
      pen.x = 500;
      pen.y = 500;
      pen.angle = 0; // facing right (+X)

      const { tip, tail } = getPenEndpoints(pen);
      const halfLen = pen.length / 2;

      expect(tip.x).toBeCloseTo(500 + halfLen, 1);
      expect(tip.y).toBeCloseTo(500, 1);
      expect(tail.x).toBeCloseTo(500 - halfLen, 1);
      expect(tail.y).toBeCloseTo(500, 1);
    });
  });

  describe("Flick Impulse Mechanics", () => {
    it("should impart linear velocity in the direction of flick", () => {
      const pen = createInitialPenRigidBody("host", "reynolds_045", false);
      const initialVy = pen.vy;

      // Flick straight UP (-Y direction in screen space)
      const flickAngle = -Math.PI / 2;
      const flickPower = 80;

      const flicked = applyFlickImpulse(pen, flickAngle, flickPower);

      expect(flicked.vy).toBeLessThan(initialVy);
      expect(Math.abs(flicked.vx)).toBeLessThan(0.01);
    });

    it("should scale velocity proportionally with flick power", () => {
      const pen = createInitialPenRigidBody("host", "pilot_v5", false);

      const weakFlick = applyFlickImpulse(pen, -Math.PI / 2, 30);
      const strongFlick = applyFlickImpulse(pen, -Math.PI / 2, 90);

      expect(Math.abs(strongFlick.vy)).toBeGreaterThan(Math.abs(weakFlick.vy));
    });
  });

  describe("Physics Simulation & Collision Resolution", () => {
    it("should apply surface wood friction and bring moving pens to rest", () => {
      let host = createInitialPenRigidBody("host", "pilot_v5", false);
      let guest = createInitialPenRigidBody("guest", "trimax", false);

      host.vx = 8;
      host.vy = -12;
      host.va = 0.2;

      // Run multiple physics simulation steps
      for (let i = 0; i < 150; i++) {
        const result = simulatePhysicsStep(host, guest, 1 / 60);
        host = result.hostPen;
        guest = result.guestPen;
        if (result.isMotionSettled) break;
      }

      expect(host.vx).toBe(0);
      expect(host.vy).toBe(0);
      expect(host.va).toBe(0);
    });

    it("should detect desk drop when a pen exits table boundaries", () => {
      const host = createInitialPenRigidBody("host", "pilot_v5", false);
      const guest = createInitialPenRigidBody("guest", "trimax", false);

      // Move host far off table to the right
      host.x = TABLE_DIMENSIONS.width + 50;

      const result = simulatePhysicsStep(host, guest, 1 / 60);

      expect(result.hostPen.isFallen).toBe(true);
      expect(result.fallenPenId).toBe("host");
    });

    it("should resolve rigid-body collision when two pens intersect", () => {
      let host = createInitialPenRigidBody("host", "pilot_v5", false);
      let guest = createInitialPenRigidBody("guest", "trimax", false);

      // Place guest directly ahead of host
      host.x = 500;
      host.y = 700;
      guest.x = 500;
      guest.y = 550;

      // Launch host directly into guest
      host.vy = -35;
      guest.vy = 0;

      let detectedCollision = false;
      for (let i = 0; i < 40; i++) {
        const result = simulatePhysicsStep(host, guest, 1 / 60);
        host = result.hostPen;
        guest = result.guestPen;
        if (result.hasCollision) {
          detectedCollision = true;
          break;
        }
      }

      expect(detectedCollision).toBe(true);
      // Kinetic energy and momentum should be transferred to guest
      expect(guest.vy).toBeLessThan(0);
    });
  });

  describe("AI Aim & Power Strategy", () => {
    it("should calculate aim angle directly facing opponent pen with reasonable power", () => {
      const aiPen = createInitialPenRigidBody("guest", "trimax", true);
      const opponentPen = createInitialPenRigidBody("host", "pilot_v5", true);

      aiPen.x = 500;
      aiPen.y = 350;
      opponentPen.x = 500;
      opponentPen.y = 1450;

      const flick = getSmartPenAIFlick(aiPen, opponentPen, "hard");

      expect(flick).toBeDefined();
      expect(flick.power).toBeGreaterThanOrEqual(30);
      expect(flick.power).toBeLessThanOrEqual(100);

      // Target is directly below (+Y axis, angle = Math.PI / 2 = 1.57 rad)
      const expectedAngle = Math.atan2(opponentPen.y - aiPen.y, opponentPen.x - aiPen.x);
      const diff = Math.abs(flick.angle - expectedAngle);
      expect(diff).toBeLessThan(0.15); // Accurate to within ~8 degrees on hard mode
    });
  });

  describe("GameRoom State Factory for Pen Fight", () => {
    it("should initialize complete penfight gameState with two pens and default scores", () => {
      const state = createInitialGameState("penfight") as PenFightGameState;
      expect(state).toBeDefined();
      expect(state.phase).toBe("aiming");
      expect(state.roundNumber).toBe(1);
      expect(state.totalRounds).toBe(3);
      expect(state.hostPen).toBeDefined();
      expect(state.guestPen).toBeDefined();
      expect(state.hostWins).toBe(0);
      expect(state.guestWins).toBe(0);
      expect(state.commentary).toContain("Match started");
    });
  });
});
