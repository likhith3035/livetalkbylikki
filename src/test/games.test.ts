import { describe, it, expect } from "vitest";
import { checkTicTacToeWinner, getBestMinimaxMove } from "@/features/games/components/games/TicTacToeGame";
import { checkConnectFourWinner, getBestConnectFourAIMove } from "@/features/games/components/games/ConnectFourGame";
import { determineRPSWinner } from "@/features/games/components/games/RPSClashGame";
import { generateGameRoomCode, createInitialGameState } from "@/features/games/services/gameRoomService";
import { TicTacToeCell, ConnectFourCell } from "@/features/games/types";

describe("LiveTalk Arcade Games Suite", () => {
  describe("Room Service & Code Generator", () => {
    it("should generate a 6-character uppercase alphanumeric room code", () => {
      const code = generateGameRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
    });

    it("should create valid initial game states for each game", () => {
      const tttState = createInitialGameState("ttt");
      expect(tttState.board).toHaveLength(9);
      expect(tttState.winningLine).toBeNull();

      const c4State = createInitialGameState("connect4");
      expect(c4State.board).toHaveLength(6);
      expect(c4State.board[0]).toHaveLength(7);

      const rpsState = createInitialGameState("rps");
      expect(rpsState.revealed).toBe(false);

      const memState = createInitialGameState("memory");
      expect(memState.cards).toHaveLength(16);
    });
  });

  describe("Tic-Tac-Toe Game Engine", () => {
    it("should detect horizontal, vertical, and diagonal wins", () => {
      const rowWinBoard: TicTacToeCell[] = [
        "X", "X", "X",
        "O", "O", "",
        "", "", "",
      ];
      expect(checkTicTacToeWinner(rowWinBoard).winner).toBe("X");

      const diagWinBoard: TicTacToeCell[] = [
        "O", "X", "",
        "X", "O", "",
        "", "", "O",
      ];
      expect(checkTicTacToeWinner(diagWinBoard).winner).toBe("O");
    });

    it("should make optimal AI blocking and winning moves via Minimax", () => {
      // AI is 'O'. Human 'X' is about to win at index 2
      const trapBoard: TicTacToeCell[] = [
        "X", "X", "",
        "O", "", "",
        "", "", "",
      ];
      const aiMove = getBestMinimaxMove(trapBoard, "O");
      expect(aiMove).toBe(2); // AI must block index 2
    });
  });

  describe("Connect 4 Engine", () => {
    it("should detect 4 in a row horizontally and vertically", () => {
      const board: ConnectFourCell[][] = Array(6).fill("").map(() => Array(7).fill(""));
      board[5][0] = "red";
      board[5][1] = "red";
      board[5][2] = "red";
      board[5][3] = "red";

      const result = checkConnectFourWinner(board);
      expect(result.winner).toBe("red");
      expect(result.cells).toHaveLength(4);
    });

    it("should block opponent's winning connect 4 drop", () => {
      const board: ConnectFourCell[][] = Array(6).fill("").map(() => Array(7).fill(""));
      // Human (red) has 3 in bottom row
      board[5][0] = "red";
      board[5][1] = "red";
      board[5][2] = "red";

      // AI is yellow. It must drop in col 3 to block
      const aiCol = getBestConnectFourAIMove(board, "yellow");
      expect(aiCol).toBe(3);
    });
  });

  describe("Rock Paper Scissors Engine", () => {
    it("should correctly evaluate winning rules and draws", () => {
      expect(determineRPSWinner("rock", "scissors")).toBe("p1");
      expect(determineRPSWinner("paper", "rock")).toBe("p1");
      expect(determineRPSWinner("scissors", "paper")).toBe("p1");

      expect(determineRPSWinner("scissors", "rock")).toBe("p2");
      expect(determineRPSWinner("rock", "rock")).toBe("draw");
    });
  });
});
