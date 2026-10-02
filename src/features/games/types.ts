export type GameId =
  | "ttt"
  | "connect4"
  | "rps"
  | "memory"
  | "reaction"
  | "sos"
  | "bingo"
  | "cricket"
  | "taptug"
  | "penfight"
  | "colorrush"
  | "dotsboxes"
  | "airhockey"
  | "typerace"
  | "wordclash";

export type GameMode = "friend" | "quickmatch" | "ai" | "local";

export type GameStatus = "waiting" | "playing" | "round_over" | "game_over" | "reconnecting";

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  symbol?: string; // "X" | "O" | "red" | "yellow" etc.
  score: number;
  level?: number;
  isHost: boolean;
  isOnline: boolean;
  lastActive: number;
}

export interface GameCustomRules {
  turnTimerSeconds: number; // 0 = unlimited, 10, 15, 30
  maxSeriesWins: number;    // 1 (Single Round), 2 (Best of 3), 3 (Best of 5), 4 (Best of 7)
  maxWickets?: number;      // 1 (Sudden Death), 3 (Standard), 5 (Grand Match)
  maxOvers?: number;        // 0 = unlimited, 1, 2, 3 overs
  aiDifficulty?: "easy" | "medium" | "hard";
  botName?: string;
  botAvatar?: string;
  player2Name?: string;
  player2Avatar?: string;
  memoryGridSize?: number;  // 4 | 5 | 6 | 7 | 8 | 9 | 10 (NxN grid, default 4)
}

export interface GameReaction {
  id: string;
  senderId: string;
  senderName: string;
  type: "emoji" | "taunt";
  content: string;
  timestamp: number;
  isSpectator?: boolean;
}

export interface GameChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSpectator?: boolean;
}

export interface SpectatorInfo {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
}

export interface MatchHistoryEntry {
  id: string;
  gameId: GameId;
  mode: GameMode;
  outcome: "won" | "lost" | "draw";
  opponentName: string;
  xpGained: number;
  timestamp: number;
}

export interface GamerProfile {
  nickname: string;
  avatar: string;
  level: number;
  xp: number;
  title: string;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  streak: number;
  bestStreak: number;
  unlockedBadges: string[];
  recentMatches?: MatchHistoryEntry[];
}

export interface GamerBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

export interface GameRoomState<TState = any> {
  roomCode: string;
  gameId: GameId;
  mode: GameMode;
  status: GameStatus;
  createdAt: number;
  currentTurn: string; // playerId
  winnerId: string | null; // playerId | "draw" | null
  seriesWinnerId?: string | null; // Series Champion (first to maxSeriesWins)
  round: number;
  maxRounds: number;
  rules?: GameCustomRules;
  spectators?: Record<string, SpectatorInfo>;
  messages?: Record<string, GameChatMessage>;
  rematchVotes?: Record<string, boolean>; // playerId -> true for 1/2 ready state
  players: {
    host: PlayerInfo;
    guest: PlayerInfo | null;
  };
  gameState: TState;
  seq: number;
  lastMoveTimestamp: number;
  turnExpiresAt?: number | null;
  disconnectGraceExpiresAt?: number | null;
}

// ── Game-Specific States (Using "" for empty cells to prevent Firebase null stripping) ──

export interface TicTacToeState {
  board: string[]; // 9 items: "" | "X" | "O"
  winningLine: number[] | null;
}

export interface ConnectFourState {
  board: string[][]; // 6 rows x 7 cols: "" | "red" | "yellow"
  winningCells: [number, number][] | null;
  lastDroppedCol: number | null;
}

export type RPSChoice = "" | "rock" | "paper" | "scissors";

export interface RPSState {
  hostChoice: string; // "" | "rock" | "paper" | "scissors"
  guestChoice: string;
  roundWinner: string | null; // playerId | "draw" | null
  revealed: boolean;
}

export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy?: string;
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCardIds: number[];
  hostPairs: number;
  guestPairs: number;
  totalPairs: number;
  gridSize: number; // NxN grid size (4-10), default 4
}

