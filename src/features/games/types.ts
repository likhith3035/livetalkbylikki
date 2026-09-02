export type GameId = "ttt" | "connect4" | "rps" | "memory" | "reaction";

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
  aiDifficulty?: "easy" | "medium" | "hard";
}

export interface GameReaction {
  id: string;
  senderId: string;
  senderName: string;
  type: "emoji" | "taunt";
  content: string;
  timestamp: number;
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
}

export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCardIds: number[];
  hostPairs: number;
  guestPairs: number;
  totalPairs: number;
}

export interface ReactionGameState {
  gameState: "waiting" | "go" | "clicked" | "false_start";
  greenAt: number | null;
  hostTimeMs: number | null;
  guestTimeMs: number | null;
  winner: string | null;
}
