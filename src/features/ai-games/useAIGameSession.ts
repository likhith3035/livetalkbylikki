import { useState, useCallback, useEffect, useRef } from "react";
import { AI_BOT_SESSION_ID } from "@/features/shared/constants";
import {
  writeGameState,
  subscribeGameState,
  setAIThinking,
  clearGameState,
} from "./firebaseGameStore";
import {
  bestTttMove,
  createInitialTttBoard,
  getWinner,
  isBoardFull,
} from "./ai/tttMinimax";
import { counterRpsChoice, rpsOutcome, RPS_EMOJI } from "./ai/rpsRandom";
import { fetchTriviaQuestion } from "./ai/triviaApi";
import type {
  AIGameType,
  TttGameState,
  RpsGameState,
  TriviaGameState,
  TttCell,
  RpsChoice,
} from "./types";

const THINK_MS = 900;

interface UseAIGameSessionOptions {
  roomId: string | null;
  sessionId: string;
  enabled?: boolean;
}

export function useAIGameSession({ roomId, sessionId, enabled = true }: UseAIGameSessionOptions) {
  const [activeGame, setActiveGame] = useState<AIGameType | null>(null);
  const [aiThinking, setAiThinkingLocal] = useState(false);
  const [ttt, setTtt] = useState<TttGameState | null>(null);
  const [rps, setRps] = useState<RpsGameState | null>(null);
  const [trivia, setTrivia] = useState<TriviaGameState | null>(null);
  const lastHumanRps = useRef<RpsChoice | null>(null);

  useEffect(() => {
    if (!enabled || !roomId || !activeGame) return;
    return subscribeGameState(roomId, activeGame, (_state, meta) => {
      if (meta?.updatedBy === AI_BOT_SESSION_ID) {
        setAiThinkingLocal(!!meta.aiThinking);
      }
    });
  }, [enabled, roomId, activeGame]);

  const runAIThinking = useCallback(
    async (gameType: AIGameType, fn: () => Promise<void>) => {
      if (!roomId) return;
      setAiThinkingLocal(true);
      await setAIThinking(roomId, gameType, true);
      await new Promise((r) => setTimeout(r, THINK_MS));
      await fn();
      setAiThinkingLocal(false);
      await setAIThinking(roomId, gameType, false);
    },
    [roomId]
  );

  const startTtt = useCallback(async () => {
    if (!roomId) return;
    setActiveGame("ttt");
    const humanSymbol: "X" | "O" = Math.random() > 0.5 ? "X" : "O";
    const state: TttGameState = {
      board: createInitialTttBoard(),
      turn: "X",
      humanSymbol,
      status: "playing",
      winner: null,
    };
    setTtt(state);
    await writeGameState(roomId, "ttt", state, sessionId);

    if (humanSymbol === "O") {
      await runAIThinking("ttt", async () => {
        const idx = bestTttMove(state.board, "X");
        const board = [...state.board] as TttCell[];
        board[idx] = "X";
        const next: TttGameState = { ...state, board, turn: "O" };
        setTtt(next);
        await writeGameState(roomId, "ttt", next, AI_BOT_SESSION_ID);
      });
    }
  }, [roomId, sessionId, runAIThinking]);

  const playTttMove = useCallback(
    async (index: number) => {
      if (!roomId || !ttt || ttt.status !== "playing" || ttt.turn !== ttt.humanSymbol) return;
      if (ttt.board[index]) return;

      const board = [...ttt.board] as TttCell[];
      board[index] = ttt.humanSymbol;
      let next: TttGameState = { ...ttt, board, turn: ttt.humanSymbol === "X" ? "O" : "X" };
      const w = getWinner(board);
      if (w) next = { ...next, status: "won", winner: w };
      else if (isBoardFull(board)) next = { ...next, status: "draw", winner: null };

      setTtt(next);
      await writeGameState(roomId, "ttt", next, sessionId);
      if (next.status !== "playing") return;

      const aiSymbol = ttt.humanSymbol === "X" ? "O" : "X";
      await runAIThinking("ttt", async () => {
        const aiIdx = bestTttMove(next.board, aiSymbol);
        const aiBoard = [...next.board] as TttCell[];
        aiBoard[aiIdx] = aiSymbol;
        let after: TttGameState = {
          ...next,
          board: aiBoard,
          turn: aiSymbol === "X" ? "O" : "X",
        };
        const aw = getWinner(aiBoard);
        if (aw) after = { ...after, status: "won", winner: aw };
        else if (isBoardFull(aiBoard)) after = { ...after, status: "draw", winner: null };
        setTtt(after);
        await writeGameState(roomId, "ttt", after, AI_BOT_SESSION_ID);
      });
    },
    [roomId, ttt, sessionId, runAIThinking]
  );

  const startRps = useCallback(async () => {
    if (!roomId) return;
    setActiveGame("rps");
    const state: RpsGameState = {
      humanChoice: null,
      aiChoice: null,
      round: 1,
      humanScore: 0,
      aiScore: 0,
      draws: 0,
      status: "idle",
    };
    setRps(state);
    await writeGameState(roomId, "rps", state, sessionId);
  }, [roomId, sessionId]);

  const playRps = useCallback(
    async (choice: RpsChoice) => {
      if (!roomId || !rps || rps.status === "thinking") return;
      lastHumanRps.current = choice;
      const thinking: RpsGameState = { ...rps, humanChoice: choice, status: "thinking" };
      setRps(thinking);
      await writeGameState(roomId, "rps", thinking, sessionId, true);

      await runAIThinking("rps", async () => {
        const aiChoice = counterRpsChoice(choice);
        const outcome = rpsOutcome(choice, aiChoice);
        const revealed: RpsGameState = {
          ...thinking,
          aiChoice,
          status: "revealed",
          humanScore: outcome === "win" ? thinking.humanScore + 1 : thinking.humanScore,
          aiScore: outcome === "lose" ? thinking.aiScore + 1 : thinking.aiScore,
          draws: outcome === "draw" ? thinking.draws + 1 : thinking.draws,
          round: thinking.round + 1,
        };
        setRps(revealed);
        await writeGameState(roomId, "rps", revealed, AI_BOT_SESSION_ID);
      });
    },
    [roomId, rps, sessionId, runAIThinking]
  );

  const resetRpsRound = useCallback(async () => {
    if (!roomId || !rps) return;
    const next: RpsGameState = {
      ...rps,
      humanChoice: null,
      aiChoice: null,
      status: "idle",
    };
    setRps(next);
    await writeGameState(roomId, "rps", next, sessionId);
  }, [roomId, rps, sessionId]);

  const startTrivia = useCallback(async () => {
    if (!roomId) return;
    setActiveGame("trivia");
    setTrivia({
      question: null,
      selectedAnswer: null,
      score: 0,
      round: 1,
      status: "loading",
      wasCorrect: null,
    });
    await writeGameState(
      roomId,
      "trivia",
      { status: "loading", score: 0, round: 1 },
      sessionId,
      true
    );

    await runAIThinking("trivia", async () => {
      const question = await fetchTriviaQuestion();
      const state: TriviaGameState = {
        question,
        selectedAnswer: null,
        score: 0,
        round: 1,
        status: "playing",
        wasCorrect: null,
      };
      setTrivia(state);
      await writeGameState(roomId, "trivia", state, AI_BOT_SESSION_ID);
    });
  }, [roomId, sessionId, runAIThinking]);

  const answerTrivia = useCallback(
    async (answer: string) => {
      if (!roomId || !trivia?.question || trivia.status !== "playing") return;
      const wasCorrect = answer === trivia.question.correctAnswer;
      const answered: TriviaGameState = {
        ...trivia,
        selectedAnswer: answer,
        status: "answered",
        wasCorrect,
        score: wasCorrect ? trivia.score + 1 : trivia.score,
      };
      setTrivia(answered);
      await writeGameState(roomId, "trivia", answered, sessionId);

      await runAIThinking("trivia", async () => {
        const question = await fetchTriviaQuestion();
        const next: TriviaGameState = {
          question,
          selectedAnswer: null,
          score: answered.score,
          round: answered.round + 1,
          status: "playing",
          wasCorrect: null,
        };
        setTrivia(next);
        await writeGameState(roomId, "trivia", next, AI_BOT_SESSION_ID);
      });
    },
    [roomId, trivia, sessionId, runAIThinking]
  );

  const stopAI = useCallback(async () => {
    if (roomId && activeGame) await clearGameState(roomId, activeGame);
    setActiveGame(null);
    setTtt(null);
    setRps(null);
    setTrivia(null);
    setAiThinkingLocal(false);
  }, [roomId, activeGame]);

  return {
    activeGame,
    aiThinking,
    ttt,
    rps,
    trivia,
    startTtt,
    playTttMove,
    startRps,
    playRps,
    resetRpsRound,
    startTrivia,
    answerTrivia,
    stopAI,
    rpsEmoji: RPS_EMOJI,
  };
}
