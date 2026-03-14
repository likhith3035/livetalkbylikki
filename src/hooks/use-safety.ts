import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, push, serverTimestamp, runTransaction } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_BANNED_WORDS = [
  "sex", "nude", "pussy", "dick", "boobs", "ass", 
  "modda", "lanja", "puku", "kojja", "denga", "dengutha"
];

export function useSafety() {
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;

    // Sync Banned Words
    const wordsRef = ref(db, "settings/safety/profanity_list");
    const unsubWords = onValue(wordsRef, (snapshot) => {
      if (snapshot.exists()) {
        setBannedWords(snapshot.val());
      } else {
        // Initialize with defaults if empty
        setBannedWords(DEFAULT_BANNED_WORDS);
        set(wordsRef, DEFAULT_BANNED_WORDS).catch(() => {});
      }
    });

    // Sync Global Blacklist
    const blacklistRef = ref(db, "admin/blacklist");
    const unsubBlacklist = onValue(blacklistRef, (snapshot) => {
      if (snapshot.exists()) {
        setBlacklist(snapshot.val());
      } else {
        setBlacklist({});
      }
    });

    return () => { unsubWords(); unsubBlacklist(); };
  }, []);

  const checkProfanity = useCallback((text: string) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return bannedWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  }, [bannedWords]);

  const reportUser = useCallback(async (reportedId: string, reason: string, reporterId: string) => {
    if (!db) return;
    const reportsRef = ref(db, "admin/reports");
    const newReportRef = push(reportsRef);
    
    await set(newReportRef, {
      reportedId,
      reporterId,
      reason,
      timestamp: serverTimestamp(),
      status: "pending"
    });

    toast({
      title: "Report Submitted",
      description: "Admin will review this request shortly.",
    });
  }, [toast]);

  const isBanned = useCallback((id: string) => {
    return !!blacklist[id];
  }, [blacklist]);

  const submitAppeal = useCallback(async (uid: string, reason: string) => {
    if (!db) return;
    const appealRef = ref(db, `admin/appeals/${uid}`);
    await set(appealRef, {
      reason,
      timestamp: serverTimestamp(),
      status: "pending"
    });
    toast({
      title: "Appeal Sent",
      description: "Admin will review your request soon.",
    });
  }, [toast]);

  const handleViolation = useCallback(async (uid: string) => {
    if (!db) return;
    const violationRef = ref(db, `admin/violations/${uid}`);
    
    // Increment violation count using transaction
    const result = await runTransaction(violationRef, (currentData) => {
      return (currentData || 0) + 1;
    });

    const count = result.snapshot.val() || 0;

    if (count === 3) {
      toast({
        variant: "destructive",
        title: "Warning: Community Guidelines",
        description: "You have sent abusive words 3 times. Continuing will result in a permanent ban.",
      });
    } else if (count >= 5) {
      // Auto Ban
      await set(ref(db, `admin/blacklist/${uid}`), true);
      // Auto report for the ban
      await reportUser(uid, "Automatic Ban: 5+ Profanity Violations", "SYSTEM");
    }
    
    return count;
  }, [toast, reportUser]);

  return { bannedWords, checkProfanity, reportUser, isBanned, submitAppeal, handleViolation };
}
