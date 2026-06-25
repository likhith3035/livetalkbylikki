export type TttCell = "X" | "O" | null;
export type RpsChoice = "R" | "P" | "S";
export type AIGameType = "ttt" | "rps" | "trivia";

export interface TttGameState {
  board: TttCell[];
  turn: "X" | "O";
  humanSymbol: "X" | "O";
  status: "playing" | "won" | "draw";
  winner: TttCell;
}

export interface RpsGameState {
  humanChoice: RpsChoice | null;
  aiChoice: RpsChoice | null;
  round: number;
  humanScore: number;
  aiScore: number;
  draws: number;
  status: "idle" | "thinking" | "revealed";
}

export interface TriviaQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  category: string;
  difficulty: string;
}

export interface TriviaGameState {
  question: TriviaQuestion | null;
  selectedAnswer: string | null;
  score: number;
  round: number;
  status: "loading" | "playing" | "answered" | "thinking";
  wasCorrect: boolean | null;
}

export interface AIGameMeta {
  gameType: AIGameType;
  aiThinking: boolean;
  updatedAt: number;
  updatedBy: string;
}
