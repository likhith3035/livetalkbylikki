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

export type TicTacToeCell = "X" | "O" | "";
export interface TicTacToeState {
  board: TicTacToeCell[];
  winningLine: number[] | null;
}

export type ConnectFourCell = "red" | "yellow" | "";
export interface ConnectFourState {
  board: ConnectFourCell[][]; // 6 rows x 7 cols (board[row][col])
  winningCells: [number, number][] | null;
  lastDroppedCol: number | null;
}

export type RPSChoice = "rock" | "paper" | "scissors" | "";
export interface RPSState {
  hostChoice: RPSChoice;
  guestChoice: RPSChoice;
  roundWinner: string | null; // playerId | "draw" | null
  revealed: boolean;
}

export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy?: string; // playerId
}
export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCardIds: number[];
  hostPairs: number;
  guestPairs: number;
  totalPairs: number;
}

export type ReactionStatus = "waiting" | "go" | "clicked" | "false_start";
export interface ReactionGameState {
  gameState: ReactionStatus;
  greenAt: number | null;
  hostTimeMs: number | null;
  guestTimeMs: number | null;
  winner: string | null;
}