export interface ReactionGameState {
  gameState: "waiting" | "go" | "clicked" | "false_start";
  greenAt: number | null;
  hostTimeMs: number | null;
  guestTimeMs: number | null;
  winner: string | null;
}

export interface SOSLine {
  id: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  direction: "h" | "v" | "d_main" | "d_anti";
  ownerPlayerId: string;
  color: string;
}

export interface SOSGameState {
  gridSize: number; // 5 | 6 | 7 | 8
  board: string[][]; // cells: "" | "S" | "O" | "?" (wildcard)
  lines: SOSLine[];
  hostScore: number;
  guestScore: number;
  powerUpsEnabled?: boolean;
  activePowerUp?: "2x" | "bomb" | "wildcard" | null;
  hostPowerUps?: { double: number; bomb: number; wildcard: number };
  guestPowerUps?: { double: number; bomb: number; wildcard: number };
  streakCount?: number;
  aiPersona?: "rookie" | "viper" | "overlord";
  lastMove: {
    row: number;
    col: number;
    letter: "S" | "O" | "?";
    playerId: string;
    newLinesCount: number;
  } | null;
}

export interface BingoGameState {
  hostCard: number[][]; // 5x5 matrix with numbers 1-25 (0 for unfilled during draft)
  guestCard: number[][]; // 5x5 matrix with numbers 1-25 (0 for unfilled during draft)
  stampedNumbers: number[]; // Array of called numbers
  calledHistory: Array<{ number: number; calledBy: string; timestamp: number }>;
  hostLines: number; // Count of completed lines (0-5+)
  guestLines: number;
  hostCompletedLines: string[]; // IDs of completed lines (e.g., "row-0", "col-2", "diag-main")
  guestCompletedLines: string[];
  lastCalledNumber: number | null;
  isCardLocked?: boolean;
  phase?: "setup" | "playing" | "round_over";
  hostReady?: boolean;
  guestReady?: boolean;
}

export interface CricketDelivery {
  ballNumber: number;
  batsmanRun: number; // 0..6
  bowlerRun: number; // 0..6
  isWicket: boolean;
  runsScored: number;
  commentary: string; // e.g. "Clean Bowled!", "Smashed for SIX over long-on!", "Quick single"
  timestamp: number;
}

export interface HandCricketState {
  phase: "toss" | "toss_decision" | "innings_1" | "innings_break" | "innings_2" | "match_over";
  
  // Toss details
  toss: {
    callerId: string; // Player who called odd/even
    choice: "odd" | "even";
    hostPick: number | null; // 1-6
    guestPick: number | null; // 1-6
    winnerId: string | null;
    elected: "bat" | "bowl" | null;
  };

  // Batting / Bowling assignments
  currentInnings: 1 | 2;
  batsmanId: string; // playerId currently batting
  bowlerId: string; // playerId currently bowling
  
  // Match constraints
  maxWickets: number; // 1, 3, 5
  maxOvers: number; // 0 = unlimited, 1, 2, 3 overs
  
  // Innings 1 statistics
  innings1: {
    battingPlayerId: string;
    runs: number;
    wickets: number;
    balls: number;
    deliveries: CricketDelivery[];
  };

  // Innings 2 statistics
  innings2: {
    battingPlayerId: string;
    runs: number;
    wickets: number;
    balls: number;
    target: number; // innings1.runs + 1
    deliveries: CricketDelivery[];
  };

  // Current delivery in-progress
  currentDelivery: {
    hostPick: number | null; // 0-6
    guestPick: number | null; // 0-6
    revealed: boolean;
    lastResult?: {
      batsmanPick: number;
      bowlerPick: number;
      isWicket: boolean;
      runsAdded: number;
      commentary: string;
    } | null;
  };

  // Bot persona details
  aiPersona?: "gully" | "spin_king" | "captain_cool";
  aiSpeech?: string;
}

export type SpectatorCheerType = "confetti" | "horn" | "applause" | "rocket";

export interface SpectatorCheer {
  id: string;
  roomCode: string;
  spectatorName: string;
  type: SpectatorCheerType;
  timestamp: number;
}

