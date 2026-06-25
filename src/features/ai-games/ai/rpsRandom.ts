import type { RpsChoice } from "../types";

const CHOICES: RpsChoice[] = ["R", "P", "S"];

export function randomRpsChoice(): RpsChoice {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

/** Slightly biased random — 60% counter to last human move if known */
export function counterRpsChoice(lastHuman?: RpsChoice | null): RpsChoice {
  if (!lastHuman || Math.random() > 0.6) return randomRpsChoice();
  const counters: Record<RpsChoice, RpsChoice> = { R: "P", P: "S", S: "R" };
  return counters[lastHuman];
}

export function rpsOutcome(human: RpsChoice, ai: RpsChoice): "win" | "lose" | "draw" {
  if (human === ai) return "draw";
  if (
    (human === "R" && ai === "S") ||
    (human === "P" && ai === "R") ||
    (human === "S" && ai === "P")
  ) return "win";
  return "lose";
}

export const RPS_EMOJI: Record<RpsChoice, string> = { R: "✊", P: "✋", S: "✌️" };
