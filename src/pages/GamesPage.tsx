import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { GameId, GameMode, GameRoomState, PlayerInfo, GameCustomRules } from "@/features/games/types";
import { GameCard, GameMetadata } from "@/features/games/components/GameCard";
import { GameModeModal } from "@/features/games/components/GameModeModal";
import { QuickMatchSearchingOverlay } from "@/features/games/components/QuickMatchSearchingOverlay";
import { GameScoreboard } from "@/features/games/components/GameScoreboard";
import { QRShareModal } from "@/features/games/components/QRShareModal";
import { ReconnectionBanner } from "@/features/games/components/ReconnectionBanner";
import { VictoryModal } from "@/features/games/components/VictoryModal";
import { GameLiveReactions } from "@/features/games/components/GameLiveReactions";
import { TicTacToeGame } from "@/features/games/components/games/TicTacToeGame";
import { ConnectFourGame } from "@/features/games/components/games/ConnectFourGame";
import { RPSClashGame } from "@/features/games/components/games/RPSClashGame";
import { MemoryDuelGame } from "@/features/games/components/games/MemoryDuelGame";
import { ReactionDashGame } from "@/features/games/components/games/ReactionDashGame";
import {
  createGameRoom,
  joinGameRoom,
  joinAsSpectator,
  leaveSpectator,
  findOrJoinQuickMatch,
  cancelQuickMatchQueue,
  subscribeToGameRoom,
  leaveGameRoom,
  resetGameRound,
  sendGameMove,
  createInitialGameState,
} from "@/features/games/services/gameRoomService";
import { gameAudio } from "@/features/games/services/gameSoundService";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";
import { getCurrentUserId } from "@/lib/auth";
import { getProfile } from "@/lib/identity";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Gamepad2,
  QrCode,
  ScanLine,
  Search,
  Trophy,
  Flame,
  Swords,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import QrScanner from "@/components/chat/QrScanner";

const GAMES_CATALOG: GameMetadata[] = [
  {
    id: "ttt",
    title: "Tic-Tac-Toe Neon",
    tagline: "The timeless 3x3 battle with animated win strokes and unbeatable Minimax AI.",
    category: "Classic",
    icon: "⭕",
    gradient: "from-violet-500 to-purple-600",
    accentColor: "#8b5cf6",
    badge: "Popular",
  },
  {
    id: "connect4",
    title: "Connect 4 Drop",
    tagline: "Drop chips into the 7x6 grid with gravity physics to connect four in a row.",
    category: "Strategy",
    icon: "🔴",
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "#3b82f6",
    badge: "1v1 Classic",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    tagline: "Blind pick showdown with animated 3-2-1 clash and multi-round series.",
    category: "Casual",
    icon: "✊",
    gradient: "from-rose-500 to-pink-600",
    accentColor: "#f43f5e",
    badge: "Fast",
  },
  {
    id: "memory",
    title: "Memory Card Duel",
    tagline: "Flip and match pairs in a turn-based memory showdown. Most pairs wins!",
    category: "Strategy",
    icon: "🧠",
    gradient: "from-amber-500 to-orange-600",
    accentColor: "#f59e0b",
    badge: "Brain",
  },
  {
    id: "reaction",
    title: "Reaction Dash",
    tagline: "Wait for green and tap with split-second reflexes. Millisecond precision score.",
    category: "Reflex",
    icon: "⚡",
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "#10b981",
    badge: "Reflex",
  },
];

interface ArcadeStats {
  wins: number;
  played: number;
  streak: number;
}

