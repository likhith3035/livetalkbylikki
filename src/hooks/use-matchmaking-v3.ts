import { useState, useRef, useCallback, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect, serverTimestamp, runTransaction, off, remove, get } from "firebase/database";

interface MatchmakingOptions {
  sessionId: string;
  stableId: string;
  userName: string;
  interests: string[];
  onMatched: (roomId: string, strangerId: string, strangerStableId: string, strangerName: string, sharedInterests: string[]) => void;
}

export function useFirebaseMatchmakingV3({ sessionId, stableId, userName, interests, onMatched }: MatchmakingOptions) {
  const [status, setStatus] = useState<"idle" | "searching">("idle");
  const matchedGuardRef = useRef(false);
  const searchCodeRef = useRef<string | null>(null);
  const activeMatchIdRef = useRef<string | null>(null);
  
  // LOG VERSION AT TOP
  useEffect(() => {
    if (status === "searching") {
      console.warn("[V4_ACTIVE] Matchmaking V4.0 Started. Session:", sessionId);
    }
  }, [status, sessionId]);

  const findMatch = useCallback(async () => {
    if (matchedGuardRef.current || status !== "searching") return;

    const lobbyRef = ref(db, "lobby");
    
    // We use a one-time fetch to avoid loops, findMatch will re-run if needed
    get(lobbyRef).then((snapshot) => {
      if (!snapshot.exists() || matchedGuardRef.current || status !== "searching") return;
      
      const users = snapshot.val();
      const waitingIds = Object.keys(users).filter(id => {
        const isMe = id === sessionId;
        const theirData = users[id];
        if (!theirData || theirData.signal) return false;

        const sameStableId = theirData.stableId === stableId;
        const sameCode = (theirData.code || null) === (searchCodeRef.current || null);
        
        if (searchCodeRef.current) {
          return !isMe && sameCode;
        }
        return !isMe && !sameStableId && sameCode;
      });
      
      if (waitingIds.length === 0) return;

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
      
      // Step: Race for the Signal. Only one user can "signal" the other.
      if (pair[0] === sessionId) {
        const signalRef = ref(db, `lobby/${matchedUserId}/signal`);
        runTransaction(signalRef, (currentSignal) => {
          if (currentSignal === null) {
             return { matchId, from: sessionId };
          }
          return;
        }).then((result) => {
          if (result.committed) {
             console.log("[V4] Signal Won. Creating Record...");
             createMatchRecord(matchId, matchedUserId, shared, users[matchedUserId]);
          }
        }).catch(err => console.error("[V4] Signal race error:", err));
      }
    });
  }, [sessionId, stableId, interests, status, userName]);

  const createMatchRecord = (matchId: string, strangerId: string, shared: string[], strangerData: any) => {
    const matchRef = ref(db, `matches/${matchId}`);
    
    // Since signaling won the race, we can just use set() here.
    // This BYPASSES the 'Error: set' crash seen with transactions.
    const record = {
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

    set(matchRef, record)
      .then(() => console.log("[V4] Match Record Created Successfully"))
      .catch(err => console.error("[V4] Failed to set match record:", err));
  };

  useEffect(() => {
    if (status !== "searching") return;

    // 1. Listen for signals TO ME
    const mySignalRef = ref(db, `lobby/${sessionId}/signal`);
    const handleSignal = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      const signal = snapshot.val();
      if (signal && signal.matchId) {
        activeMatchIdRef.current = signal.matchId;
        console.log("[V4] Signal received for match:", signal.matchId);
        
        // Optimize: Once we have a signal, start a direct listener on the specific match
        const specificMatchRef = ref(db, `matches/${signal.matchId}`);
        const handleSpecificMatch = (snap: any) => {
           if (!snap.exists() || matchedGuardRef.current) return;
           const match = snap.val();
           checkAndReadyMatch(signal.matchId, match);
        };
        onValue(specificMatchRef, handleSpecificMatch);
        // We don't need to manually cleanup this specific listener inside the effect 
        // because it's scoped, but for safety:
        return () => off(specificMatchRef, "value", handleSpecificMatch);
      }
    };
    onValue(mySignalRef, handleSignal);

    const checkAndReadyMatch = (mId: string, match: any) => {
      if (!match || matchedGuardRef.current) return;
      
      const amIUser1 = match.user1 === sessionId;
      const amIUser2 = match.user2 === sessionId;
      if (!amIUser1 && !amIUser2) return;

      const myKey = amIUser1 ? "ready1" : "ready2";
      
      if (match.ready1 && match.ready2) {
        finalize(mId, match);
        return;
      }

      if (!match[myKey]) {
        console.log(`[V4] Sending handshake for match ${mId} (${myKey})`);
        set(ref(db, `matches/${mId}/${myKey}`), true).catch(() => {});
        // Fallback cleanup if stranger never joins
        setTimeout(() => {
           if (status === "searching" && !matchedGuardRef.current) {
             console.log("[V4] Match handshake timeout, cleaning up...");
             remove(ref(db, `matches/${mId}`)).catch(() => {});
           }
        }, 12000);
      }
    };

    // 2. Listen for ALL matches (Fallback/Initial match discovery)
    const matchesRef = ref(db, "matches");
    const handleMatches = (snapshot: any) => {
      if (!snapshot.exists() || matchedGuardRef.current) return;
      
      const allMatches = snapshot.val();
      for (const mId in allMatches) {
        const match = allMatches[mId];
        if (!match) continue;
        
        if (match.user1 === sessionId || match.user2 === sessionId) {
          checkAndReadyMatch(mId, match);
        }
      }
    };
    onValue(matchesRef, handleMatches);

    return () => {
      off(mySignalRef, "value", handleSignal);
      off(matchesRef, "value", handleMatches);
    };
  }, [status, sessionId, onMatched]);

  const finalize = (mId: string, match: any) => {
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
    
    const myRef = ref(db, `lobby/${sessionId}`);
    set(myRef, {
      interests: interests || [],
      stableId: stableId || sessionId,
      userName: userName || "",
      code: searchCodeRef.current,
      joinedAt: serverTimestamp(),
      signal: null
    }).catch(err => console.error("[V4] Join failed:", err));
    onDisconnect(myRef).remove();
  }, [sessionId, stableId, interests, userName]);

  const stopSearch = useCallback(() => {
    setStatus("idle");
    remove(ref(db, `lobby/${sessionId}`)).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (status === "searching") {
      const interval = setInterval(() => {
        if (!matchedGuardRef.current) findMatch();
      }, 5000);
      findMatch();
      return () => clearInterval(interval);
    }
  }, [status, findMatch]);

  return { status, startSearch, stopSearch };
}
