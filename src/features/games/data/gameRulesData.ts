import { GameId } from "../types";

export interface GameRuleStep {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface GameRuleGuide {
  gameId: GameId;
  title: string;
  tagline: string;
  category: string;
  icon: string;
  accentColor: string;
  gradient: string;
  objective: string;
  quickSummary: string;
  steps: GameRuleStep[];
  proTips: string[];
  winCondition: string;
  boardLayoutDescription: string;
  asciiDiagram?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  avgDuration: string;
}

export const ALL_GAME_RULES: Record<GameId, GameRuleGuide> = {
  cricket: {
    gameId: "cricket",
    title: "Hand Cricket 1v1",
    tagline: "Odd-or-Even Toss, Batting vs Bowling Mind-Games & Boundary Chases",
    category: "Strategy",
    icon: "🏏",
    accentColor: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    difficulty: "Medium",
    avgDuration: "2 - 3 mins",
    objective: "Score as many runs as possible when batting without picking the exact same number as the bowler!",
    quickSummary: "Simultaneous finger-cricket duel. Pick 1 to 6 (or 0 for defense). Different numbers = runs scored. Same number = WICKET OUT!",
    steps: [
      {
        stepNumber: 1,
        title: "The Odd or Even Coin Toss",
        description: "Player 1 calls 'Odd' or 'Even'. Both players flash a hand number (1–6). If the sum matches your call, you win the toss and elect to BAT or BOWL first!",
        icon: "🪙",
        badge: "Phase 1",
      },
      {
        stepNumber: 2,
        title: "Batting & Scoring Runs",
        description: "When batting, choose a secret number from 1 to 6 (or 0 for defensive block). If the bowler picks a DIFFERENT number, you score the exact runs you picked (+1, +2, +3, +4, +5, +6)!",
        icon: "🏏",
        badge: "Innings 1",
      },
      {
        stepNumber: 3,
        title: "Wicket Dismissal (OUT!)",
        description: "If the batsman and bowler choose the EXACT SAME number, the batsman is OUT! The stumps fly and a wicket falls. Innings ends when all wickets fall or overs expire.",
        icon: "🎯",
        badge: "Wicket!",
      },
      {
        stepNumber: 4,
        title: "Innings 2 & Target Chase",
        description: "Roles flip! The bowler now bats, and needs to score (Innings 1 Total + 1) runs to win. If they reach the target, they win by wickets. If they get out before, defender wins by runs!",
        icon: "⚡",
        badge: "The Chase",
      },
    ],
    proTips: [
      "Mind Games: If you just hit a 6, the bowler will expect another 6 or a 4. Trick them by taking a quiet single (1)!",
      "Defensive 0 (Shield): Playing 0 scores no runs, but keeps you completely safe from getting out on high numbers.",
      "Pressure Chasing: When chasing, calculate your Required Run Rate. Don't risk 6s if you only need 2 runs to win.",
      "Bowler Strategy: Track which numbers the opponent favors under pressure and bowl that exact number to get the wicket.",
    ],
    winCondition: "Chaser wins if they reach the target runs. Defending bowler wins if chaser loses all wickets or balls run out with fewer runs. Exact tie = Draw / Super Over.",
    boardLayoutDescription: "Stadium scoreboard at the top, animated 3D cricket pitch in the middle, and a 7-button finger gesture pad (0–6) at the bottom.",
    asciiDiagram: `
  [BATSMAN: 4]  ⚡ vs ⚡  [BOWLER: 2]   ==>  +4 RUNS (Boundary!)
  [BATSMAN: 6]  💥 vs 💥  [BOWLER: 6]   ==>  OUT! (Wicket Falls!)
  [BATSMAN: 1]  🛡️ vs 🛡️  [BOWLER: 3]   ==>  +1 RUN (Single taken)
    `,
  },

  sos: {
    gameId: "sos",
    title: "SOS Neon Duel",
    tagline: "Form S-O-S in Any Direction to Earn Points and Extra Turns",
    category: "Classic",
    icon: "✨",
    accentColor: "#06b6d4",
    gradient: "from-cyan-500 to-blue-600",
    difficulty: "Medium",
    avgDuration: "3 - 5 mins",
    objective: "Create more completed 'S-O-S' 3-letter sequences on the 6x6 grid than your opponent.",
    quickSummary: "Take turns placing 'S' or 'O'. Every S-O-S you form earns 1 point AND an immediate bonus turn!",
    steps: [
      {
        stepNumber: 1,
        title: "Choose Your Letter",
        description: "On your turn, choose whether you want to place an 'S' or an 'O' by clicking the letter selector toggle.",
        icon: "🔤",
        badge: "Step 1",
      },
      {
        stepNumber: 2,
        title: "Place on the 6x6 Grid",
        description: "Tap any empty cell on the glowing grid to place your chosen letter.",
        icon: "🎯",
        badge: "Step 2",
      },
      {
        stepNumber: 3,
        title: "Complete an S-O-S & Streak!",
        description: "If your letter completes 'S-O-S' horizontally, vertically, or diagonally, you earn 1 point! Even better: you get an immediate BONUS TURN to place again!",
        icon: "🔥",
        badge: "Combo!",
      },
      {
        stepNumber: 4,
        title: "Multi-Line Combos",
        description: "A single 'O' placed between two 'S' characters can complete horizontal and vertical SOS lines simultaneously for 2+ points!",
        icon: "⚡",
        badge: "Multi-Point",
      },
    ],
    proTips: [
      "Avoid Baiting: Never place an 'S' two cells away from another 'S' unless you have to, or your opponent will slip an 'O' between them for free points.",
      "The 'O' Trap: Placing an 'O' near one 'S' might tempt the opponent into completing it, but make sure it doesn't give them a chain of 3+ lines.",
      "Edge Defense: Play along corners and outer boundaries early in the game to reduce multi-directional scoring avenues.",
    ],
    winCondition: "The match ends when all 36 grid cells are filled. The player with the highest completed SOS lines wins!",
    boardLayoutDescription: "6x6 interactive grid with color-coded neon glowing strike-through lines when SOS sequences are completed.",
    asciiDiagram: `
    S | O | S   <-- Horizontal SOS (1 Point + Bonus Turn)
    ---------
    O | O | O
    ---------
    S | O | S   <-- Diagonal SOS also valid!
    `,
  },

  bingo: {
    gameId: "bingo",
    title: "Bingo Blitz Duel",
    tagline: "Call Numbers, Stamp Cards, and Complete 5 Lines to Shout BINGO!",
    category: "Classic",
    icon: "🎱",
    accentColor: "#f59e0b",
    gradient: "from-amber-500 to-yellow-600",
    difficulty: "Easy",
    avgDuration: "2 - 4 mins",
    objective: "Be the first player to complete 5 full lines (horizontal rows, vertical columns, or diagonals) on your 5x5 card.",
    quickSummary: "Turn-based number calling. When a player calls a number, BOTH players stamp it on their cards. 5 lines = B-I-N-G-O victory!",
    steps: [
      {
        stepNumber: 1,
        title: "Craft or Shuffle Your 5x5 Card",
        description: "Set your own custom 25-number card (1 to 25) by tapping cells and picking from the number bank, or use Shuffle and Auto-Fill for instant readiness.",
        icon: "📋",
        badge: "Draft & Setup",
      },
      {
        stepNumber: 2,
        title: "Call a Number on Your Turn",
        description: "Tap any unstamped number on your card to call it out to the match arena.",
        icon: "🗣️",
        badge: "Your Turn",
      },
      {
        stepNumber: 3,
        title: "Dual Stamping",
        description: "Whenever a number is called by either player, it is automatically stamped on BOTH players' boards with satisfying tactile sound.",
        icon: "✨",
        badge: "Stamped",
      },
      {
        stepNumber: 4,
        title: "Complete Lines for B-I-N-G-O",
        description: "Completing any full row (5 cells), column (5 cells), or diagonal unlocks a letter: B ➔ I ➔ N ➔ G ➔ O. First to 5 lines wins!",
        icon: "🏆",
        badge: "B-I-N-G-O!",
      },
    ],
    proTips: [
      "Center Intersection: The center cell (#3 in row 3) intersects 1 row, 1 column, and BOTH diagonals (4 potential lines!). Prioritize calling it.",
      "Dual Progress: Look for unstamped numbers on your card that contribute to 2 lines at once (e.g. intersecting row and column).",
      "Pay Attention to Opponent Calls: When your opponent calls numbers, watch which lines on your board fill up for free!",
    ],
    winCondition: "The first player to reach 5 completed lines shouts BINGO and claims immediate victory!",
    boardLayoutDescription: "5x5 stamped numbered card with glowing B-I-N-G-O letter indicators at the top that light up as lines are completed.",
    asciiDiagram: `
     B   I   N   G   O
    [X] [X] [X] [X] [X]  <-- Row 1 Complete (B unlocked)
    [X] [ ] [ ] [ ] [ ]
    [X] [ ] [X] [ ] [ ]  <-- Col 1 Complete (I unlocked)
    [X] [ ] [ ] [X] [ ]
    [X] [ ] [ ] [ ] [X]  <-- Main Diagonal Complete (N unlocked)
    `,
  },

  ttt: {
    gameId: "ttt",
    title: "Tic-Tac-Toe Neon",
    tagline: "The Timeless 3x3 Battle with Animated Win Strokes and Unbeatable AI",
    category: "Classic",
    icon: "⭕",
    accentColor: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    difficulty: "Easy",
    avgDuration: "1 min",
    objective: "Place three of your symbols (X or O) in a horizontal, vertical, or diagonal row.",
    quickSummary: "The ultimate quick reflex classic. Alternate turns placing your mark on the 3x3 grid.",
    steps: [
      {
        stepNumber: 1,
        title: "Take Your Turn",
        description: "Tap any of the 9 empty grid cells to place your glowing symbol.",
        icon: "⭕",
        badge: "Turn",
      },
      {
        stepNumber: 2,
        title: "Block Your Opponent",
        description: "Watch your opponent's moves closely! If they get two symbols in a row, block the third space immediately.",
        icon: "🛡️",
        badge: "Defense",
      },
      {
        stepNumber: 3,
        title: "Connect 3 to Win",
        description: "Align 3 of your marks in any straight line to trigger the neon win stroke animation!",
        icon: "👑",
        badge: "Victory",
      },
    ],
    proTips: [
      "Center Square First: If you go first, claiming the center cell gives you 4 winning lines (row, column, and two diagonals).",
      "The Corner Fork: Place your marks in two opposite corners to create an unblockable 'fork' where the opponent can only block one side.",
      "Unbeatable Minimax: When playing against 'Hard' AI, the bot calculates every permutation using game-tree Minimax — can you hold it to a draw?",
    ],
    winCondition: "First player to connect 3 marks in a row wins. If all 9 cells fill with no 3-in-a-row, it's a draw.",
    boardLayoutDescription: "Classic 3x3 neon grid with particle bursts and animated win stroke line upon round completion.",
    asciiDiagram: `
     X | O | X
    -----------
     O | X | O   <-- Diagonal X Win!
    -----------
     O |   | X
    `,
  },

  connect4: {
    gameId: "connect4",
    title: "Connect 4 Drop",
    tagline: "Drop Chips with Gravity Physics to Connect Four in a Row",
    category: "Strategy",
    icon: "🔴",
    accentColor: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
    difficulty: "Medium",
    avgDuration: "2 - 4 mins",
    objective: "Be the first to connect four of your colored discs vertically, horizontally, or diagonally.",
    quickSummary: "Turn-based column drops with gravity physics. Drop chips into 7 columns and 6 rows.",
    steps: [
      {
        stepNumber: 1,
        title: "Select a Column",
        description: "Hover or tap on any of the 7 columns (columns 1 through 7).",
        icon: "👇",
        badge: "Pick Column",
      },
      {
        stepNumber: 2,
        title: "Gravity Drop",
        description: "Your chip falls naturally to the lowest available unoccupied slot in that column.",
        icon: "🔴",
        badge: "Drop",
      },
      {
        stepNumber: 3,
        title: "Align 4 Discs",
        description: "Connect 4 chips of your color in any straight direction: horizontal, vertical, or diagonal.",
        icon: "🏆",
        badge: "Connect 4!",
      },
    ],
    proTips: [
      "Center Column Dominance: Column 4 is the most valuable column because it participates in the maximum possible winning 4-in-a-row combinations.",
      "The 7-Trap: Create a horizontal 3-in-a-row with open ends on both sides. Your opponent can only block one side, leaving you to win on the other!",
      "Don't Help the Enemy: Never play a chip directly beneath an opponent's potential winning square unless you have no choice.",
    ],
    winCondition: "First player to get four consecutive chips horizontally, vertically, or diagonally wins the round.",
    boardLayoutDescription: "7 columns by 6 rows blue arcade rack with falling chip animations and glowing connect lines.",
    asciiDiagram: `
    .  .  .  .  .  .  .
    .  .  .  .  .  .  .
    .  .  🔴 .  .  .  .
    .  .  🔴 🟡 .  .  .
    .  .  🔴 🟡 🟡 .  .
    .  🟡 🔴 🟡 🔴 .  .
          ^
     Column 3 (Vertical 4 Win!)
    `,
  },

  rps: {
    gameId: "rps",
    title: "Rock Paper Scissors",
    tagline: "Blind Pick Showdown with Animated 3-2-1 Clash and Multi-Round Series",
    category: "Casual",
    icon: "✊",
    accentColor: "#f43f5e",
    gradient: "from-rose-500 to-pink-600",
    difficulty: "Easy",
    avgDuration: "1 min",
    objective: "Anticipate your opponent's pick and counter it in a simultaneous reveal duel.",
    quickSummary: "Secret blind pick. Rock smashes Scissors, Paper covers Rock, Scissors cuts Paper.",
    steps: [
      {
        stepNumber: 1,
        title: "Secret Blind Pick",
        description: "Select Rock 🪨, Paper 📄, or Scissors ✂️. Your choice is kept completely hidden from your opponent.",
        icon: "🔒",
        badge: "Secret",
      },
      {
        stepNumber: 2,
        title: "Simultaneous 3-2-1 Reveal",
        description: "Once both players lock in their choice, both cards slam down in a synchronized animated clash!",
        icon: "💥",
        badge: "Clash",
      },
      {
        stepNumber: 3,
        title: "Scoring the Round",
        description: "Rock beats Scissors • Scissors beats Paper • Paper beats Rock. Same choice results in a Draw.",
        icon: "🥇",
        badge: "Outcome",
      },
    ],
    proTips: [
      "Human Psychology: Beginners commonly lead with Rock on the first round. Playing Paper gives you a statistical advantage on Round 1!",
      "Countering Losses: Players who lose a round usually change their move to whatever would have beaten what just won.",
      "The Double Bluff: If you win with Rock, your opponent expects you to switch. Repeating Rock can catch them completely off guard.",
    ],
    winCondition: "First player to win the designated number of rounds (e.g. Best of 3 or Best of 5) wins the match.",
    boardLayoutDescription: "3 card choices at the bottom, countdown clash stage in the center, and match score counter at the top.",
    asciiDiagram: `
    🪨 Rock     beats   ✂️ Scissors
    ✂️ Scissors beats   📄 Paper
    📄 Paper    beats   🪨 Rock
    `,
  },

  memory: {
    gameId: "memory",
    title: "Memory Card Duel",
    tagline: "Flip and Match Pairs in a Turn-Based Showdown. Most Pairs Wins!",
    category: "Strategy",
    icon: "🧠",
    accentColor: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    difficulty: "Medium",
    avgDuration: "2 - 3 mins",
    objective: "Uncover and match more pairs of cards than your opponent from a 16-card facedown grid.",
    quickSummary: "Flip 2 cards on your turn. If they match, keep them and get an EXTRA turn! If not, turn passes.",
    steps: [
      {
        stepNumber: 1,
        title: "Flip First Card",
        description: "Tap any facedown card on the 4x4 grid to flip it and reveal its icon.",
        icon: "🃏",
        badge: "Card 1",
      },
      {
        stepNumber: 2,
        title: "Flip Second Card",
        description: "Choose a second card to try and find the matching partner.",
        icon: "🔍",
        badge: "Card 2",
      },
      {
        stepNumber: 3,
        title: "Match & Streak Bonus",
        description: "If the cards match, you score 1 pair point and get an immediate BONUS TURN! If they don't match, they flip back over.",
        icon: "✨",
        badge: "Match!",
      },
    ],
    proTips: [
      "Mental Grid Mapping: Associate cards with their coordinate positions (e.g., Top-Left is Alien, Bottom-Right is Rocket).",
      "Exploit Opponent Flips: Watch every single card your opponent flips, even on their misses. It gives you free information!",
      "Safe Explorations: If you don't know any pairs, flip cards that haven't been touched yet instead of cards your opponent already knows.",
    ],
    winCondition: "The player with the most collected pairs when all 8 pairs are cleared from the board wins.",
    boardLayoutDescription: "4x4 grid of 16 3D flipping cards with smooth rotation animations and pair collection trays.",
    asciiDiagram: `
    [ ❓ ] [ 🚀 ] [ ❓ ] [ 👾 ]
    [ ❓ ] [ ❓ ] [ 🚀 ] [ ❓ ]  <-- (0,1) and (1,2) match!
    [ 💎 ] [ ❓ ] [ ❓ ] [ 💎 ]  <-- (2,0) and (2,3) match!
    [ ❓ ] [ 👾 ] [ ❓ ] [ ❓ ]
    `,
  },

  reaction: {
    gameId: "reaction",
    title: "Reaction Dash",
    tagline: "Wait for Green and Tap with Split-Second Reflexes. Millisecond Score.",
    category: "Reflex",
    icon: "⚡",
    accentColor: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    difficulty: "Easy",
    avgDuration: "1 min",
    objective: "React faster than your opponent when the arena turns emerald green.",
    quickSummary: "Red means wait... Green means TAP! Fastest reaction time in milliseconds wins.",
    steps: [
      {
        stepNumber: 1,
        title: "Wait on Crimson Red",
        description: "The arena will display a pulsing red light. Keep your finger hovering over the screen.",
        icon: "🔴",
        badge: "Wait",
      },
      {
        stepNumber: 2,
        title: "Don't Tap Too Early!",
        description: "Tapping while the screen is still red triggers a False Start foul and resets your score!",
        icon: "⚠️",
        badge: "Warning",
      },
      {
        stepNumber: 3,
        title: "Rush on Emerald Green!",
        description: "At a random moment, the screen flashes neon green. Tap immediately! Your reaction time is measured in milliseconds (ms).",
        icon: "🟢",
        badge: "TAP NOW!",
      },
    ],
    proTips: [
      "Peripheral Focus: Don't stare intensely at one pixel. Soften your gaze on the center to detect color shifts faster.",
      "Stay Loose: Tense muscles take longer to contract. Relax your finger and tap with a light twitch.",
      "Pro Benchmark: Average human reaction time is ~250ms. Pro gamers react in ~160ms–190ms!",
    ],
    winCondition: "The player with the fastest reaction time (lowest millisecond score) across the round wins.",
    boardLayoutDescription: "Full-screen dynamic color arena with millisecond digital stopwatch and reflex rating badge.",
    asciiDiagram: `
    [  🔴 CRIMSON RED: WAIT...  ]  <-- Tapping now = FOUL!
               ⬇️
    [ 🟢 NEON GREEN: TAP NOW!! ]  <-- TAP! 182ms = LEGENDARY!
    `,
  },
  taptug: {
    gameId: "taptug",
    title: "Tap Blitz: Tug of War",
    tagline: "High-octane finger-tap tug of war with Overdrive Combos, Freeze & EMP power-ups!",
    category: "Reflex",
    icon: "⚡",
    accentColor: "#f59e0b",
    gradient: "from-amber-500 via-rose-500 to-purple-600",
    difficulty: "Hard",
    avgDuration: "30 - 45 secs",
    objective: "Mash your tap pad to push the clashing laser conduit into the opponent's zone to score a Sudden-Death KO!",
    quickSummary: "Rapid multi-finger mashing tug-of-war. Build Overdrive heat for 1.75x force, and deploy Freeze, Bomb, 2X, and Shield power-ups to dominate territory.",
    steps: [
      {
        stepNumber: 1,
        title: "Mash the Battle Pad",
        description: "Tap rapidly with multiple fingers (or press [SPACE] / [A] on desktop) to push the clashing energy conduit toward your opponent's win zone.",
        icon: "⚡",
        badge: "Core Tap",
      },
      {
        stepNumber: 2,
        title: "Ignite Overdrive Heat",
        description: "Consecutive rapid tapping charges your heat gauge. Reaching 100% unleashes FIRE OVERDRIVE (+75% push force for 2.2 seconds)!",
        icon: "🔥",
        badge: "Overdrive",
      },
      {
        stepNumber: 3,
        title: "Deploy Tactical Power-Ups",
        description: "Activate 2X Overcharge (double force for 12 taps), Glitch Freeze (locks opponent for 1.4s), EMP Shockwave (12% territory blast), or Kinetic Shield (absorbs 75% incoming push).",
        icon: "💣",
        badge: "Tactics",
      },
      {
        stepNumber: 4,
        title: "Sudden-Death KO or Territory Win",
        description: "Pushing the beam all the way to 100% (or 0% for P2) triggers an instant Sudden-Death KO! If 30 seconds expire, the player holding majority territory (>52%) wins.",
        icon: "👑",
        badge: "Victory",
      },
    ],
    proTips: [
      "Multi-Touch Drumming: Use two index fingers to alternate taps in a rapid drum roll rhythm for up to 15 taps/sec!",
      "Combo Synergy: Activate 2X Overcharge right as you trigger Fire Overdrive to deliver an insane 3.5x push force per tap!",
      "Counter-Shielding: If your opponent activates 2X or Overdrive, immediately pop your Kinetic Shield to neutralize 75% of their attack!",
      "Clutch EMP Timing: Save your EMP Shockwave for when the beam is at 88% to blast through the final 12% for an instant Sudden-Death KO.",
    ],
    winCondition: "Push the energy conduit to 100% (Instant KO), or hold majority territory (>52%) when the 30-second match clock expires.",
    boardLayoutDescription: "High-voltage laser conduit arena with LED heat tachometers, tactile 3D slam pads, and 4 tactical power-up chips.",
    asciiDiagram: `
    [ P2 GOAL (0%) ] <====== [ ⚡ CLASH NEXUS: 50% ] ======> [ P1 GOAL (100%) ]
           ❄️ FREEZE          🛡️ KINETIC SHIELD          💣 EMP BLAST (12%)
    `,
  },
  penfight: {
    gameId: "penfight",
    title: "Pen Fight 1v1",
    tagline: "Classroom Desk Duel, 2.5D Rigid-Body Physics, Table-Edge Knockouts & Compass Nostalgia",
    category: "Action",
    icon: "🖊️",
    accentColor: "#f59e0b",
    gradient: "from-amber-600 via-orange-600 to-yellow-500",
    difficulty: "Medium",
    avgDuration: "2 - 3 mins",
    objective: "Flick your pen across the wooden classroom desk to strike and knock your opponent's pen completely off the table!",
    quickSummary: "Turn-based school bench duel. Drag back on your pen to set angle and power, release to flick with continuous rigid-body momentum, spin, and dramatic edge-teetering physics!",
    steps: [
      {
        stepNumber: 1,
        title: "Pick Your Weapon & Cap Weight",
        description: "Choose from iconic school pens: Pilot V5 (precision needle), Reynolds 045 (slippery speed), Trimax (heavy tank), Cello Gripper (rubber grip), or Parker Vector (royal steel). Toggle cap on the back to shift center of mass!",
        icon: "🖊️",
        badge: "Arsenal",
      },
      {
        stepNumber: 2,
        title: "Slingshot Aim & Power Meter",
        description: "Touch down on your pen and pull backwards to aim. The dotted laser line shows your trajectory while the dynamic power gauge charges from 0% to 100%.",
        icon: "🎯",
        badge: "Flick Aim",
      },
      {
        stepNumber: 3,
        title: "Impact & Angular Spin",
        description: "Release to flick! Hitting the opponent's tail induces violent rotational spin. Glancing blows slide pens toward the edges.",
        icon: "⚡",
        badge: "Clash",
      },
      {
        stepNumber: 4,
        title: "Edge Teeter & Table Drop KO",
        description: "If a pen's center of mass crosses the desk edge, gravity takes over and it tumbles off the table! Knock the opponent off to win the round (Best of 3). Don't flick yourself off!",
        icon: "👑",
        badge: "Knockout",
      },
    ],
    proTips: [
      "The Tail Spin Strike: Aim for the rear clip of the opponent's pen to spin them off-balance toward the table edge!",
      "Edge Teeter Defense: If you're near the table edge, make a light, controlled flick along the edge rather than a full-power blast.",
      "Cap Physics: Mounting the cap on the back adds mass and increases rotational spin upon impact.",
      "The Bank Shot: Glancing off the opponent's tip can push them sideways while keeping your own pen safely on the center teak wood.",
    ],
    winCondition: "First player to knock the opponent's pen off the desk 2 times (Best of 3) wins the Classroom Championship!",
    boardLayoutDescription: "2.5D classroom desk with compass carvings, tea rings, green chalkboard HUD, and wooden school benches.",
    asciiDiagram: `
    [ 🏫 GREEN CHALKBOARD • MATHS PERIOD: HOST 1 - GUEST 0 ]
    +-------------------------------------------------------+
    |                    OPPONENT PEN                       |
    |                                                       |
    |                  [ WOODEN DESK ]                      |
    |                                                       |
    |                 YOUR PEN (Pilot V5)                   |
    |                   \\-- AIM & FLICK -->                 |
    +-------------------------------------------------------+
    `,
  },
  colorrush: {
    gameId: "colorrush",
    title: "Color Rush 1v1",
    tagline: "High-speed territory painter, real-time drag & splash, tactical power-up bombs, and 00:00 freeze percentage showdown!",
    category: "Action",
    icon: "🎨",
    accentColor: "#06b6d4",
    gradient: "from-cyan-500 via-fuchsia-500 to-pink-500",
    difficulty: "Fast",
    avgDuration: "15 - 90s",
    objective: "Swipe and drag across the plain arena board to coat the surface in your color. When the clock strikes 00:00, the board freezes and the player with the highest captured area percentage wins!",
    quickSummary: "Real-time territorial duel on a plain board! Paint unclaimed territory, slice into opponent zones to overwrite their color, grab floating power-up crates (Bomb 💣, Turbo ⚡, Freeze ❄️), and dominate the live territory gauge.",
    steps: [
      {
        stepNumber: 1,
        title: "Choose Timer & Palette",
        description: "Pick your duel duration (15s Blitz, 30s Standard, 60s Championship, 90s Marathon) and your signature color theme (Cyan vs Pink, Violet vs Amber, Lime vs Indigo, or Custom!).",
        icon: "⏱️",
        badge: "Setup",
      },
      {
        stepNumber: 2,
        title: "Drag & Swipe to Paint",
        description: "Touch down and drag continuously across the plain arena board. Your brush paints a fluid, seamless coat of color in real-time.",
        icon: "🖌️",
        badge: "Paint",
      },
      {
        stepNumber: 3,
        title: "Overwrite & Power-Up Clash",
        description: "Slash across opponent territory to steal their area! Grab tactical power-ups: Color Bomb (wide blast), Turbo Roller (wider brush), and Glaze Freeze (locks opponent for 2.5s).",
        icon: "💣",
        badge: "Overdrive",
      },
      {
        stepNumber: 4,
        title: "00:00 Freeze & Area Tally",
        description: "When the countdown expires, the plain board freezes with a frosted glass sheen. An animated laser scan counts exact captured percentages to crown the champion!",
        icon: "🏆",
        badge: "Victory",
      },
    ],
    proTips: [
      "Perimeter First: Sweep the unpainted outer edges early to build up free percentage before engaging in border clashes.",
      "Power-Up Ambush: Time your approach to newly spawned Color Bomb crates to wipe out large enemy clusters.",
      "The Turbo Slice: When collecting a Turbo Roller, immediately cut through the dense heart of your opponent's territory.",
      "Last Second Steal: In the final 5 seconds, prioritize overwriting opponent area rather than painting neutral board to gain a 2x percentage swing!",
    ],
    winCondition: "The player with the highest captured area percentage when the timer freezes at 00:00 wins!",
    boardLayoutDescription: "Smooth plain arena board with real-time continuous paint coverage, live dominance gauge, and floating tactical power-ups.",
    asciiDiagram: `
    [ 🎨 CYAN: 54.2% ] <=== [ LIVE DOMINANCE BAR ] ===> [ 🌸 PINK: 42.1% ]
    +--------------------------------------------------------------------+
    | [CYAN TERRITORY]               [💣 BOMB]          [PINK TERRITORY] |
    | [CYAN TERRITORY]    [⚡ TURBO]                    [PINK TERRITORY] |
    |                     [PLAIN UNCLAIMED BOARD]                        |
    | [CYAN TERRITORY]               [❄️ FREEZE]        [PINK TERRITORY] |
    +--------------------------------------------------------------------+
    `,
  },
  dotsboxes: {
    gameId: "dotsboxes",
    title: "Dots & Boxes (Square Clash)",
    tagline: "Connect dots, complete 4-sided boxes, and unleash chained bonus turns!",
    category: "Strategy",
    icon: "🔲",
    accentColor: "#6366f1",
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    difficulty: "Medium",
    avgDuration: "3 - 5 mins",
    objective: "Draw horizontal or vertical lines between dots. Complete the 4th side of any box to claim it and earn a free bonus turn!",
    quickSummary: "Turn-based tactical grid duel. The player who captures the most boxes wins. Completing a box grants an immediate extra move, creating devastating chain reactions!",
    steps: [
      {
        stepNumber: 1,
        title: "Draw a Line",
        description: "Click or tap between two adjacent dots to draw a glowing horizontal or vertical line.",
        icon: "✏️",
        badge: "Turn",
      },
      {
        stepNumber: 2,
        title: "Close a Box",
        description: "If your line completes the fourth side of a 1x1 box, you claim it! The box fills with your neon color and crest.",
        icon: "📦",
        badge: "+1 Point",
      },
      {
        stepNumber: 3,
        title: "Bonus Chain Turn",
        description: "Claiming a box immediately grants you an extra turn! Use chains to swallow multiple boxes consecutively.",
        icon: "⚡",
        badge: "Combo",
      },
      {
        stepNumber: 4,
        title: "Endgame Tally",
        description: "When all 16 boxes are closed, the player with the highest box count is crowned the Grandmaster.",
        icon: "🏆",
        badge: "Victory",
      },
    ],
    proTips: [
      "Avoid 3rd sides: Don't give away the 3rd side of a box unless you have to, or your rival will easily claim it.",
      "The Double Cross: Sacrifice 2 boxes in a corridor to force your opponent into giving you the rest of the board!",
      "Count the chains: Identify long corridors of boxes that can be vacuumed up in a single continuous turn.",
    ],
    winCondition: "Claim more boxes than your opponent when all boxes are closed.",
    boardLayoutDescription: "5x5 dot matrix resulting in 16 capture boxes with interactive glowing borders.",
  },
  airhockey: {
    gameId: "airhockey",
    title: "Neon Air Hockey 1v1",
    tagline: "Hyper-speed glowing puck physics, bank shots, and lightning fast reflexes!",
    category: "Action",
    icon: "🏒",
    accentColor: "#06b6d4",
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    difficulty: "Medium",
    avgDuration: "2 - 3 mins",
    objective: "Defend your neon goal and smash the high-speed glowing puck into your opponent's net!",
    quickSummary: "Real-time physics arcade sport. Drag your mallet to deflect the puck with impulse, bounce off rails, and score 5 or 7 goals to win.",
    steps: [
      {
        stepNumber: 1,
        title: "Drag Your Mallet",
        description: "Hold and drag your glowing paddle within your half of the neon table to defend your goal line.",
        icon: "🕹️",
        badge: "Control",
      },
      {
        stepNumber: 2,
        title: "Strike with Momentum",
        description: "Flick your paddle hard into the puck to impart massive velocity and angle for tricky rail bank shots.",
        icon: "💥",
        badge: "Physics",
      },
      {
        stepNumber: 3,
        title: "Score Goals",
        description: "Slide the puck past your rival's defense into the open goal pocket to trigger sirens and earn points.",
        icon: "🥅",
        badge: "Goal!",
      },
      {
        stepNumber: 4,
        title: "Reach Goal Target",
        description: "First player to reach 5 or 7 points claims championship victory.",
        icon: "🏆",
        badge: "Match Win",
      },
    ],
    proTips: [
      "Center-Line Defense: Stay slightly ahead of your goal to cut off bank shot angles.",
      "Whip Strikes: Slashing across the puck gives it sideways spin that deflects unpredictably off side walls.",
      "Patience pays: Wait for the puck to rebound into your zone before lunging forward with maximum speed.",
    ],
    winCondition: "First player to score the target number of goals (default 5) wins the match.",
    boardLayoutDescription: "High-voltage neon air table with goal nets, glowing boundary cushions, and real-time puck particle trail.",
  },
  typerace: {
    gameId: "typerace",
    title: "Speed Typing Nitro Race",
    tagline: "Sprint down the neon speedway with real-time WPM, drift physics, and nitro boosts!",
    category: "Reflex",
    icon: "🏎️",
    accentColor: "#f59e0b",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    difficulty: "Medium",
    avgDuration: "1 - 2 mins",
    objective: "Type the target text faster and more accurately than your opponent to drive your sports car across the finish line!",
    quickSummary: "Competitive multiplayer typing sprint. Every correct word propels your car forward with live WPM speedometers, nitro flames, and accuracy tracking.",
    steps: [
      {
        stepNumber: 1,
        title: "Ready, Set, Type!",
        description: "When the lights turn green, start typing the displayed passage as fast as your fingers can fly.",
        icon: "🚦",
        badge: "Start",
      },
      {
        stepNumber: 2,
        title: "Green Lights & Fixes",
        description: "Correct characters turn neon green and advance your race car. Typos highlight red until corrected.",
        icon: "⌨️",
        badge: "Accuracy",
      },
      {
        stepNumber: 3,
        title: "Nitro Boost Streaks",
        description: "Typing 5 consecutive words without errors triggers a nitro overdrive flame that surges your car ahead.",
        icon: "🔥",
        badge: "Speed",
      },
      {
        stepNumber: 4,
        title: "Checkered Flag",
        description: "The first racer to finish the full paragraph takes 1st place with full WPM and accuracy metrics.",
        icon: "🏁",
        badge: "Finish",
      },
    ],
    proTips: [
      "Rhythm over rush: Smooth, typo-free typing is much faster than typing fast and having to hit backspace.",
      "Look ahead: Scan 2-3 words ahead so your fingers never pause between words.",
      "Finger placement: Keep your hands in home row position for optimal reaction speed on punctuation marks.",
    ],
    winCondition: "First player to complete typing the passage with the highest finish time / WPM wins.",
    boardLayoutDescription: "Dual-lane neon racetrack with animated drifting sports cars, live WPM gauges, and target passage display.",
  },
  wordclash: {
    gameId: "wordclash",
    title: "Word Clash 1v1 (Wordle Duel)",
    tagline: "Decipher secret 5-letter words with tactical color clues in a head-to-head duel!",
    category: "Brain",
    icon: "🔤",
    accentColor: "#10b981",
    gradient: "from-emerald-500 via-teal-600 to-cyan-600",
    difficulty: "Medium",
    avgDuration: "3 - 4 mins",
    objective: "Guess the hidden 5-letter word within 6 attempts using color-coded tile feedback before your opponent does!",
    quickSummary: "Turn-based or simultaneous 5-letter word puzzle. Green tiles indicate correct letter in correct spot, Yellow indicates right letter in wrong spot, Gray indicates letter not present.",
    steps: [
      {
        stepNumber: 1,
        title: "Enter a 5-Letter Guess",
        description: "Type any valid 5-letter word using the virtual keyboard or your physical keys, then submit.",
        icon: "🔤",
        badge: "Guess",
      },
      {
        stepNumber: 2,
        title: "Read Tile Feedback",
        description: "🟩 Green = Right letter & right spot. 🟨 Yellow = Right letter, wrong spot. ⬛ Gray = Not in the word.",
        icon: "🎨",
        badge: "Clues",
      },
      {
        stepNumber: 3,
        title: "Eliminate Letters",
        description: "The on-screen keyboard updates dynamically with color-coded key statuses to help narrow down possibilities.",
        icon: "💡",
        badge: "Strategy",
      },
      {
        stepNumber: 4,
        title: "Solve the Mystery",
        description: "Crack the secret word in fewer attempts or faster time to claim victory and earn bonus XP.",
        icon: "🏆",
        badge: "Victory",
      },
    ],
    proTips: [
      "Vowel-rich openers: Start with words rich in vowels and common consonants like 'CRANE', 'AUDIO', or 'SLATE'.",
      "Don't reuse gray letters: Always check the virtual keyboard to avoid wasting slots on eliminated letters.",
      "Hard mode discipline: Once you discover a green tile, build your subsequent guesses around that locked position.",
    ],
    winCondition: "Guess the secret 5-letter word in fewer attempts than your opponent.",
    boardLayoutDescription: "Side-by-side 6x5 flip-card Wordle grids with neon illuminated virtual keyboards.",
  },
};

export const GAME_RULES = ALL_GAME_RULES;


