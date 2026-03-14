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

  const findMatch = useCallback(async () => {
    if (matchedGuardRef.current || status !== "searching") return;

    const lobbyRef = ref(db, "lobby");
    
    onValue(lobbyRef, (snapshot) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      
      const users = snapshot.val();
      const waitingIds = Object.keys(users).filter(id => {
        const isMe = id === sessionId;
        const sameCode = (users[id]?.code || null) === searchCodeRef.current;
        return !isMe && sameCode;
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

        // Sort by number of shared interests (highest first)
        candidates.sort((a, b) => b.score - a.score);
        
        // If multiple candidates have same score, we still get the best one
        matchedUserId = candidates[0].id;
        shared = candidates[0].shared;
      }

      const pair = [sessionId, matchedUserId].sort();
      const matchId = searchCodeRef.current ? `private_${searchCodeRef.current}` : `match_${pair[0]}_${pair[1]}`;
      const matchRef = ref(db, `matches/${matchId}`);

      if (pair[0] === sessionId) {
        runTransaction(matchRef, (currentData) => {
          if (currentData === null) {
            return {
              user1: pair[0],
              user2: pair[1],
              stable1: pair[0] === sessionId ? stableId : users[matchedUserId].stableId,
              stable2: pair[1] === sessionId ? stableId : users[matchedUserId].stableId,
              name1: pair[0] === sessionId ? userName : users[matchedUserId].userName || "Stranger",
              name2: pair[1] === sessionId ? userName : users[matchedUserId].userName || "Stranger",
              sharedInterests: shared,
              roomId: matchId,
              createdAt: serverTimestamp()
            };
          }
          return; // Abort if already exists
        }).then((result) => {
          if (result.committed) {
             // Track match successfully
             import("@/hooks/use-analytics").then(({ trackMatch }) => trackMatch());
          }
        }).catch(err => {
          console.error("[Matchmaking] Transaction failed:", err);
        });
      }
    }, (error) => {
      console.error("[Matchmaking] Lobby Sync Error:", error);
    });
  }, [sessionId, stableId, interests, status]);

  const startSearch = useCallback((code: string | null = null) => {
    matchedGuardRef.current = false;
    searchCodeRef.current = code;
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
    if (status !== "searching") return;

    const matchesRef = ref(db, "matches");
    const handleMatch = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      
      const allMatches = snapshot.val();
      for (const mId in allMatches) {
        const match = allMatches[mId];
        if (match.user1 === sessionId || match.user2 === sessionId) {
          matchedGuardRef.current = true;
          const strangerId = match.user1 === sessionId ? match.user2 : match.user1;
          const strangerStableId = match.user1 === sessionId ? match.stable2 : match.stable1;
          const strangerName = match.user1 === sessionId ? match.name2 : match.name1;
          
          // Each user only removes their own lobby entry
          remove(ref(db, `lobby/${sessionId}`)).catch(() => {});
          
          // DELAY cleanup of the match signal to prevent race conditions
          // This ensures the second user has time to see the snapshot before it's gone
          const matchRef = ref(db, `matches/${mId}`);
          setTimeout(() => {
            remove(matchRef).catch(() => {});
          }, 3000); 
          
          onMatched(match.roomId, strangerId, strangerStableId, strangerName || "Stranger", match.sharedInterests || []);
          setStatus("idle");
          break;
        }
      }
    };

    onValue(matchesRef, handleMatch, (error) => {
      console.error("[Matchmaking] Matches Sync Error:", error);
    });
    return () => off(matchesRef, "value", handleMatch);
  }, [status, sessionId, onMatched]);

  useEffect(() => {
    if (status === "searching") {
      findMatch();
    }
  }, [status, findMatch]);

  return { status, startSearch, stopSearch };
}
