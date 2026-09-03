import { describe, it, expect } from "vitest";
import { ALL_GAME_RULES } from "@/features/games/data/gameRulesData";
import { GameId } from "@/features/games/types";

describe("Arcade Academy & Game Rules Suite", () => {
  const EXPECTED_GAME_IDS: GameId[] = [
    "ttt",
    "connect4",
    "rps",
    "memory",
    "reaction",
    "sos",
    "bingo",
    "cricket",
  ];

  it("should have comprehensive rules for all 8 arcade games", () => {
    EXPECTED_GAME_IDS.forEach((id) => {
      const rule = ALL_GAME_RULES[id];
      expect(rule).toBeDefined();
      expect(rule.gameId).toBe(id);
      expect(rule.title).toBeTruthy();
      expect(rule.tagline).toBeTruthy();
      expect(rule.icon).toBeTruthy();
      expect(rule.objective).toBeTruthy();
      expect(rule.quickSummary).toBeTruthy();
      expect(rule.winCondition).toBeTruthy();
      expect(rule.steps.length).toBeGreaterThanOrEqual(3);
      expect(rule.proTips.length).toBeGreaterThanOrEqual(2);
      expect(["Easy", "Medium", "Hard"]).toContain(rule.difficulty);
    });
  });

  it("should have detailed step-by-step descriptions and emojis for Hand Cricket", () => {
    const cricketRule = ALL_GAME_RULES.cricket;
    expect(cricketRule.steps).toHaveLength(4);
    expect(cricketRule.steps[0].title).toContain("Toss");
    expect(cricketRule.steps[1].title).toContain("Batting");
    expect(cricketRule.steps[2].title).toContain("Wicket");
    expect(cricketRule.steps[3].title).toContain("Chase");
    expect(cricketRule.asciiDiagram).toContain("BATSMAN");
    expect(cricketRule.asciiDiagram).toContain("BOWLER");
  });

  it("should have valid win condition and pro-tips for SOS Neon Duel", () => {
    const sosRule = ALL_GAME_RULES.sos;
    expect(sosRule.steps.some((s) => s.title.includes("S-O-S"))).toBe(true);
    expect(sosRule.proTips.some((t) => t.includes("Trap") || t.includes("Baiting"))).toBe(true);
  });

  it("should have accurate Bingo Blitz 5-line victory condition", () => {
    const bingoRule = ALL_GAME_RULES.bingo;
    expect(bingoRule.winCondition).toContain("5");
    expect(bingoRule.asciiDiagram).toContain("B   I   N   G   O");
  });
});
