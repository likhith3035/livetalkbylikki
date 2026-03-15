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
  const pendingMatchIdRef = useRef<string | null>(null);

  const findMatch = useCallback(async () => {
    if (matchedGuardRef.current || status !== "searching") return;

    const lobbyRef = ref(db, "lobby");
    
    // Step 1: Find a candidate in the lobby
    onValue(lobbyRef, (snapshot) => {
      if (!snapshot.exists() || matchedGuardRef.current || status !== "searching") return;
      
      const users = snapshot.val();
      const waitingIds = Object.keys(users).filter(id => {
        const isMe = id === sessionId;
        // Allow same stableId ONLY if searching with a private room code (for testing)
        const sameStableId = users[id]?.stableId === stableId;
        const sameCode = (users[id]?.code || null) === searchCodeRef.current;
        
        if (searchCodeRef.current) {
          return !isMe && sameCode; // Private room: connect anyone with same code
        }
        return !isMe && !sameStableId && sameCode; // Public room: strict no-self-match
      });
      
      if (waitingIds.length === 0) return;

      let matchedUserId = waitingIds[0];
      let shared: string[] = [];

      // PRIORITY MATCHING: If searching globally, find the user with the MOST shared interests
      if (!searchCodeRef.current) {
        const candidates = waitingIds.map(uid => {
          const theirInterests = users[uid].interests || [];
          const sharedInterests = interests.filter(i => 
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
      const matchRef = ref(db, `matches/${matchId}`);

      // Step 2: Only the 'lead' user (alphabetically first) initiates the match record
      if (pair[0] === sessionId) {
        runTransaction(matchRef, (currentData) => {
          if (currentData === null) {
            return {
              user1: pair[0],
              user2: pair[1],
              stable1: amIUser1InRaw(pair, sessionId) ? stableId : users[matchedUserId].stableId,
              stable2: !amIUser1InRaw(pair, sessionId) ? stableId : users[matchedUserId].stableId,
              name1: amIUser1InRaw(pair, sessionId) ? userName : users[matchedUserId].userName || "Stranger",
              name2: !amIUser1InRaw(pair, sessionId) ? userName : users[matchedUserId].userName || "Stranger",
              sharedInterests: shared,
              roomId: matchId,
              createdAt: Date.now(), // FIX: serverTimestamp() is NOT allowed in transactions
              ready1: false,
              ready2: false
            };
          }
          return; // Abort if already exists
        }).catch((error) => {
          console.error("[Matchmaking] Transaction error:", error);
        });
      }
    }, (error) => {
      console.error("[Matchmaking] Lobby Sync Error:", error);
    });
  }, [sessionId, stableId, interests, status, userName]);

  // Helper for transaction logic
  const amIUser1InRaw = (pair: string[], myId: string) => pair[0] === myId;

  // Step 3: Listen for match signals and perform handshake
  useEffect(() => {
    if (status !== "searching") return;

    const matchesRef = ref(db, "matches");
    const handleMatches = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      
      const allMatches = snapshot.val();
      for (const mId in allMatches) {
        const match = allMatches[mId];
        
        // If I am part of this match
        if (match.user1 === sessionId || match.user2 === sessionId) {
          const amIUser1 = match.user1 === sessionId;
          const myReadyKey = amIUser1 ? "ready1" : "ready2";
          const theirReadyKey = amIUser1 ? "ready2" : "ready1";

          // If we are both ready, FINALIZE
          if (match.ready1 && match.ready2) {
            if (matchedGuardRef.current) return;
            matchedGuardRef.current = true;
            pendingMatchIdRef.current = mId;
            
            const strangerId = amIUser1 ? match.user2 : match.user1;
            const strangerStableId = amIUser1 ? match.stable2 : match.stable1;
            const strangerName = amIUser1 ? match.name2 : match.name1;
            
            // Clean up my lobby entry
            remove(ref(db, `lobby/${sessionId}`)).catch(() => {});
            
            // Cleanup match signal after a delay to ensure both saw it
            setTimeout(() => {
              if (pendingMatchIdRef.current === mId) {
                remove(ref(db, `matches/${mId}`)).catch(() => {});
              }
            }, 5000);

            setStatus("idle");
            onMatched(match.roomId, strangerId, strangerStableId, strangerName || "Stranger", match.sharedInterests || []);
            return;
          }

          // If I haven't marked myself as ready yet, do it now (The Handshake)
          if (!match[myReadyKey]) {
            const mRef = ref(db, `matches/${mId}/${myReadyKey}`);
            set(mRef, true).catch(err => console.error("[Matchmaking] Handshake set failed:", err));
            
            // Timeout if they don't respond to handshake (resilience)
            setTimeout(() => {
               if (status === "searching" && !matchedGuardRef.current) {
                 console.log("[Matchmaking] Handshake timeout, cleaning up...");
                 remove(ref(db, `matches/${mId}`)).catch(() => {});
               }
            }, 10000);
          }
        }
      }
    };

    onValue(matchesRef, handleMatches);
    return () => off(matchesRef, "value", handleMatches);
  }, [status, sessionId, onMatched]);

  const startSearch = useCallback((code: string | null = null) => {
    matchedGuardRef.current = false;
    searchCodeRef.current = code;
    pendingMatchIdRef.current = null;
    setStatus("searching");
    
    const myLobbyRef = ref(db, `lobby/${sessionId}`);
    set(myLobbyRef, {
      interests,
      stableId,
      userName,
      code,
      joinedAt: serverTimestamp()
    }).catch(err => {
      console.error("[Matchmaking] Failed to join lobby:", err);
    });
    onDisconnect(myLobbyRef).remove();
  }, [sessionId, stableId, interests, userName]);

  const stopSearch = useCallback(() => {
    setStatus("idle");
    const myLobbyRef = ref(db, `lobby/${sessionId}`);
    remove(myLobbyRef).catch(err => {
      console.error("[Matchmaking] Failed to stop search:", err);
    });
  }, [sessionId]);

  useEffect(() => {
    if (status === "searching") {
      findMatch();
    }
  }, [status, findMatch]);

  return { status, startSearch, stopSearch };
}