function getStoredArcadeStats(): ArcadeStats {
  try {
    const raw = localStorage.getItem("livetalk_arcade_stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, played: 0, streak: 0 };
}

function saveArcadeStats(stats: ArcadeStats) {
  try {
    localStorage.setItem("livetalk_arcade_stats", JSON.stringify(stats));
  } catch {}
}

export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const onlineCount = useOnlineCount();

  const [activeRoom, setActiveRoom] = useState<GameRoomState | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [dismissedVictoryRound, setDismissedVictoryRound] = useState<number>(-1);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameMetadata | null>(null);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);
  const [searchingGameMeta, setSearchingGameMeta] = useState<GameMetadata | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [arcadeStats, setArcadeStats] = useState<ArcadeStats>(getStoredArcadeStats);
  const createdRoomCodeRef = useRef<string | null>(null);
  const recordedRoundRef = useRef<number>(-1);

  useSEO({
    title: "LiveTalk Arcade – Play 1v1 Games Online via QR Code & AI",
    description:
      "Play interactive multiplayer games with friends via QR code or vs smart AI bots. Tic-Tac-Toe, Connect 4, Rock Paper Scissors, Memory Duel & Reaction Dash on LiveTalk.",
    keywords:
      "online games, play games with friends, qr code games, 1v1 games, tic tac toe online, connect 4 online, rock paper scissors, memory game, reflex test, livetalk arcade",
  });

  const myPlayerId = useMemo(() => getCurrentUserId(), []);
  const myProfile = useMemo(() => getProfile(), []);

  const myPlayerInfo: PlayerInfo = useMemo(
    () => ({
      id: myPlayerId,
      name: myProfile.nickname?.trim() || "You",
      avatar: myProfile.avatar || "😀",
      score: 0,
      isHost: true,
      isOnline: true,
      lastActive: Date.now(),
    }),
    [myPlayerId, myProfile]
  );

  // Track victory in local stats
  useEffect(() => {
    if (activeRoom && (activeRoom.status === "round_over" || activeRoom.status === "game_over") && !isSpectator) {
      if (recordedRoundRef.current !== activeRoom.round && activeRoom.winnerId) {
        recordedRoundRef.current = activeRoom.round;
        const won = activeRoom.winnerId === myPlayerId;
        const draw = activeRoom.winnerId === "draw";

        setArcadeStats((prev) => {
          const next = {
            played: prev.played + 1,
            wins: won ? prev.wins + 1 : prev.wins,
            streak: won ? prev.streak + 1 : draw ? prev.streak : 0,
          };
          saveArcadeStats(next);
          return next;
        });
      }
    }
  }, [activeRoom?.status, activeRoom?.round, activeRoom?.winnerId, myPlayerId, isSpectator]);

  // Auto-join if ?room=XXXX in URL (checking if spectator mode)
  useEffect(() => {
    const queryRoom = searchParams.get("room");
    const spectateParam = searchParams.get("spectate") === "true";

    if (
      queryRoom &&
      queryRoom.toUpperCase() !== createdRoomCodeRef.current &&
      (!activeRoom || activeRoom.roomCode !== queryRoom.toUpperCase())
    ) {
      if (spectateParam) {
        handleJoinSpectate(queryRoom);
      } else {
        handleJoinByCode(queryRoom);
      }
    }
  }, [searchParams]);

  // Firebase room realtime listener
  useEffect(() => {
    if (!activeRoom || activeRoom.mode === "local" || activeRoom.mode === "ai") return;

    const unsub = subscribeToGameRoom(activeRoom.roomCode, (updated) => {
      if (updated) {
        setActiveRoom(updated);
        // If we were searching for quickmatch and an opponent connected, exit searching
        if (isSearchingQuickMatch && updated.players.guest) {
          setIsSearchingQuickMatch(false);
          gameAudio.playWin();
          toast.success("Opponent connected! Game starting...");
        }
      } else {
        toast.info("Room closed by host.");
        setActiveRoom(null);
        setIsSearchingQuickMatch(false);
        setIsSpectator(false);
        setSearchParams({});
      }
    });

    return () => unsub();
  }, [activeRoom?.roomCode, activeRoom?.mode, isSearchingQuickMatch]);

  const handleSelectMode = async (gameId: GameId, mode: GameMode, rules?: GameCustomRules) => {
    gameAudio.playClick();
    const gameMeta = GAMES_CATALOG.find((g) => g.id === gameId) || null;

    if (mode === "quickmatch") {
      setIsSearchingQuickMatch(true);
      setSearchingGameMeta(gameMeta);
      try {
        const result = await findOrJoinQuickMatch({
          gameId,
          player: myPlayerInfo,
        });

        createdRoomCodeRef.current = result.room.roomCode;
        setActiveRoom(result.room);

        if (result.isMatched) {
          setIsSearchingQuickMatch(false);
          gameAudio.playWin();
          toast.success("Found an online opponent! Match starting...");
        }
      } catch (err: any) {
        setIsSearchingQuickMatch(false);
        toast.error("Failed to enter matchmaking queue.");
      }
      return;
    }

    // Friend / AI / Local Modes
    try {
      const newRoom = await createGameRoom({
        gameId,
        mode,
        hostPlayer: myPlayerInfo,
        rules,
      });

      createdRoomCodeRef.current = newRoom.roomCode;
      setActiveRoom(newRoom);
      setIsSpectator(false);
      setDismissedVictoryRound(-1);

      if (mode === "friend") {
        setIsQRModalOpen(true);
        setSearchParams({ room: newRoom.roomCode });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize game room.");
    }
  };

  const handleCancelQuickMatch = async () => {
    if (activeRoom) {
      await cancelQuickMatchQueue(activeRoom.gameId, myPlayerId, activeRoom.roomCode);
    }
    setIsSearchingQuickMatch(false);
    setActiveRoom(null);
    setSearchingGameMeta(null);
  };

  const handleSwitchToAI = async () => {
    if (!searchingGameMeta) return;
    await handleCancelQuickMatch();
    await handleSelectMode(searchingGameMeta.id, "ai");
  };

  const handleJoinByCode = async (codeToJoin: string) => {
    const clean = codeToJoin.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a valid room code.");
      return;
    }

    try {
      const joined = await joinGameRoom({
        roomCode: clean,
        guestPlayer: {
          ...myPlayerInfo,
          isHost: false,
        },
      });

      if (joined) {
        createdRoomCodeRef.current = clean;
        setActiveRoom(joined);
        setIsSpectator(false);
        setDismissedVictoryRound(-1);
        setIsJoinModalOpen(false);
        setIsScannerOpen(false);
        setSearchParams({ room: clean });
        gameAudio.playWin();
        toast.success(`Connected to room ${clean}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to join game room.");
    }
  };

  const handleJoinSpectate = async (codeToSpectate: string) => {
    const clean = codeToSpectate.trim().toUpperCase();
    try {
      const specRoom = await joinAsSpectator(clean, {
        id: myPlayerId,
        name: myPlayerInfo.name,
        avatar: myPlayerInfo.avatar,
        joinedAt: Date.now(),
      });

      if (specRoom) {
        setActiveRoom(specRoom);
        setIsSpectator(true);
        setDismissedVictoryRound(-1);
        setIsJoinModalOpen(false);
        setIsScannerOpen(false);
        setSearchParams({ room: clean, spectate: "true" });
        toast.success(`Now spectating match in room ${clean}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not spectate this room.");
    }
  };

  const handleRematch = async () => {
    if (!activeRoom) return;
    gameAudio.playClick();
    setDismissedVictoryRound(-1);
    const freshGameState = createInitialGameState(activeRoom.gameId);
    const timerSec = activeRoom.rules?.turnTimerSeconds || 0;

    if (activeRoom.mode === "local" || activeRoom.mode === "ai") {
      setActiveRoom({
        ...activeRoom,
        gameState: freshGameState,
        status: "playing",
        winnerId: null,
        round: activeRoom.round + 1,
        turnExpiresAt: timerSec > 0 ? Date.now() + timerSec * 1000 : null,
      });
      return;
    }

    await resetGameRound(activeRoom.roomCode, activeRoom.gameId, activeRoom.round + 1, timerSec);
  };

  const handleTurnTimeout = useCallback(async () => {
    if (!activeRoom || activeRoom.status !== "playing" || isSpectator) return;
    const isMyTurn = activeRoom.currentTurn === myPlayerId;
    if (!isMyTurn) return;

    toast.info("Turn timed out! Turn passed to opponent.");
    gameAudio.playLose();

    const nextTurnId = activeRoom.currentTurn === activeRoom.players.host.id
      ? (activeRoom.players.guest?.id || (activeRoom.mode === "ai" ? "ai_opponent" : "local_player_2"))
      : activeRoom.players.host.id;

    const timerSec = activeRoom.rules?.turnTimerSeconds || 0;

    if (activeRoom.mode === "local" || activeRoom.mode === "ai") {
      setActiveRoom({
        ...activeRoom,
        currentTurn: nextTurnId,
        turnExpiresAt: timerSec > 0 ? Date.now() + timerSec * 1000 : null,
      });
      return;
    }

    await sendGameMove(
      activeRoom.roomCode,
      activeRoom.gameState,
      nextTurnId,
      null,
      false,
      undefined,
      undefined,
      timerSec,
      activeRoom.rules?.maxSeriesWins || 2
    );
  }, [activeRoom, isSpectator, myPlayerId]);

  const handleExitGame = useCallback(async () => {
    if (!activeRoom) return;
    const isHost = activeRoom.players.host.id === myPlayerId;

    if (isSpectator) {
      await leaveSpectator(activeRoom.roomCode, myPlayerId);
    } else if (activeRoom.mode !== "local" && activeRoom.mode !== "ai") {
      await leaveGameRoom(activeRoom.roomCode, isHost);
    }

    createdRoomCodeRef.current = null;
    setActiveRoom(null);
    setIsSpectator(false);
    setDismissedVictoryRound(-1);
    setIsSearchingQuickMatch(false);
    setSearchParams({});
    gameAudio.playClick();
  }, [activeRoom, myPlayerId, isSpectator, setSearchParams]);

  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter((g) => {
      const matchSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "All" || g.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  const activeGameMeta = useMemo(() => {
    return GAMES_CATALOG.find((g) => g.id === activeRoom?.gameId);
  }, [activeRoom?.gameId]);

  const isOpponentOffline = useMemo(() => {
    if (!activeRoom || activeRoom.mode === "ai" || activeRoom.mode === "local" || activeRoom.status === "waiting" || isSpectator) {
      return false;
    }
    const isHost = activeRoom.players.host.id === myPlayerId;
    const opponent = isHost ? activeRoom.players.guest : activeRoom.players.host;
    return opponent ? !opponent.isOnline : false;
  }, [activeRoom, myPlayerId, isSpectator]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased select-none">
      <Header onlineCount={onlineCount} />

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
        {/* VIEW 1: SEARCHING FOR QUICK MATCH RADAR */}
        {isSearchingQuickMatch ? (
          <QuickMatchSearchingOverlay
            game={searchingGameMeta}
            onCancel={handleCancelQuickMatch}
            onSwitchToAI={handleSwitchToAI}
          />
        ) : activeRoom ? (
          /* VIEW 2: ACTIVE GAME ARENA */
          <div className="flex flex-col items-center justify-center w-full max-w-2xl relative">
            <GameScoreboard
              room={activeRoom}
              myPlayerId={myPlayerId}
              gameTitle={activeGameMeta?.title || "Arcade Duel"}
              isSpectator={isSpectator}
              onExit={handleExitGame}
              onOpenQR={() => setIsQRModalOpen(true)}
              onTurnTimeout={handleTurnTimeout}
            />

            <ReconnectionBanner
              isOpponentOffline={isOpponentOffline}
              opponentName={
                activeRoom.players.host.id === myPlayerId
                  ? activeRoom.players.guest?.name || "Opponent"
                  : activeRoom.players.host.name
              }
              onForfeitClaim={() => {
                setActiveRoom({
                  ...activeRoom,
                  status: "game_over",
                  winnerId: myPlayerId,
                });
              }}
            />

            {/* Render Specific Game Board */}
            <div className="w-full flex items-center justify-center my-2">
              {activeRoom.gameId === "ttt" && (
                <TicTacToeGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "connect4" && (
                <ConnectFourGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "rps" && (
                <RPSClashGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "memory" && (
                <MemoryDuelGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
              {activeRoom.gameId === "reaction" && (
                <ReactionDashGame
                  room={activeRoom}
                  myPlayerId={myPlayerId}
                  isMyTurn={!isSpectator && activeRoom.currentTurn === myPlayerId}
                  onLocalMove={(updated) => setActiveRoom(updated)}
                />
              )}
            </div>

            {/* Live In-Game Floating Reactions & Quick Chat Drawer */}
            <GameLiveReactions
              roomCode={activeRoom.roomCode}
              myPlayerId={myPlayerId}
              myPlayerName={myPlayerInfo.name}
              isSpectator={isSpectator}
            />

            {/* QR Invite & Spectate Modal */}
            <QRShareModal
              isOpen={isQRModalOpen}
              onClose={() => setIsQRModalOpen(false)}
              roomCode={activeRoom.roomCode}
              gameTitle={activeGameMeta?.title || "Arcade Duel"}
              onScanJoin={handleJoinByCode}
            />

            {/* Victory / Next Round Modal */}
            <VictoryModal
              isOpen={
                (activeRoom.status === "round_over" || activeRoom.status === "game_over") &&
                dismissedVictoryRound !== activeRoom.round
              }
              room={activeRoom}
              myPlayerId={myPlayerId}
              onClose={() => setDismissedVictoryRound(activeRoom.round)}
              onRematch={handleRematch}
              onExitToLobby={handleExitGame}
            />
          </div>
        ) : (
          /* VIEW 3: GAMES LOBBY & ARCADE HUB */
          <div className="flex flex-col w-full">
            {/* Live Player Stats & Profile Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-lg mb-8">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl shadow-inner">
                  {myPlayerInfo.avatar}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-foreground">
                      {myPlayerInfo.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold">
                      Online
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Arcade Gamer Profile
                  </span>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm sm:text-base">
                    <Trophy className="w-4 h-4" />
                    <span>{arcadeStats.wins}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Wins
                  </span>
                </div>

                <div className="h-7 w-[1px] bg-border" />

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-orange-500 font-black text-sm sm:text-base">
                    <Flame className="w-4 h-4" />
                    <span>{arcadeStats.streak}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Streak
                  </span>
                </div>

                <div className="h-7 w-[1px] bg-border" />

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-primary font-black text-sm sm:text-base">
                    <Swords className="w-4 h-4" />
                    <span>{arcadeStats.played}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Matches
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    LiveTalk Arcade
                  </span>
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                    100% Free • No Signup
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  Play 1v1 Games with Anyone
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Challenge friends via instant QR code, watch matches live as a spectator, or test your wits against smart AI bots.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="rounded-2xl bg-card hover:bg-muted text-foreground border border-border text-xs font-bold gap-2 h-11 px-4 shadow-md"
                >
                  <QrCode className="w-4 h-4 text-primary" />
                  Join / Spectate
                </Button>

                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="rounded-2xl bg-primary text-primary-foreground text-xs font-bold gap-2 h-11 px-4 shadow-lg shadow-primary/25 hover:opacity-90"
                >
                  <ScanLine className="w-4 h-4" />
                  Scan QR Code
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {["All", "Classic", "Strategy", "Reflex", "Casual"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search arcade games..."
                  className="pl-9 h-9 rounded-xl bg-card border-border text-xs focus-visible:ring-primary/30"
                />
              </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpenModeSelect={(g) => setSelectedGameForModal(g)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Game Mode Selection Modal */}
      <GameModeModal
        isOpen={!!selectedGameForModal}
        onClose={() => setSelectedGameForModal(null)}
        game={selectedGameForModal}
        onSelectMode={handleSelectMode}
      />

      {/* Manual Join / Spectate Room Dialog */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="max-w-sm p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Join or Spectate Room
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your friend's 6-character room code to duel or watch live.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 my-3">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7X4P9"
              maxLength={8}
              className="h-12 rounded-xl text-center text-xl font-black tracking-widest uppercase bg-muted border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJoinByCode(manualCode);
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleJoinByCode(manualCode)}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 gap-1.5"
              >
                <Swords className="w-3.5 h-3.5" />
                Join to Play
              </Button>

              <Button
                variant="outline"
                onClick={() => handleJoinSpectate(manualCode)}
                className="h-11 rounded-xl border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-bold text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Spectate Live
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera QR Scanner Integration */}
      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedText) => {
          setIsScannerOpen(false);
          const isSpectateLink = scannedText.includes("spectate=true");
          const urlMatch = scannedText.match(/[?&]room=([A-Za-z0-9]+)/);
          const codeToJoin = urlMatch ? urlMatch[1] : scannedText.trim();

          if (isSpectateLink) {
            handleJoinSpectate(codeToJoin);
          } else {
            handleJoinByCode(codeToJoin);
          }
        }}
      />
    </div>
  );
}
