import { HandCricketState, CricketDelivery } from "../../types";

export type CricketAIPersonaId = "gully" | "spin_king" | "captain_cool";

export interface CricketAIPersona {
  id: CricketAIPersonaId;
  name: string;
  avatar: string;
  title: string;
  color: string;
  quotes: {
    toss: string[];
    batting: string[];
    bowling: string[];
    wicket: string[];
    win: string[];
    loss: string[];
  };
}

export const CRICKET_AI_PERSONAS: Record<CricketAIPersonaId, CricketAIPersona> = {
  gully: {
    id: "gully",
    name: "Gully Boy Raju",
    avatar: "🧢",
    title: "Street Cricket Champ",
    color: "#06b6d4",
    quotes: {
      toss: [
        "First ball trial ball! Let's flip it!",
        "Heads or tails doesn't matter, odd or even is real street cricket!",
      ],
      batting: [
        "Watch this lofted drive!",
        "Straight over the colony wall!",
        "Boundary hunting is my specialty!",
      ],
      bowling: [
        "Fast Yorker incoming!",
        "You can't hit my under-arm spin!",
        "Out on the next ball, guaranteed!",
      ],
      wicket: [
        "GONE! Go fetch the ball from uncle's house!",
        "CLEAN BOWLED! What a delivery!",
        "Timber! That's a wicket!",
      ],
      win: [
        "Gully rules supreme! Better luck next match!",
        "That's how we play in our lane!",
      ],
      loss: [
        "Hey, you definitely had an advantage with that coin toss!",
        "Good game brother, rematch right now!",
      ],
    },
  },
  spin_king: {
    id: "spin_king",
    name: "Spin Wizard Jadeja",
    avatar: "🌪️",
    title: "Tactical Mystery Bowler",
    color: "#f59e0b",
    quotes: {
      toss: [
        "Conditions favor spin today. Let's see who calls it right.",
        "A tactical match begins right from the toss.",
      ],
      batting: [
        "Rotating the strike and waiting for the bad ball.",
        "Piercing the gap with soft hands.",
        "Calculated risk is the key to chasing.",
      ],
      bowling: [
        "Reading your wrist movement closely.",
        "Turn, bounce, and a bit of drift...",
        "Can you pick my carrom ball?",
      ],
      wicket: [
        "Plumb in front! Trapped by variation!",
        "Edged and taken! Read you like a book!",
        "The web was woven, and you fell right into it!",
      ],
      win: [
        "Strategy overcomes raw power every single time.",
        "Clinical performance. Discipline won the day.",
      ],
      loss: [
        "Superb counter-attacking batting. Commendable.",
        "You anticipated my lines very well today.",
      ],
    },
  },
  captain_cool: {
    id: "captain_cool",
    name: "Captain Cool Dhoni",
    avatar: "👑",
    title: "Master Finisher & Strategist",
    color: "#ec4899",
    quotes: {
      toss: [
        "It's not about winning the toss, it's about executing the process.",
        "Whatever happens, we keep calm and follow the plan.",
      ],
      batting: [
        "Taking the game deep. The pressure is on the bowler.",
        "Watch the ball, trust the instincts.",
        "Finishing it off in style!",
      ],
      bowling: [
        "Setting the field in the mind before releasing the delivery.",
        "You think you know what's coming next.",
        "Patience brings the breakthrough.",
      ],
      wicket: [
        "Lightning fast stumping! Not even in the frame!",
        "Game over for that batsman. Exactly as anticipated.",
        "Bowled around the legs! Pure class.",
      ],
      win: [
        "The process was respected. That is why results follow.",
        "Stay calm, stay grounded. Great match!",
      ],
      loss: [
        "You played the big moments better. Respect.",
        "Failures are just lessons in disguise. Well played.",
      ],
    },
  },
};

/**
 * Generates dynamic, situational cricket commentary for each ball.
 */