// ── Tap Blitz: Tug of War Types ──

export type TapTugPowerUp = "2x" | "freeze" | "bomb" | "shield";

export interface TapTugGameState {
  ropePosition: number; // 0 to 100 (50 is center; >= 100 Host KO, <= 0 Guest KO)
  hostTaps: number;
  guestTaps: number;
  hostHeat: number; // 0 to 100
  guestHeat: number;
  hostOverdrive: boolean;
  guestOverdrive: boolean;
  hostPowerUp: TapTugPowerUp | null;
  guestPowerUp: TapTugPowerUp | null;
  hostFrozenUntil: number; // timestamp
  guestFrozenUntil: number; // timestamp
  hostShieldUntil: number; // timestamp
  guestShieldUntil: number; // timestamp
  hostMultiplierTapsLeft: number;
  guestMultiplierTapsLeft: number;
  matchDurationSeconds: number;
  timeRemainingSeconds: number;
  startedAt: number;
  lastTapTimestamp: number;
  lastTapPlayerId?: string;
  isKO?: boolean;
}

// ── Pen Fight: Classroom Duel Types ──

export type PenModelId = "pilot_v5" | "reynolds_045" | "trimax" | "cello_gripper" | "parker_vector" | "montblanc" | "lamy_safari" | "camlin_flora";

export type PenSurfaceType = "classic_wood" | "glass_desk" | "velvet_mat" | "wet_desk";

export type PenSkinId = "default" | "flames" | "glitter" | "neon_glow" | "school_logo" | "galaxy" | "carbon_fiber";

export type PenPowerUpType = "eraser_shield" | "ink_splash" | "compass_spin";

export interface PenPowerUpOnDesk {
  id: string;
  type: PenPowerUpType;
  x: number;
  y: number;
  spawnedAt: number;
  collectedBy?: string | null; // "host" | "guest" | null
}

export interface DeskDamageMark {
  x: number;
  y: number;
  type: "ink_splatter" | "scratch" | "dent";
  radius: number;
  color: string;
  angle: number;
  opacity: number;
}

export interface TrickShotEvent {
  type: "bank_shot" | "spin_kill" | "edge_save" | "double_bounce";
  playerId: string;
  bonusPoints: number;
  description: string;
  timestamp: number;
}

export interface ReplayFrame {
  hostPen: { x: number; y: number; angle: number; vx: number; vy: number; va: number; isFallen: boolean; fallenZ?: number };
  guestPen: { x: number; y: number; angle: number; vx: number; vy: number; va: number; isFallen: boolean; fallenZ?: number };
  hasCollision: boolean;
  timestamp: number;
}

export interface PenRigidBody {
  id: string; // "host" | "guest"
  modelId: PenModelId;
  capOn: boolean; // Cap attached to back (+mass, +length, +moment of inertia)
  skinId: PenSkinId;
  x: number; // Table coordinates (0 to 1000)
  y: number; // Table coordinates (0 to 1800)
  angle: number; // In radians
  vx: number; // Velocity X
  vy: number; // Velocity Y
  va: number; // Angular velocity (rad/s)
  mass: number;
  length: number;
  width: number;
  isFallen: boolean; // Dropped off table
  teeterProgress: number; // 0 to 1 (hanging on edge)
  fallenZ?: number; // 3D drop distance to floor (0 to 100)
  hasShield?: boolean; // Eraser shield power-up active
  isInkSplashed?: boolean; // Opponent applied ink splash debuff
  edgeBounceCount?: number; // Tracks wall bounces for bank shot detection
  totalRotations?: number; // Tracks cumulative rotation for spin kill detection
}

export interface PenFlickMove {
  playerId: string;
  angle: number;
  power: number; // 0 to 100
  timestamp: number;
}

