import { PenRigidBody, PenModelId, PenSurfaceType, ReplayFrame } from "../types";
import { PEN_MODELS, TABLE_DIMENSIONS, SURFACE_TYPES } from "../data/penFightData";

export interface PhysicsStepResult {
  hostPen: PenRigidBody;
  guestPen: PenRigidBody;
  hasCollision: boolean;
  collisionIntensity: number; // 0 to 1
  isMotionSettled: boolean;
  fallenPenId?: "host" | "guest" | "both" | null;
  edgeBounced?: "host" | "guest" | null; // Track wall bounces for bank shot detection
  collisionPoint?: { x: number; y: number } | null;
}

// ── Math & Geometry Helpers ──

interface Vector2D {
  x: number;
  y: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

function cross2D(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

function distSq(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Calculates closest points between two 2D line segments AB and CD
 */
function closestPointsBetweenSegments(
  a: Vector2D,
  b: Vector2D,
  c: Vector2D,
  d: Vector2D
): { p1: Vector2D; p2: Vector2D } {
  const d1 = { x: b.x - a.x, y: b.y - a.y };
  const d2 = { x: d.x - c.x, y: d.y - c.y };
  const r = { x: a.x - c.x, y: a.y - c.y };

  const a1 = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);

  let s = 0;
  let t = 0;

  if (a1 <= 0.0001 && e <= 0.0001) {
    return { p1: a, p2: c };
  }
  if (a1 <= 0.0001) {
    s = 0;
    t = clamp(f / e, 0, 1);
  } else {
    const c1 = dot(d1, r);
    if (e <= 0.0001) {
      t = 0;
      s = clamp(-c1 / a1, 0, 1);
    } else {
      const b1 = dot(d1, d2);
      const denom = a1 * e - b1 * b1;

      if (denom !== 0) {
        s = clamp((b1 * f - c1 * e) / denom, 0, 1);
      } else {
        s = 0;
      }

      t = (b1 * s + f) / e;

      if (t < 0) {
        t = 0;
        s = clamp(-c1 / a1, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b1 - c1) / a1, 0, 1);
      }
    }
  }

  const p1 = { x: a.x + d1.x * s, y: a.y + d1.y * s };
  const p2 = { x: c.x + d2.x * t, y: c.y + d2.y * t };
  return { p1, p2 };
}

/**
 * Returns the line segment endpoints (tail and tip) of a pen
 */
export function getPenEndpoints(pen: PenRigidBody): { tail: Vector2D; tip: Vector2D } {
  const halfLen = pen.length / 2;
  const cos = Math.cos(pen.angle);
  const sin = Math.sin(pen.angle);

  // Tip is forward along angle, tail is backward
  const tip = {
    x: pen.x + cos * halfLen,
    y: pen.y + sin * halfLen,
  };
  const tail = {
    x: pen.x - cos * halfLen,
    y: pen.y - sin * halfLen,
  };

  return { tail, tip };
}

/**
 * Calculates moment of inertia for a pen around its center of mass
 */
function getMomentOfInertia(pen: PenRigidBody): number {
  return (1 / 12) * pen.mass * (pen.length * pen.length + pen.width * pen.width);
}

/**
 * Applies an impulse flick to a pen
 */
export function applyFlickImpulse(
  pen: PenRigidBody,
  angle: number,
  power: number // 0 to 100
): PenRigidBody {
  const model = PEN_MODELS[pen.modelId] || PEN_MODELS.pilot_v5;
  const powerScale = 0.55 * (model.powerMultiplier || 1.0);

  // Normalize power (exponential feeling curve for control)
  const normPower = Math.pow(power / 100, 1.25) * 65 * powerScale;

  const impulseX = Math.cos(angle) * normPower;
  const impulseY = Math.sin(angle) * normPower;

  // Calculate realistic angular torque based on angle between flick direction and pen body
  // Flicking along the axis gives straight drive; flicking sideways imparts heavy rotational spin
  const angleDiff = angle - pen.angle;
  const torque = Math.sin(angleDiff) * 0.24 * (normPower / (pen.mass * 15));
  const subtleNoise = (Math.random() - 0.5) * 0.04 * (power / 100);

  return {
    ...pen,
    vx: impulseX / pen.mass,
    vy: impulseY / pen.mass,
    va: pen.va + torque + subtleNoise,
    edgeBounceCount: 0, // Reset for trick shot tracking
    totalRotations: 0,
  };
}

/**
 * Gets the effective friction for a pen on a given surface
 */
function getEffectiveFriction(pen: PenRigidBody, surfaceType: PenSurfaceType): number {
  const model = PEN_MODELS[pen.modelId] || PEN_MODELS.pilot_v5;
  const surface = SURFACE_TYPES[surfaceType] || SURFACE_TYPES.classic_wood;

  let baseFriction = model.friction;

  // Apply surface multiplier
  baseFriction = Math.min(0.998, baseFriction * surface.frictionMultiplier);

  // Ink splash debuff: reduce friction (more slide)
  if (pen.isInkSplashed) {
    baseFriction = Math.min(0.998, baseFriction * 1.015);
  }

  return baseFriction;
}

/**
 * Executes a single physics simulation tick (dt) with surface effects
 */
export function simulatePhysicsStep(
  host: PenRigidBody,
  guest: PenRigidBody,
  dt: number = 1 / 60,
  surfaceType: PenSurfaceType = "classic_wood"
): PhysicsStepResult {
  const p1 = { ...host };
  const p2 = { ...guest };

  const surface = SURFACE_TYPES[surfaceType] || SURFACE_TYPES.classic_wood;

  let hasCollision = false;
  let collisionIntensity = 0;
  let edgeBounced: "host" | "guest" | null = null;
  let collisionPoint: { x: number; y: number } | null = null;

  const friction1 = getEffectiveFriction(p1, surfaceType);
  const friction2 = getEffectiveFriction(p2, surfaceType);

  // 1. Position & Angle Integration (if on table or falling in air)
  if (!p1.isFallen) {
    p1.x += p1.vx;
    p1.y += p1.vy;
    p1.angle += p1.va;

    // Track total rotations for spin kill detection
    p1.totalRotations = (p1.totalRotations || 0) + Math.abs(p1.va) / (Math.PI * 2);

    // Table surface friction damping
    p1.vx *= friction1;
    p1.vy *= friction1;
    p1.va *= 0.94; // Rotational air & surface damping

    // Wet desk random drift
    if (surface.driftEnabled && (Math.abs(p1.vx) > 0.5 || Math.abs(p1.vy) > 0.5)) {
      const driftForce = surface.driftIntensity * 0.35;
      p1.vx += (Math.random() - 0.5) * driftForce;
      p1.vy += (Math.random() - 0.5) * driftForce;
      p1.va += (Math.random() - 0.5) * driftForce * 0.02;
    }

    // Threshold cutoff for rest
    if (Math.abs(p1.vx) < 0.08 && Math.abs(p1.vy) < 0.08) {
      p1.vx = 0;
      p1.vy = 0;
    }
    if (Math.abs(p1.va) < 0.003) {
      p1.va = 0;
    }
  } else {
    // Falling off table 3D tumble physics
    p1.x += p1.vx;
    p1.y += p1.vy;
    p1.angle += p1.va;
    p1.fallenZ = Math.min(100, (p1.fallenZ || 0) + 4.5);
    p1.va *= 0.98;
    p1.vx *= 0.92;
    p1.vy *= 0.92;
  }

  if (!p2.isFallen) {
    p2.x += p2.vx;
    p2.y += p2.vy;
    p2.angle += p2.va;

    // Track total rotations
    p2.totalRotations = (p2.totalRotations || 0) + Math.abs(p2.va) / (Math.PI * 2);

    p2.vx *= friction2;
    p2.vy *= friction2;
    p2.va *= 0.94;

    // Wet desk random drift
    if (surface.driftEnabled && (Math.abs(p2.vx) > 0.5 || Math.abs(p2.vy) > 0.5)) {
      const driftForce = surface.driftIntensity * 0.35;
      p2.vx += (Math.random() - 0.5) * driftForce;
      p2.vy += (Math.random() - 0.5) * driftForce;
      p2.va += (Math.random() - 0.5) * driftForce * 0.02;
    }

    if (Math.abs(p2.vx) < 0.08 && Math.abs(p2.vy) < 0.08) {
      p2.vx = 0;
      p2.vy = 0;
    }
    if (Math.abs(p2.va) < 0.003) {
      p2.va = 0;
    }
  } else {
    // Falling off table 3D tumble physics
    p2.x += p2.vx;
    p2.y += p2.vy;
    p2.angle += p2.va;
    p2.fallenZ = Math.min(100, (p2.fallenZ || 0) + 4.5);
    p2.va *= 0.98;
    p2.vx *= 0.92;
    p2.vy *= 0.92;
  }

  // 2. Rigid-Body Capsule Collision Detection (Pen A vs Pen B)
  if (!p1.isFallen && !p2.isFallen) {
    const end1 = getPenEndpoints(p1);
    const end2 = getPenEndpoints(p2);

    const { p1: closest1, p2: closest2 } = closestPointsBetweenSegments(
      end1.tail,
      end1.tip,
      end2.tail,
      end2.tip
    );

    const dSq = distSq(closest1, closest2);
    const radius1 = p1.width / 2;
    const radius2 = p2.width / 2;
    const radiusSum = radius1 + radius2;

    if (dSq < radiusSum * radiusSum) {
      // Check if shielded
      if (p1.hasShield) {
        p1.hasShield = false;
        // Deflect: only p2 gets impulse
        p2.vx *= -0.6;
        p2.vy *= -0.6;
        hasCollision = true;
        collisionIntensity = 0.5;
        collisionPoint = { x: (closest1.x + closest2.x) / 2, y: (closest1.y + closest2.y) / 2 };
      } else if (p2.hasShield) {
        p2.hasShield = false;
        p1.vx *= -0.6;
        p1.vy *= -0.6;
        hasCollision = true;
        collisionIntensity = 0.5;
        collisionPoint = { x: (closest1.x + closest2.x) / 2, y: (closest1.y + closest2.y) / 2 };
      } else {
        hasCollision = true;
        const d = Math.sqrt(dSq);
        const penetration = radiusSum - d;

        // Collision Normal pointing from Pen 2 to Pen 1
        let normal: Vector2D;
        if (d > 0.001) {
          normal = {
            x: (closest1.x - closest2.x) / d,
            y: (closest1.y - closest2.y) / d,
          };
        } else {
          // Fallback for collinear or deeply overlapping segments
          const cdx = p1.x - p2.x;
          const cdy = p1.y - p2.y;
          const cdist = Math.hypot(cdx, cdy) || 0.001;
          normal = {
            x: cdx / cdist,
            y: cdy / cdist,
          };
        }

        // Contact point
        const contact = {
          x: (closest1.x + closest2.x) / 2,
          y: (closest1.y + closest2.y) / 2,
        };
        collisionPoint = contact;

        // Relative lever arms
        const r1 = { x: contact.x - p1.x, y: contact.y - p1.y };
        const r2 = { x: contact.x - p2.x, y: contact.y - p2.y };

        const model1 = PEN_MODELS[p1.modelId] || PEN_MODELS.pilot_v5;
        const model2 = PEN_MODELS[p2.modelId] || PEN_MODELS.pilot_v5;

        // Point velocities: v_p = v + va x r
        const vp1 = { x: p1.vx - p1.va * r1.y, y: p1.vy + p1.va * r1.x };
        const vp2 = { x: p2.vx - p2.va * r2.y, y: p2.vy + p2.va * r2.x };

        const vrel = { x: vp1.x - vp2.x, y: vp1.y - vp2.y };
        const vnormal = dot(vrel, normal);

        if (vnormal < 0) {
          // Approaching each other -> resolve impulse
          const e = (model1.elasticity + model2.elasticity) / 2;
          const I1 = getMomentOfInertia(p1);
          const I2 = getMomentOfInertia(p2);

          const r1CrossN = cross2D(r1, normal);
          const r2CrossN = cross2D(r2, normal);

          const impulseMag =
            (-(1 + e) * vnormal) /
            (1 / p1.mass +
              1 / p2.mass +
              (r1CrossN * r1CrossN) / I1 +
              (r2CrossN * r2CrossN) / I2);

          const impulse = { x: impulseMag * normal.x, y: impulseMag * normal.y };

          // Linear impulse
          p1.vx += impulse.x / p1.mass;
          p1.vy += impulse.y / p1.mass;
          p2.vx -= impulse.x / p2.mass;
          p2.vy -= impulse.y / p2.mass;

          // Angular impulse
          p1.va += (r1.x * impulse.y - r1.y * impulse.x) / I1;
          p2.va -= (r2.x * impulse.y - r2.y * impulse.x) / I2;

          // Positional separation to prevent interpenetration
          const separation = penetration * 0.52;
          p1.x += normal.x * separation;
          p1.y += normal.y * separation;
          p2.x -= normal.x * separation;
          p2.y -= normal.y * separation;

          collisionIntensity = Math.min(1, Math.abs(vnormal) / 12);
        }
      }
    }
  }

  // 3. Table Edge Boundary & Drop Checks with edge bounce tracking
  const table = TABLE_DIMENSIONS;
  let fallenPenId: "host" | "guest" | null = null;

  // Check Pen 1 Table Bounds
  if (!p1.isFallen) {
    const isOut =
      p1.x < 0 || p1.x > table.width || p1.y < 0 || p1.y > table.height;
    if (isOut) {
      p1.isFallen = true;
      p1.fallenZ = 0;
      fallenPenId = "host";
    } else {
      // Side-bevel bounce detection (with velocity direction check so it only triggers once per bounce)
      const edgeMargin = p1.width;
      if (p1.x < edgeMargin && p1.vx < -1.5) {
        p1.vx = -p1.vx * 0.45;
        p1.edgeBounceCount = (p1.edgeBounceCount || 0) + 1;
        edgeBounced = "host";
      } else if (p1.x > table.width - edgeMargin && p1.vx > 1.5) {
        p1.vx = -p1.vx * 0.45;
        p1.edgeBounceCount = (p1.edgeBounceCount || 0) + 1;
        edgeBounced = "host";
      }

      // Calculate teeter edge progress if near table boundaries
      const distToEdge = Math.min(
        p1.x,
        table.width - p1.x,
        p1.y,
        table.height - p1.y
      );
      if (distToEdge < table.beveledEdgeWidth + p1.length * 0.25) {
        p1.teeterProgress = Math.min(
          1,
          (table.beveledEdgeWidth + p1.length * 0.25 - distToEdge) / 35
        );
      } else {
        p1.teeterProgress = 0;
      }
    }
  }

  // Check Pen 2 Table Bounds
  if (!p2.isFallen) {
    const isOut =
      p2.x < 0 || p2.x > table.width || p2.y < 0 || p2.y > table.height;
    if (isOut) {
      p2.isFallen = true;
      p2.fallenZ = 0;
      fallenPenId = fallenPenId ? "both" : "guest";
    } else {
      const edgeMargin = p2.width;
      if (p2.x < edgeMargin && p2.vx < -1.5) {
        p2.vx = -p2.vx * 0.45;
        p2.edgeBounceCount = (p2.edgeBounceCount || 0) + 1;
        if (!edgeBounced) edgeBounced = "guest";
      } else if (p2.x > table.width - edgeMargin && p2.vx > 1.5) {
        p2.vx = -p2.vx * 0.45;
        p2.edgeBounceCount = (p2.edgeBounceCount || 0) + 1;
        if (!edgeBounced) edgeBounced = "guest";
      }

      const distToEdge = Math.min(
        p2.x,
        table.width - p2.x,
        p2.y,
        table.height - p2.y
      );
      if (distToEdge < table.beveledEdgeWidth + p2.length * 0.25) {
        p2.teeterProgress = Math.min(
          1,
          (table.beveledEdgeWidth + p2.length * 0.25 - distToEdge) / 35
        );
      } else {
        p2.teeterProgress = 0;
      }
    }
  }

  // 4. Motion Settlement Check
  const isHostSettled =
    p1.isFallen ||
    (Math.abs(p1.vx) === 0 && Math.abs(p1.vy) === 0 && Math.abs(p1.va) === 0);
  const isGuestSettled =
    p2.isFallen ||
    (Math.abs(p2.vx) === 0 && Math.abs(p2.vy) === 0 && Math.abs(p2.va) === 0);

  const isMotionSettled = isHostSettled && isGuestSettled;

  return {
    hostPen: p1,
    guestPen: p2,
    hasCollision,
    collisionIntensity,
    isMotionSettled,
    fallenPenId,
    edgeBounced,
    collisionPoint,
  };
}

/**
 * Smart AI Aiming Algorithm ("Backbench King AI")
 * Calculates angle and power to strike the human player's pen towards the nearest table boundary!
 */
export function getSmartPenAIFlick(
  aiPen: PenRigidBody,
  opponentPen: PenRigidBody,
  difficulty: "easy" | "medium" | "hard" = "medium"
): { angle: number; power: number } {
  const table = TABLE_DIMENSIONS;

  // 1. Calculate opponent's distance to closest table edge
  const distToLeft = opponentPen.x;
  const distToRight = table.width - opponentPen.x;
  const distToTop = opponentPen.y;
  const distToBottom = table.height - opponentPen.y;

  const minEdgeDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

  // Target vector: Aim directly at opponent pen center
  const dx = opponentPen.x - aiPen.x;
  const dy = opponentPen.y - aiPen.y;
  let idealAngle = Math.atan2(dy, dx);

  // Distance between pens
  const penDist = Math.sqrt(dx * dx + dy * dy);

  // Dynamic power calculation: more power if far away or opponent is heavy
  let basePower = clamp((penDist / 1200) * 85 + 25, 40, 95);

  // Strategic push boost: if opponent is near edge, deliver a heavy knockout blow!
  if (minEdgeDist < 250) {
    basePower = Math.min(100, basePower + 18);
  }

  // Humanize angle based on AI difficulty tier
  let jitterAngle = 0;
  if (difficulty === "easy") {
    jitterAngle = (Math.random() - 0.5) * 0.35; // ~20 deg spread
    basePower *= 0.85;
  } else if (difficulty === "medium") {
    jitterAngle = (Math.random() - 0.5) * 0.12; // ~7 deg spread
  } else {
    // Hard: precision needle shot
    jitterAngle = (Math.random() - 0.5) * 0.03;
    basePower = clamp(basePower, 65, 100);
  }

  return {
    angle: idealAngle + jitterAngle,
    power: Math.round(basePower),
  };
}

/**
 * Capture a replay frame from current physics state
 */
export function captureReplayFrame(host: PenRigidBody, guest: PenRigidBody, hasCollision: boolean): ReplayFrame {
  return {
    hostPen: { x: host.x, y: host.y, angle: host.angle, vx: host.vx, vy: host.vy, va: host.va, isFallen: host.isFallen, fallenZ: host.fallenZ },
    guestPen: { x: guest.x, y: guest.y, angle: guest.angle, vx: guest.vx, vy: guest.vy, va: guest.va, isFallen: guest.isFallen, fallenZ: guest.fallenZ },
    hasCollision,
    timestamp: Date.now(),
  };
}

/**
 * Detect trick shots from pen state after flick settles
 */
export function detectTrickShots(
  pen: PenRigidBody,
  opponentFallen: boolean,
  playerId: string
): { type: "bank_shot" | "spin_kill" | "edge_save"; bonusPoints: number; description: string } | null {
  // Bank shot: pen bounced off side bevel at least once before knockout
  if (opponentFallen && (pen.edgeBounceCount || 0) >= 1) {
    return {
      type: "bank_shot",
      bonusPoints: 50,
      description: `🎱 BANK SHOT! Side-bevel bank knockout!`,
    };
  }

  // Spin kill: pen did 2+ full rotations before knockout
  if (opponentFallen && (pen.totalRotations || 0) >= 2.0) {
    return {
      type: "spin_kill",
      bonusPoints: 75,
      description: `🌀 CYCLONE SPIN! ${Math.max(2, Math.floor(pen.totalRotations || 0))} rotations of devastation!`,
    };
  }

  // Edge save: pen was teetering but didn't fall
  if (!pen.isFallen && pen.teeterProgress > 0.65) {
    return {
      type: "edge_save",
      bonusPoints: 35,
      description: `😰 CLIFFHANGER SAVE! Survived at ${Math.round(pen.teeterProgress * 100)}% teeter!`,
    };
  }

  return null;
}
