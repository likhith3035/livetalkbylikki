# IncogTalk Arcade Games — Comprehensive Bug, Glitch & Architecture Audit

**Audit Date:** September 2026  
**Audited Systems:** All 8 Arcade Games (`ttt`, `connect4`, `rps`, `memory`, `reaction`, `sos`, `bingo`, `cricket`), Game Room Services, Audio Synthesizer, Victory Modal, WebRTC Voice Chat, and Progression System.

---

## Executive Summary

A comprehensive code and logic audit was conducted across the 8 arcade duel games in the IncogTalk platform. While the games feature rich visual effects, synthesized audio, AI personas, and local/online modes, the audit revealed **18 distinct bugs, glitches, and architectural vulnerabilities**, ranging from **Critical** game-breaking sync issues to **Major** exploits and **Moderate** audio/UI glitches.

---

## 1. Critical & High Severity Issues (Game-Breaking & Exploits)

### 🔴 Critical 1: Bingo Card Mid-Game Re-scramble (Online Multiplayer)
- **File:** [`BingoGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/BingoGame.tsx#L269-L280) & [`gameRoomService.ts`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/services/gameRoomService.ts#L137-L149)
- **Symptom:** In online multiplayer Bingo, Guest's card numbers completely scramble and change positions after Host calls the first number.
- **Root Cause:** In `gameRoomService.ts`, when a room is created, `hostCard` and `guestCard` are generated for the host, but in `BingoGame.tsx`:
  ```typescript
  const hostCard: number[][] = useMemo(() => {
    if (rawState?.hostCard && Array.isArray(rawState.hostCard) && rawState.hostCard.length === 5) {
      return rawState.hostCard;
    }
    return generateRandomBingoCard();
  }, [rawState?.hostCard]);
  ```
  If `guestCard` is not already synchronized or if guest mounts before room state updates, guest creates their own local card. When Host calls the first number, Host's version of `guestCard` is written to Firebase. Guest's client receives the update and replaces guest's card with Host's card, shuffling all the numbers Guest was looking at.

---

### 🔴 Critical 2: Hand Cricket & Bingo AI Player ID Mismatches
- **Files:**
  - [`HandCricketGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/HandCricketGame.tsx#L247-L265) (lines 247, 257, 264, 296, 412, 636)
  - [`BingoGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/BingoGame.tsx#L394)
  - [`SOSGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/SOSGame.tsx#L667)
- **Symptom:** In AI Mode, AI wins are never credited to the AI's scoreboard score or series score in Hand Cricket and Bingo.
- **Root Cause:** In `gameRoomService.ts:239`, AI player ID is defined as `"ai_opponent"`. However:
  - In `HandCricketGame.tsx`, the AI is assigned `"ai_player"`. When checking who won at line 636:
    ```typescript
    score: winnerId === room.players.guest.id ? room.players.guest.score + 1 : room.players.guest.score
    ```
    This compares `"ai_player" === "ai_opponent"`, which evaluates to `false`. The AI never gets points.
  - In `BingoGame.tsx:394`, AI wins fall back to `"ai_bot"` instead of `"ai_opponent"`.
  - In `SOSGame.tsx:667`, fallback is `"ai_bot"` instead of `"ai_opponent"`.

---

### 🔴 Critical 3: Clear-Text Secret Picks in Simultaneous Games (RPS & Hand Cricket)
- **Files:**
  - [`RPSClashGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/RPSClashGame.tsx#L206-L219)
  - [`HandCricketGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/HandCricketGame.tsx#L728-L745)
- **Symptom:** Opponents can cheat by reading the other player's pick in real-time before making their own move.
- **Root Cause:** Both Rock-Paper-Scissors and Hand Cricket require simultaneous secret moves. When Player 1 picks, their choice is written in plain text to the public Firebase Realtime Database path (`room.gameState.hostChoice` or `currentDelivery.hostPick`). Anyone inspecting DevTools or websocket frames can read the exact move and choose the counter-pick every single turn.

---

### 🔴 Critical 4: SOS EMP Bomb Permanent Grid & Line Corruption
- **File:** [`SOSGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/SOSGame.tsx#L530-L583)
- **Symptom:** Using the EMP Bomb clears the 3x3 cells but leaves glowing laser lines floating in mid-air over empty spaces, and those lines can never be scored again.
- **Root Cause:** When Bomb detonates, `newBoard` clears the letters, but `lines` is preserved unchanged (`lines: lines`). The laser SVG continues rendering across the empty tiles. Furthermore, `detectSOSAtMove` checks canonical keys against `existingKeys` (`lines.map(...)`), so if players spell S-O-S in the cleared cells again, the engine detects that the line already exists in `lines` and refuses to award points or extra turns!

---

### 🔴 Critical 5: Memory Duel Multiplayer Mismatch Lock
- **File:** [`MemoryDuelGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/MemoryDuelGame.tsx#L220-L281)
- **Symptom:** In online multiplayer, if Player 1 experiences network packet drop or closes their browser tab during the 800ms mismatch reveal, the game freezes permanently with two cards flipped.
- **Root Cause:** When two cards don't match, Player 1 sends the flipped cards to Firebase and sets a local client-side `setTimeout(800ms)` to unflip them and pass the turn. Player 2 has no timer and cannot click because `flippedCardIds.length === 2`. The unflip depends entirely on Player 1's local client staying alive and sending a second Firebase update.

---

## 2. Major Exploits & Gameplay Glitches

### 🟠 Major 6: Infinite Power-Up Spam (SOS Bomb/2X & Bingo Wild Stamp)
- **Files:**
  - [`SOSGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/SOSGame.tsx#L983-L1040)
  - [`BingoGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/BingoGame.tsx#L815-L831)
- **Symptom:** Players can spam bombs or wild stamps infinitely in online matches and win in 5 seconds.
- **Root Cause:** There is no charge, cooldown, counter, or room rule limiting power-up usage. In Bingo, "Wild Stamp" sets `isWildExtra = true`, which keeps the turn with the caller. A player can click Wild Stamp, stamp a number, and repeat 25 times on their first turn to instantly win. In SOS, a player can detonate EMP bombs every turn.

---

### 🟠 Major 7: Universal Double Sound Fanfare Across All 8 Games
- **Files:**
  - All 8 game components (`TicTacToeGame.tsx`, `ConnectFourGame.tsx`, `RPSClashGame.tsx`, `MemoryDuelGame.tsx`, `ReactionDashGame.tsx`, `SOSGame.tsx`, `BingoGame.tsx`, `HandCricketGame.tsx`)
  - [`VictoryModal.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/VictoryModal.tsx#L81-L98)
- **Symptom:** Players hear overlapping, jarring double victory/defeat sound effects when any match finishes.
- **Root Cause:** Every individual game component calls `gameAudio.playWin()`, `playLose()`, or `playDraw()` in its own move handler when game over is detected. Simultaneously, `GamesPage.tsx` sees `room.status === "round_over"` and mounts `VictoryModal.tsx`. `VictoryModal` contains an independent `useEffect` that fires on mount and calls `gameAudio.playWin()` / `gameAudio.playLose()` / `gameAudio.playDraw()` a second time!

---

### 🟠 Major 8: Connect 4 Double Drop Sound in Online Multiplayer
- **File:** [`ConnectFourGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/ConnectFourGame.tsx#L561-L575) & [`ConnectFourGame.tsx:697`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/ConnectFourGame.tsx#L697)
- **Symptom:** Every time you drop a chip in an online match, the drop sound plays twice.
- **Root Cause:** When you click a column, `handleDropChip` plays `gameAudio.playConnect4Drop(row)` immediately. Then `sendGameMove` sends the move to Firebase. When the updated room returns from Firebase, the `useEffect` listening to `[board]` compares `prevBoardRef.current` with `board`, detects the new chip, and plays `gameAudio.playConnect4Drop(row)` again.

---

### 🟠 Major 9: Series Championship Celebration Shown to the Loser
- **File:** [`VictoryModal.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/VictoryModal.tsx#L75-L79), [`L177-L195`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/VictoryModal.tsx#L177-L195)
- **Symptom:** When a player loses a series championship, their screen displays a golden bouncing crown and explodes with celebratory confetti.
- **Root Cause:** In `VictoryModal.tsx`:
  ```typescript
  if (isOpen && (isWinner || isSeriesOver || (isLocal && !isDraw))) {
    triggerConfetti({ particleCount: isSeriesOver ? 120 : 70 });
  }
  ```
  Because `isSeriesOver` is checked without checking `isWinner`, the losing player triggers the 120-particle confetti burst. Additionally, the icon renders `<Crown className="animate-bounce" />` whenever `isSeriesOver` is true, regardless of who won the series.

---

### 🟠 Major 10: Local Pass-and-Play Wipes Online Ranked Win Streaks
- **File:** [`GamesPage.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/pages/GamesPage.tsx#L282-L315) & [`gameProgressionService.ts`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/services/gameProgressionService.ts#L190)
- **Symptom:** Playing a casual 2-player local pass-and-play game with a friend on your phone wipes your global online win streak back to 0 if Player 2 wins.
- **Root Cause:** `GamesPage.tsx` awards XP and updates streaks for all game completions including `activeRoom.mode === "local"`. If Player 2 wins, `won = activeRoom.winnerId === myPlayerId` is `false`, which treats the local match as a defeat for the device owner and resets `current.streak = 0`. Conversely, a player can farm 50-game win streaks and level up to Grandmaster by repeatedly beating Player 2 in local mode.

---

## 3. Moderate & Subtle UI/UX Glitches

### 🟡 Moderate 11: RPS Reveal Stage Cut Short by VictoryModal
- **Files:** [`RPSClashGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/RPSClashGame.tsx#L225-L256) & [`GamesPage.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/pages/GamesPage.tsx#L937-L947)
- **Symptom:** Players never get to see the dramatic animated Rock vs Scissors confrontation card.
- **Root Cause:** When the second player picks, `sendGameMove` immediately sets `winnerId` and `status: "round_over"`. `GamesPage.tsx` immediately mounts `VictoryModal` as a full modal dialog on top of the game screen, blocking the reveal stage instantly.

---

### 🟡 Moderate 12: Hand Cricket Host Misses Clash Animation
- **File:** [`HandCricketGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/HandCricketGame.tsx#L442-L491)
- **Symptom:** In online Hand Cricket, the player who picked first never sees the "💥 Clash" stage; their screen jumps straight from waiting to the delivery result.
- **Root Cause:** `isClashing` is purely local React component state (`useState(false)`). Only the second picker calls `handleDeliveryResolution` (which sets `isClashing = true` for 1200ms). The first picker receives the final resolved delivery directly from Firebase without ever setting `isClashing = true`.

---

### 🟡 Moderate 13: Reaction Dash False Start Plays Contradictory Sounds in Local Mode
- **File:** [`ReactionDashGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/ReactionDashGame.tsx#L156) & [`VictoryModal.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/VictoryModal.tsx#L91-L94)
- **Symptom:** When a player false-starts in 2-player local mode, `playLose()` plays, followed immediately by `playWin()` from VictoryModal, creating overlapping cacophony.
- **Root Cause:** `handlePadTap` triggers `gameAudio.playLose()` on false start. Then `VictoryModal` checks `if (isWinner || isLocal)` and triggers `gameAudio.playWin()` because `isLocal` is true.

---

### 🟡 Moderate 14: Spacebar Push-To-Talk Hijacks Keyboard Scrolling & Dino Game
- **File:** [`GameVoiceChat.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/GameVoiceChat.tsx#L79-L98)
- **Symptom:** When voice chat is connected, pressing Spacebar activates the microphone and prevents page scrolling or jumping in the Chrome Dino mini-game.
- **Root Cause:** The window keydown listener listens for `e.code === "Space"` and unconditionally calls `e.preventDefault()`.

---

### 🟡 Moderate 15: Connect 4 Outer Loop Break Bug
- **File:** [`ConnectFourGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/ConnectFourGame.tsx#L564-L572)
- **Symptom:** In rare re-renders, the drop sound can trigger multiple times if multiple board diffs are processed.
- **Root Cause:**
  ```typescript
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!prev[r][c] && board[r][c]) {
        ...
        break; // Only breaks inner loop (c), continues outer loop (r)
      }
    }
  }
  ```

---

### 🟡 Moderate 16: RPS Local Mode Always Plays Win Sound
- **File:** [`RPSClashGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/RPSClashGame.tsx#L114-L115)
- **Symptom:** In local mode RPS, regardless of who won the round, `gameAudio.playWin()` is always called.
- **Root Cause:** Line 115 executes `else gameAudio.playWin()` whenever `winnerId !== "draw"`.

---

### 🟡 Moderate 17: TicTacToe Local Mode Always Plays Win Sound
- **File:** [`TicTacToeGame.tsx`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/components/games/TicTacToeGame.tsx#L137-L141)
- **Symptom:** In local mode TicTacToe, `gameAudio.playWin()` always plays even if Player 2 won from Player 1's perspective.
- **Root Cause:** Line 137 checks `if (winnerPlayerId === myPlayerId || room.mode === "local") gameAudio.playWin()`.

---

### 🟡 Moderate 18: Series Winner ID String Mismatch
- **File:** [`gameRoomService.ts`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/services/gameRoomService.ts#L684) & [`types.ts`](file:///c:/Users/kamil/OneDrive/Desktop/ohmegle/src/features/games/types.ts#L101)
- **Symptom:** `seriesWinnerId` is stored as literal `"host"` or `"guest"` strings instead of the actual player IDs (`room.players.host.id` or `room.players.guest.id`).
- **Root Cause:** In `sendGameMove`:
  `updates.seriesWinnerId = (updatedHostScore || 0) >= maxSeriesWins ? "host" : "guest";`
  This breaks any component that compares `room.seriesWinnerId === myPlayerId`.

---

## 4. Summary Matrix by Game

| Game | Critical Bugs | Gameplay Glitches | Audio Overlaps | Multiplayer Sync Issues |
|---|:---:|:---:|:---:|:---:|
| **Tic-Tac-Toe** | — | — | Double win fanfare | Non-clicker delayed audio |
| **Connect 4** | — | Outer loop break bug | Double drop & win sounds | — |
| **RPS Clash** | Clear-text secret picks | Reveal stage hidden by modal | Local mode always plays win | Online mode lacks round audio |
| **Memory Duel** | Mismatch disconnect lock | AI clicking during turn | Double win/lose fanfare | Client-side 800ms timer dep. |
| **Reaction Dash** | — | — | Host/Guest double sound; False start cacophony | Clock drift affects reaction ms |
| **Super SOS** | EMP Bomb corrupts lines | Infinite Bomb/2X spam | — | `"ai_bot"` ID mismatch |
| **Bingo Blitz** | Card re-scrambles mid-game | Infinite Wild Stamp spam | — | `"ai_bot"` ID mismatch |
| **Hand Cricket** | AI player ID `"ai_player"` breaks scoring | Clear-text delivery picks | Host misses clash animation | Opponent pick visible in DB |

---

## 5. Recommended Remediation Plan

1. **Fix Player ID Consistency**: Standardize AI opponent ID to `"ai_opponent"` and local player 2 to `"local_player_2"` across `HandCricketGame`, `BingoGame`, and `SOSGame`.
2. **Fix Bingo Card Generation**: Ensure host-generated cards are committed before gameplay begins, and never overwrite guest cards mid-game.
3. **Resolve Universal Double Audio**: Centralize match-end audio in `VictoryModal` and remove redundant `playWin()` / `playLose()` calls from individual move handlers, or vice versa with an audio guard.
4. **Fix Connect 4 Double Drop Audio**: Guard `playConnect4Drop` so it only plays once per move (distinguishing local user action from remote Firebase listener).
5. **Protect Secret Moves in RPS & Hand Cricket**: Do not store plaintext moves of Player 1 in the public room before Player 2 commits. Store a hash or commit-reveal flag, or mask picks until both are set.
6. **Limit Power-Ups**: Add per-game usage quotas (e.g. 1 EMP Bomb, 1 Wild Stamp per match) and clean up destroyed lines when bombs detonate in SOS.
7. **Fix VictoryModal Celebration for Loser**: Ensure confetti and golden crowns only render when `isWinner` is true or in local mode.
8. **Isolate Local Mode from Ranked Progression**: Only update global gamer XP and win streaks for online multiplayer (`friend` or `quickmatch`) or AI matches, preventing local pass-and-play from resetting or farming win streaks.
9. **Fix Memory Duel Mismatch Timer**: Handle unflip transitions gracefully without leaving the room in a permanently stuck state if the caller disconnects.
10. **Delay VictoryModal in RPS & Hand Cricket**: Add a 1.5s delay before opening `VictoryModal` so players can see the reveal and clash animations.