export interface PenFightGameState {
  phase: "setup" | "toss" | "aiming" | "sliding" | "round_over" | "match_over" | "replay";
  roundNumber: number;
  totalRounds: number; // 3 (Best of 3) or 5 or 7
  hostPen: PenRigidBody;
  guestPen: PenRigidBody;
  currentTurn: string; // playerId
  hostWins: number;
  guestWins: number;
  lastFlick?: PenFlickMove | null;
  roundWinnerId?: string | null;
  commentary: string;
  matchWinnerId?: string | null;
  surfaceType: PenSurfaceType;
  powerUps: PenPowerUpOnDesk[];
  hostActivePowerUp?: PenPowerUpType | null;
  guestActivePowerUp?: PenPowerUpType | null;
  deskDamage: DeskDamageMark[];
  trickShots: TrickShotEvent[];
  hostTrickScore: number;
  guestTrickScore: number;
}

export type ColorRushTimerOption = 15 | 30 | 60 | 90;
export type ColorRushPowerUpType = "bomb" | "turbo" | "freeze" | "shield";

export interface ColorRushPowerUp {
  id: string;
  type: ColorRushPowerUpType;
  x: number;
  y: number;
  active: boolean;
  spawnedAt: number;
}

export interface ColorRushGameState {
  grid: number[]; // 0 = neutral, 1 = host, 2 = guest
  gridWidth: number;
  gridHeight: number;
  hostColor: string;
  guestColor: string;
  themeId: string;
  hostPct: number;
  guestPct: number;
  neutralPct: number;
  timerDurationSeconds: ColorRushTimerOption;
  timeRemainingSeconds: number;
  startedAt: number;
  frozenAt: number | null;
  hostFrozenUntil: number;
  guestFrozenUntil: number;
  hostTurboUntil: number;
  guestTurboUntil: number;
  powerUps: ColorRushPowerUp[];
  lastMoveTimestamp: number;
  winner: "host" | "guest" | "draw" | null;
  hostScore: number;
  guestScore: number;
}

// ── Dots & Boxes (Chowka / Square Clash) ──

export interface DotsBoxesGameState {
  gridSize: number; // e.g. 5 (5x5 dots = 4x4 boxes = 16 boxes total)
  lines: Record<string, string>; // "h_r_c" or "v_r_c" -> playerId
  boxes: Record<string, string>; // "r_c" -> playerId
  hostScore: number;
  guestScore: number;
  totalBoxes: number;
  lastMoveLineId?: string | null;
  lastCompletedBoxes?: string[];
  chainCount: number;
  winner?: string | null;
}

// ── Neon Air Hockey 1v1 (Glow Puck Arena) ──

export interface AirHockeyPaddle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface AirHockeyPuck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface AirHockeyGameState {
  tableWidth: number;
  tableHeight: number;
  puck: AirHockeyPuck;
  hostPaddle: AirHockeyPaddle;
  guestPaddle: AirHockeyPaddle;
  hostScore: number;
  guestScore: number;
  maxScore: number; // 5 or 7
  lastScorerId: string | null;
  isPaused: boolean;
  pauseRemainingSeconds: number;
  goalAnimationTrigger: number;
  winner?: string | null;
}

// ── Speed Typing Nitro Race ──

export interface TypeRaceGameState {
  promptText: string;
  words: string[];
  hostCharIndex: number;
  guestCharIndex: number;
  hostWpm: number;
  guestWpm: number;
  hostAccuracy: number;
  guestAccuracy: number;
  hostFinished: boolean;
  guestFinished: boolean;
  hostFinishTimeMs: number | null;
  guestFinishTimeMs: number | null;
  startedAt: number;
  winner?: string | null;
}

// ── Word Clash 1v1 (Wordle Duel) ──

export type WordTileResult = "correct" | "present" | "absent";

export interface WordClashAttempt {
  word: string;
  result: WordTileResult[];
  timestamp: number;
}

export interface WordClashGameState {
  targetWord: string;
  clueHint: string;
  hostAttempts: WordClashAttempt[];
  guestAttempts: WordClashAttempt[];
  hostCurrentWord: string;
  guestCurrentWord: string;
  maxAttempts: number; // 6
  hostWon: boolean;
  guestWon: boolean;
  revealed: boolean;
  winner?: string | null;
}