export function generateCricketCommentary(
  batsmanPick: number,
  bowlerPick: number,
  isWicket: boolean,
  isChase: boolean,
  runsNeeded?: number,
  ballsRemaining?: number
): string {
  if (isWicket) {
    if (batsmanPick === 6) {
      return "OUT! Tried to clear the boundary with a maximum, but caught right on the fence!";
    }
    if (batsmanPick === 4) {
      return "WICKET! Slashed hard outside off-stump, sharp catch taken by the bowler!";
    }
    if (batsmanPick === 0) {
      return "OUT! Padded away on the crease, huge appeal and the umpire gives LBW!";
    }
    const wicketTexts = [
      "CLEAN BOWLED! Stumps shattered, what a peach of a delivery!",
      "EDGED AND GONE! Feathered through to the keeper!",
      "KNOCKED OVER! The stumps are in disarray!",
      "OUT! Fatal misjudgment, middle stump is flattened!",
    ];
    return wicketTexts[Math.floor(Math.random() * wicketTexts.length)];
  }

  // Scoring commentary
  if (batsmanPick === 6) {
    if (isChase && runsNeeded && runsNeeded <= 6) {
      return "SIX! FINISHES OFF IN STYLE! High, handsome, and into the crowd!";
    }
    return "MASSIVE SIX! Launched into orbit with sublime timing!";
  }
  if (batsmanPick === 4) {
    return "FOUR RUNS! Pierced the gap with surgical precision!";
  }
  if (batsmanPick === 3) {
    return "THREE RUNS! Brilliant hustle and speed between the wickets!";
  }
  if (batsmanPick === 2) {
    return "TWO RUNS! Tucked away into deep mid-wicket for a comfortable brace.";
  }
  if (batsmanPick === 1) {
    return "Single taken! Pushed gently into the covers to rotate the strike.";
  }
  return "Dot ball! Defended solidly back to the bowler with soft hands.";
}

/**
 * Determines whether a toss is won based on caller pick and sum parity.
 */
export function evaluateCricketToss(
  callerChoice: "odd" | "even",
  hostNumber: number,
  guestNumber: number
): { sum: number; isEven: boolean; callerWon: boolean } {
  const sum = hostNumber + guestNumber;
  const isEven = sum % 2 === 0;
  const callerWon = (callerChoice === "even" && isEven) || (callerChoice === "odd" && !isEven);
  return { sum, isEven, callerWon };
}

/**
 * Intelligent AI Decision Algorithm for Hand Cricket.
 */
