import { useState, useRef, useCallback, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect, serverTimestamp, runTransaction, off, remove } from "firebase/database";

interface MatchmakingOptions {
  sessionId: string;
  stableId: string;
  userName: string;
  interests: string[];
  onMatched: (roomId: string, strangerId: string, strangerStableId: string, strangerName: string, sharedInterests: string[]) => void;
}

export function useFirebaseMatchmaking({ sessionId, stableId, userName, interests, onMatched }: MatchmakingOptions) {
  const [status, setStatus] = useState<"idle" | "searching">("idle");
  const matchedGuardRef = useRef(false);
  const searchCodeRef = useRef<string | null>(null);
  const activeMatchIdRef = useRef<string | null>(null);

  const findMatch = useCallback(async () => {
    if (matchedGuardRef.current || status !== "searching") return;

    const lobbyRef = ref(db, "lobby");
    
    // Step 1: Find a candidate in the lobby
    onValue(lobbyRef, (snapshot) => {
      if (!snapshot.exists() || matchedGuardRef.current || status !== "searching") return;
      
      const users = snapshot.val();
      const waitingIds = Object.keys(users).filter(id => {
        const isMe = id === sessionId;
        const theirData = users[id];
        if (!theirData || theirData.signal) return false; // Skip if they are already being matched

        const sameStableId = theirData.stableId === stableId;
        const sameCode = (theirData.code || null) === (searchCodeRef.current || null);
        
        if (searchCodeRef.current) {
          return !isMe && sameCode; // Private: allow same device
        }
        return !isMe && !sameStableId && sameCode; // Public: strict no-self-match
      });
      
      if (waitingIds.length === 0) return;

      // Priority Matching
      let matchedUserId = waitingIds[0];
      let shared: string[] = [];
      if (!searchCodeRef.current) {
        const candidates = waitingIds.map(uid => {
          const theirInterests = users[uid].interests || [];
          const sharedInterests = (interests || []).filter(i => 
            theirInterests.some((ti: string) => ti.toLowerCase().trim() === i.toLowerCase().trim())
          );
          return { id: uid, shared: sharedInterests, score: sharedInterests.length };
        });
        candidates.sort((a, b) => b.score - a.score);
        matchedUserId = candidates[0].id;
        shared = candidates[0].shared;
      }

      const pair = [sessionId, matchedUserId].sort();
      const matchId = searchCodeRef.current ? `private_${searchCodeRef.current}` : `match_${pair[0]}_${pair[1]}`;
      
      // Step 2: Signal the other user
      if (pair[0] === sessionId) {
        const signalRef = ref(db, `lobby/${matchedUserId}/signal`);
        runTransaction(signalRef, (currentSignal) => {
          if (currentSignal === null) {
            return { 
              matchId, 
              from: sessionId, 
              name: userName || "Stranger", 
              stableId: stableId || sessionId,
              sharedInterests: shared || [] 
            };
          }
          return; // Already signaled
        }).then((result) => {
          if (result.committed) {
             console.log("[Matchmaking V2] Signal sent to", matchedUserId);
             initiateMatchRecord(matchId, matchedUserId, shared, users[matchedUserId]);
          }
        }).catch(err => console.error("[Matchmaking V2] Signaling failed:", err));
      }
    }, (error) => {
      console.error("[Matchmaking V2] Lobby Sync Error:", error);
    });
  }, [sessionId, stableId, interests, status, userName]);

  const initiateMatchRecord = (matchId: string, strangerId: string, shared: string[], strangerData: any) => {
    const matchRef = ref(db, `matches/${matchId}`);
    runTransaction(matchRef, (currentData) => {
      if (currentData === null) {
        return {
          user1: sessionId,
          user2: strangerId,
          stable1: stableId || sessionId,
          stable2: strangerData?.stableId || strangerId,
          name1: userName || "You",
          name2: strangerData?.userName || "Stranger",
          sharedInterests: shared || [],
          roomId: matchId,
          createdAt: Date.now(),
          ready1: false,
          ready2: false
        };
      }
      return;
    }).catch(err => console.error("[Matchmaking V2] Match creation failed:", err));
  };

  // Step 3: Listen for signals and matches
  useEffect(() => {
    if (status !== "searching") return;

    // Listen for signals sent TO ME
    const mySignalRef = ref(db, `lobby/${sessionId}/signal`);
    const handleSignal = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      const signal = snapshot.val();
      activeMatchIdRef.current = signal.matchId;
      console.log("[Matchmaking V2] Received signal for match", signal.matchId);
    };
    onValue(mySignalRef, handleSignal);

    // Listen for match state updates
    const matchesRef = ref(db, "matches");
    const handleMatches = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      const allMatches = snapshot.val();
      
      for (const mId in allMatches) {
        const match = allMatches[mId];
        if (!match) continue;

        if (match.user1 === sessionId || match.user2 === sessionId) {
          const amIUser1 = match.user1 === sessionId;
          const myReadyKey = amIUser1 ? "ready1" : "ready2";
          
          if (match.ready1 && match.ready2) {
            finalizeMatch(mId, match);
            return;
          }

          if (!match[myReadyKey]) {
            set(ref(db, `matches/${mId}/${myReadyKey}`), true)
              .catch(err => console.error("[Matchmaking V2] Handshake error:", err));
            
            setTimeout(() => {
               if (status === "searching" && !matchedGuardRef.current) {
                 remove(ref(db, `matches/${mId}`)).catch(() => {});
               }
            }, 10000);
          }
        }
      }
    };
    onValue(matchesRef, handleMatches);

    return () => {
      off(mySignalRef, "value", handleSignal);
      off(matchesRef, "value", handleMatches);
    };
  }, [status, sessionId, onMatched]);

  const finalizeMatch = (mId: string, match: any) => {
    if (matchedGuardRef.current) return;
    matchedGuardRef.current = true;
    
    const amIUser1 = match.user1 === sessionId;
    const strangerId = amIUser1 ? match.user2 : match.user1;
    const strangerStableId = amIUser1 ? match.stable2 : match.stable1;
    const strangerName = amIUser1 ? match.name2 : match.name1;

    remove(ref(db, `lobby/${sessionId}`)).catch(() => {});
    setTimeout(() => remove(ref(db, `matches/${mId}`)).catch(() => {}), 5000);

    setStatus("idle");
    onMatched(match.roomId || mId, strangerId, strangerStableId, strangerName, match.sharedInterests || []);
  };

  const startSearch = useCallback((code: string | null = null) => {
    matchedGuardRef.current = false;
    searchCodeRef.current = code ? code.trim().toUpperCase() : null;
    setStatus("searching");
    
    const myLobbyRef = ref(db, `lobby/${sessionId}`);
    set(myLobbyRef, {
      interests: interests || [],
      stableId: stableId || sessionId,
      userName: userName || "",
      code: searchCodeRef.current,
      joinedAt: serverTimestamp(),
      signal: null
    }).catch(err => console.error("[Matchmaking V2] Join failed:", err));
    onDisconnect(myLobbyRef).remove();
  }, [sessionId, stableId, interests, userName]);

  const stopSearch = useCallback(() => {
    setStatus("idle");
    remove(ref(db, `lobby/${sessionId}`)).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (status === "searching") findMatch();
  }, [status, findMatch]);

  return { status, startSearch, stopSearch };
}