export function getSmartCricketAIMove(
  state: HandCricketState,
  aiPlayerId: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
): { pick: number; speech?: string } {
  const isBatting = state.batsmanId === aiPlayerId;
  const currentInnings = state.currentInnings === 1 ? state.innings1 : state.innings2;
  const recentDeliveries = currentInnings.deliveries;
  const persona =
    difficulty === "easy"
      ? CRICKET_AI_PERSONAS.gully
      : difficulty === "medium"
      ? CRICKET_AI_PERSONAS.spin_king
      : CRICKET_AI_PERSONAS.captain_cool;

  // Extract human player's recent picks
  const humanRecentPicks: number[] = [];
  for (let i = recentDeliveries.length - 1; i >= 0 && humanRecentPicks.length < 6; i--) {
    const d = recentDeliveries[i];
    humanRecentPicks.push(isBatting ? d.bowlerRun : d.batsmanRun);
  }

  // 1. Easy Mode (Gully Boy): 65% random with preference for 4 and 6 when batting
  if (difficulty === "easy") {
    if (isBatting && Math.random() < 0.6) {
      const gullyFavs = [4, 6, 1, 2, 6, 4];
      return {
        pick: gullyFavs[Math.floor(Math.random() * gullyFavs.length)],
        speech: persona.quotes.batting[Math.floor(Math.random() * persona.quotes.batting.length)],
      };
    }
    return {
      pick: Math.floor(Math.random() * 6) + 1, // 1 to 6
    };
  }

  // 2. Medium Mode (Spin Wizard Jadeja): Pattern frequency counter
  if (difficulty === "medium") {
    if (humanRecentPicks.length >= 2) {
      const lastPick = humanRecentPicks[0];
      const secondLastPick = humanRecentPicks[1];

      // If human repeated a number, they might switch
      if (lastPick === secondLastPick) {
        if (!isBatting) {
          // As bowler: predict human switches to 1 or 4
          const counterPicks = [1, 4, (lastPick % 6) + 1];
          return {
            pick: counterPicks[Math.floor(Math.random() * counterPicks.length)],
            speech: persona.quotes.bowling[Math.floor(Math.random() * persona.quotes.bowling.length)],
          };
        } else {
          // As batsman: avoid the repeated number
          const safeNumbers = [1, 2, 3, 4, 5, 6].filter((n) => n !== lastPick);
          return { pick: safeNumbers[Math.floor(Math.random() * safeNumbers.length)] };
        }
      }
    }

    // Default medium play: balanced selection
    const weighted = isBatting ? [1, 2, 3, 4, 6, 2, 1] : [1, 2, 4, 6, 3, 5];
    return {
      pick: weighted[Math.floor(Math.random() * weighted.length)],
    };
  }

  // 3. Hard Mode (Captain Cool Dhoni): Advanced Psychological Game Theory & Situational IQ
  if (state.currentInnings === 2 && isBatting) {
    // Chasing in 2nd Innings
    const target = state.innings2.target;
    const runsLeft = Math.max(1, target - state.innings2.runs);
    const maxBalls = state.maxOvers > 0 ? state.maxOvers * 6 : 999;
    const ballsLeft = Math.max(1, maxBalls - state.innings2.balls);
    const requiredRunRate = (runsLeft / ballsLeft) * 6;

    if (runsLeft <= 2) {
      // Very close to win: pick safe singles or 2s avoiding bowler's hot pick
      const opponentLikely = humanRecentPicks[0] || 1;
      const safePicks = [1, 2, 3].filter((n) => n !== opponentLikely);
      return {
        pick: safePicks[Math.floor(Math.random() * safePicks.length)] || 2,
        speech: "Finishing it off with a calm single!",
      };
    }

    if (requiredRunRate > 7) {
      // High pressure chase: calculate best boundary without hitting bowler's predicted slot
      const bowlerPredicted = humanRecentPicks[0] === 6 ? 4 : 6;
      const aggressivePicks = [4, 6, 5].filter((n) => n !== bowlerPredicted);
      return {
        pick: aggressivePicks[Math.floor(Math.random() * aggressivePicks.length)] || 6,
        speech: persona.quotes.batting[Math.floor(Math.random() * persona.quotes.batting.length)],
      };
    }
  }

  if (!isBatting) {
    // As Bowler in Hard Mode: Hunt for wickets!
    // Humans frequently go for 6 or 4 after scoring a 1 or 2, or repeat 6 after hitting a 6
    if (humanRecentPicks[0] === 6) {
      // 55% chance human tries for consecutive 6
      if (Math.random() < 0.55) {
        return { pick: 6, speech: "Expecting another big shot! Trap set." };
      }
    }
    if (humanRecentPicks[0] === 1 || humanRecentPicks[0] === 2) {
      // Human likely steps on the gas for 4
      return { pick: 4, speech: "Tight line outside off-stump..." };
    }
  }

  // Default hard mode: dynamic selection with anti-streak
  const allNums = [1, 2, 3, 4, 5, 6];
  const filtered = humanRecentPicks.length > 0 ? allNums.filter((n) => n !== humanRecentPicks[0]) : allNums;
  return {
    pick: filtered[Math.floor(Math.random() * filtered.length)],
    speech: persona.quotes[isBatting ? "batting" : "bowling"][0],
  };
}
