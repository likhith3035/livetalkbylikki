import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { db, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { ref, onValue, set, push, remove, get } from "firebase/database";
import { 
  ArrowLeft, ChevronUp, ChevronDown, Users, MessageSquare, Zap, 
  ShieldAlert, Trash2, ShieldCheck, UserX, Plus, Activity,
  Gauge, BarChart3, Grid3X3, Eye, Clock, Lock, RefreshCw, Sparkles, Search,
  Timer, AlertTriangle, Settings, Play, Pause, CheckCircle2, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_BANNED_WORDS } from "@/lib/safetyConstants";


import { CustomTooltip, SummaryCard, HeatmapCell } from "@/components/admin/AdminMetricsComponents";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { toast } = useToast();
  const isDark = settings.darkMode;

  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("echo_admin_authenticated") === "true";
    if (isAuth) {
      setAuthorized(true);
    }
  }, []);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const expectedPasscode = import.meta.env.VITE_ADMIN_PASSCODE || "admin123";
    const entered = passcode.trim();
    if (entered && entered === expectedPasscode) {
      sessionStorage.setItem("echo_admin_authenticated", "true");
      setAuthorized(true);
      setPasscodeError(false);
      toast({ title: "Welcome Admin", description: "Dashboard session authenticated." });
    } else {
      setPasscodeError(true);
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid admin passcode." });
    }
  };

  const [visitData, setVisitData] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<"TRAFFIC" | "ENGAGEMENT" | "INTENSITY" | "SAFETY" | "HEALTH">("TRAFFIC");
  const [safetyReports, setSafetyReports] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");

  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [searchWord, setSearchWord] = useState("");
  const [searchReport, setSearchReport] = useState("");
  const [searchBlacklist, setSearchBlacklist] = useState("");
  const [manualUid, setManualUid] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [currentAnnouncement, setCurrentAnnouncement] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("echo_global_announcement") || "";
    if (saved) setCurrentAnnouncement(saved);

    if (!db || !authorized) return;
    const annRef = ref(db, "settings/global_announcement");
    const unsubAnn = onValue(annRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setCurrentAnnouncement(val);
        localStorage.setItem("echo_global_announcement", val);
      }
    }, () => {});
    return () => unsubAnn();
  }, [authorized]);

  const [systemLogs, setSystemLogs] = useState<Array<{ id: string; time: string; type: "purge" | "maint" | "announce" | "system"; text: string }>>(() => {
    try {
      const saved = localStorage.getItem("echo_system_logs");
      return saved ? JSON.parse(saved) : [
        { id: "1", time: new Date().toLocaleTimeString(), type: "system", text: "🟢 Admin Command Center System Initialized." },
        { id: "2", time: new Date().toLocaleTimeString(), type: "purge", text: "🧹 Initial Lobby Health Scan — Ready for Purge & Maintenance controls." }
      ];
    } catch {
      return [];
    }
  });

  const addLog = (text: string, type: "purge" | "maint" | "announce" | "system") => {
    const item = { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type, text };
    setSystemLogs(prev => {
      const updated = [item, ...prev].slice(0, 50);
      localStorage.setItem("echo_system_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const handlePublishAnnouncement = () => {
    const text = announcementText.trim();
    if (!text) return;

    localStorage.setItem("echo_global_announcement", text);
    window.dispatchEvent(new CustomEvent("echo_announcement_change", { detail: text }));
    setCurrentAnnouncement(text);
    setAnnouncementText("");
    addLog(`📢 Published Announcement: "${text}"`, "announce");
    toast({ title: "📢 Announcement Published!", description: "Broadcast live across all user screens." });

    if (db) {
      set(ref(db, "settings/global_announcement"), text).catch(() => {});
    }
  };

  const handleClearAnnouncement = () => {
    localStorage.removeItem("echo_global_announcement");
    window.dispatchEvent(new CustomEvent("echo_announcement_change", { detail: "" }));
    setCurrentAnnouncement("");
    addLog("📢 Cleared Global Announcement banner.", "announce");
    toast({ title: "Announcement Cleared" });

    if (db) {
      remove(ref(db, "settings/global_announcement")).catch(() => {});
    }
  };

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("echo_maintenance_mode") === "true";
    setMaintenanceMode(saved);

    if (!db || !authorized) return;
    const maintRef = ref(db, "settings/maintenance_mode");
    const unsub = onValue(maintRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() === true;
        setMaintenanceMode(val);
        localStorage.setItem("echo_maintenance_mode", String(val));
      }
    }, () => {});
    return () => unsub();
  }, [authorized]);

  const handleRequestToggleMaintenance = () => {
    setShowMaintConfirm(true);
  };

  const handleConfirmToggleMaintenance = () => {
    setShowMaintConfirm(false);
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    localStorage.setItem("echo_maintenance_mode", String(nextState));
    window.dispatchEvent(new CustomEvent("echo_maintenance_change", { detail: nextState }));

    if (nextState) {
      const ts = Date.now();
      setMaintActiveSince(ts);
      localStorage.setItem("echo_maint_since", String(ts));
    } else {
      setMaintActiveSince(null);
      localStorage.removeItem("echo_maint_since");
    }

    addMaintHistory(nextState ? "Enabled" : "Disabled");
    addLog(
      nextState 
        ? `🚨 Maintenance Mode ENABLED — Visitor matching paused. Notice: "${customMaintMsg}"` 
        : `🟢 Maintenance Mode DISABLED — Normal matching active for all site visitors.`,
      "maint"
    );
    toast({ 
      title: nextState ? "🚨 Maintenance Mode ENABLED" : "🟢 Maintenance Mode DISABLED",
      description: nextState ? "New stranger matching is paused." : "System matching active."
    });
    if (db) {
      set(ref(db, "settings/maintenance_mode"), nextState).catch(() => {});
    }
  };

  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(() => {
    return localStorage.getItem("echo_auto_purge") === "true";
  });
  const [purgedCount, setPurgedCount] = useState(() => {
    return Number(localStorage.getItem("echo_purged_count") || "0");
  });
  const [customMaintMsg, setCustomMaintMsg] = useState(() => {
    return localStorage.getItem("echo_maint_msg") || "🔧 Server maintenance in progress. Matching will resume shortly!";
  });

  // ── Enhanced Maintenance States ──
  const [showMaintConfirm, setShowMaintConfirm] = useState(false);
  const [maintActiveSince, setMaintActiveSince] = useState<number | null>(() => {
    const saved = localStorage.getItem("echo_maint_since");
    return saved ? Number(saved) : null;
  });
  const [maintDurationDisplay, setMaintDurationDisplay] = useState("");
  const [maintHistory, setMaintHistory] = useState<Array<{ id: string; action: string; time: string; date: string }>>(() => {
    try {
      const saved = localStorage.getItem("echo_maint_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [scheduledMaintTime, setScheduledMaintTime] = useState("");
  const [scheduledMaintEndTime, setScheduledMaintEndTime] = useState("");
  const [scheduledMaintActive, setScheduledMaintActive] = useState(false);
  const scheduledMaintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduledMaintEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Enhanced Purge States ──
  const [purgePreviewCount, setPurgePreviewCount] = useState<{ presence: number; lobby: number } | null>(null);
  const [purgeMode, setPurgeMode] = useState<"all" | "presence" | "lobby">("all");
  const [purgeCooldown, setPurgeCooldown] = useState(false);
  const [purgeRunning, setPurgeRunning] = useState(false);
  const [lastPurgeTime, setLastPurgeTime] = useState<string | null>(() => localStorage.getItem("echo_last_purge_time"));
  const [purgedToday, setPurgedToday] = useState(() => {
    const saved = localStorage.getItem("echo_purged_today");
    const savedDate = localStorage.getItem("echo_purged_today_date");
    const today = new Date().toISOString().split("T")[0];
    return savedDate === today && saved ? Number(saved) : 0;
  });
  const purgeCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Enhanced Auto-Purge States ──
  const [autoPurgeInterval, setAutoPurgeInterval] = useState<number>(() => {
    return Number(localStorage.getItem("echo_auto_purge_interval") || "15");
  });
  const [nextAutoPurgeAt, setNextAutoPurgeAt] = useState<number | null>(null);
  const [nextAutoPurgeDisplay, setNextAutoPurgeDisplay] = useState("");
  const [autoPurgedToday, setAutoPurgedToday] = useState(() => {
    const saved = localStorage.getItem("echo_auto_purged_today");
    const savedDate = localStorage.getItem("echo_auto_purged_today_date");
    const today = new Date().toISOString().split("T")[0];
    return savedDate === today && saved ? Number(saved) : 0;
  });
  const autoPurgeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🧠 Smart Threshold Purge States
  const [smartPurgeEnabled, setSmartPurgeEnabled] = useState(() => {
    return localStorage.getItem("echo_smart_purge") !== "false"; // default true
  });
  const [smartPurgeThreshold, setSmartPurgeThreshold] = useState(() => {
    return Number(localStorage.getItem("echo_smart_threshold") || "15");
  });
  const [currentGhostCount, setCurrentGhostCount] = useState(0);
  const lastSmartPurgeRef = useRef<number>(0);

  // ── Maintenance Duration Tracker ──
  useEffect(() => {
    if (!maintActiveSince) { setMaintDurationDisplay(""); return; }
    const tick = () => {
      const diff = Date.now() - maintActiveSince;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setMaintDurationDisplay(`${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [maintActiveSince]);

  // ── Scheduled Maintenance Timer ──
  const handleScheduleMaintenance = useCallback(() => {
    if (!scheduledMaintTime) return;
    // Clear existing timers
    if (scheduledMaintTimerRef.current) clearTimeout(scheduledMaintTimerRef.current);
    if (scheduledMaintEndTimerRef.current) clearTimeout(scheduledMaintEndTimerRef.current);

    const now = Date.now();
    const [startH, startM] = scheduledMaintTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startH, startM, 0, 0);
    if (startDate.getTime() <= now) startDate.setDate(startDate.getDate() + 1);
    const startDelay = startDate.getTime() - now;

    scheduledMaintTimerRef.current = setTimeout(() => {
      if (!maintenanceMode) {
        setMaintenanceMode(true);
        const ts = Date.now();
        setMaintActiveSince(ts);
        localStorage.setItem("echo_maint_since", String(ts));
        localStorage.setItem("echo_maintenance_mode", "true");
        window.dispatchEvent(new CustomEvent("echo_maintenance_change", { detail: true }));
        addLog(`⏰ Scheduled Maintenance AUTO-ENABLED at ${scheduledMaintTime}`, "maint");
        addMaintHistory("Scheduled ON");
        if (db) set(ref(db, "settings/maintenance_mode"), true).catch(() => {});
      }
    }, startDelay);

    if (scheduledMaintEndTime) {
      const [endH, endM] = scheduledMaintEndTime.split(":").map(Number);
      const endDate = new Date();
      endDate.setHours(endH, endM, 0, 0);
      if (endDate.getTime() <= startDate.getTime()) endDate.setDate(endDate.getDate() + 1);
      const endDelay = endDate.getTime() - now;

      scheduledMaintEndTimerRef.current = setTimeout(() => {
        setMaintenanceMode(false);
        setMaintActiveSince(null);
        localStorage.removeItem("echo_maint_since");
        localStorage.setItem("echo_maintenance_mode", "false");
        window.dispatchEvent(new CustomEvent("echo_maintenance_change", { detail: false }));
        addLog(`⏰ Scheduled Maintenance AUTO-DISABLED at ${scheduledMaintEndTime}`, "maint");
        addMaintHistory("Scheduled OFF");
        setScheduledMaintActive(false);
        if (db) set(ref(db, "settings/maintenance_mode"), false).catch(() => {});
      }, endDelay);
    }

    setScheduledMaintActive(true);
    addLog(`📅 Maintenance scheduled: ON at ${scheduledMaintTime}${scheduledMaintEndTime ? `, OFF at ${scheduledMaintEndTime}` : ""}`, "maint");
    toast({ title: "⏰ Maintenance Scheduled!", description: `Will auto-enable at ${scheduledMaintTime}${scheduledMaintEndTime ? ` and auto-disable at ${scheduledMaintEndTime}` : ""}` });
  }, [scheduledMaintTime, scheduledMaintEndTime, maintenanceMode]);

  const handleCancelScheduledMaint = useCallback(() => {
    if (scheduledMaintTimerRef.current) clearTimeout(scheduledMaintTimerRef.current);
    if (scheduledMaintEndTimerRef.current) clearTimeout(scheduledMaintEndTimerRef.current);
    setScheduledMaintActive(false);
    setScheduledMaintTime("");
    setScheduledMaintEndTime("");
    addLog("❌ Cancelled scheduled maintenance window.", "maint");
    toast({ title: "Schedule Cancelled" });
  }, []);

  // Cleanup scheduled timers on unmount
  useEffect(() => {
    return () => {
      if (scheduledMaintTimerRef.current) clearTimeout(scheduledMaintTimerRef.current);
      if (scheduledMaintEndTimerRef.current) clearTimeout(scheduledMaintEndTimerRef.current);
    };
  }, []);

  const addMaintHistory = (action: string) => {
    const entry = { id: Date.now().toString(), action, time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
    setMaintHistory(prev => {
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem("echo_maint_history", JSON.stringify(updated));
      return updated;
    });
  };

  // ── Enhanced Auto-Purge with configurable interval & countdown ──
  useEffect(() => {
    if (autoPurgeTimerRef.current) clearInterval(autoPurgeTimerRef.current);
    if (!autoPurgeEnabled) { setNextAutoPurgeAt(null); setNextAutoPurgeDisplay(""); return; }
    const intervalMs = autoPurgeInterval * 60 * 1000;
    const nextTime = Date.now() + intervalMs;
    setNextAutoPurgeAt(nextTime);
    autoPurgeTimerRef.current = setInterval(() => {
      handlePurgeStalePresence(true);
      setNextAutoPurgeAt(Date.now() + intervalMs);
    }, intervalMs);
    return () => { if (autoPurgeTimerRef.current) clearInterval(autoPurgeTimerRef.current); };
  }, [autoPurgeEnabled, autoPurgeInterval]);

  // Countdown display for next auto-purge
  useEffect(() => {
    if (!nextAutoPurgeAt) { setNextAutoPurgeDisplay(""); return; }
    const tick = () => {
      const remaining = Math.max(0, nextAutoPurgeAt - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setNextAutoPurgeDisplay(`${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextAutoPurgeAt]);

  const handleToggleAutoPurge = () => {
    const next = !autoPurgeEnabled;
    setAutoPurgeEnabled(next);
    localStorage.setItem("echo_auto_purge", String(next));
    addLog(
      next ? `⚡ Enabled Auto-Purge Lobby routine (Every ${autoPurgeInterval} minutes).` : "⏸️ Disabled Auto-Purge Lobby routine.",
      "purge"
    );
    toast({
      title: next ? "⚡ Auto-Purge Enabled" : "⏸️ Auto-Purge Disabled",
      description: next ? `Lobby will auto-clear ghost sessions every ${autoPurgeInterval} minutes.` : "Automated lobby cleanup paused."
    });
  };

  const handleChangeAutoPurgeInterval = (newInterval: number) => {
    setAutoPurgeInterval(newInterval);
    localStorage.setItem("echo_auto_purge_interval", String(newInterval));
    if (autoPurgeEnabled) {
      const intervalMs = newInterval * 60 * 1000;
      setNextAutoPurgeAt(Date.now() + intervalMs);
    }
    addLog(`⚙️ Auto-Purge interval changed to every ${newInterval} minutes.`, "purge");
    toast({ title: "Interval Updated", description: `Auto-Purge now runs every ${newInterval} minutes.` });
  };

  const handleUpdateCustomMaintMsg = () => {
    const text = customMaintMsg.trim();
    if (!text) return;
    localStorage.setItem("echo_maint_msg", text);
    addLog(`📝 Updated Maintenance Visitor Banner: "${text}"`, "maint");
    toast({ title: "Banner Message Saved!", description: "Visitors will see this custom maintenance note." });
  };

  // ── Purge Preview: fetch counts without deleting ──
  const handleFetchPurgePreview = useCallback(async () => {
    if (!db) return;
    let presenceCount = 0;
    let lobbyCount = 0;
    try {
      const presSnap = await get(ref(db, "presence"));
      if (presSnap.exists()) presenceCount = Object.keys(presSnap.val()).length;
      const lobSnap = await get(ref(db, "lobby"));
      if (lobSnap.exists()) lobbyCount = Object.keys(lobSnap.val()).length;
    } catch (err) {
      console.warn("Failed to preview purge counts:", err);
    }
    setPurgePreviewCount({ presence: presenceCount, lobby: lobbyCount });
  }, []);

  // ── Enhanced Purge with selective mode, cooldown, running state ──
  const handlePurgeStalePresence = useCallback(async (isAuto = false) => {
    if (purgeCooldown && !isAuto) {
      toast({ title: "Cooldown Active", description: "Wait a few seconds before purging again." });
      return;
    }
    setPurgeRunning(true);
    let count = 0;
    try {
      if (db) {
        if (purgeMode === "all" || purgeMode === "presence") {
          const presSnap = await get(ref(db, "presence"));
          if (presSnap.exists()) {
            const keys = Object.keys(presSnap.val());
            count += keys.length;
            await Promise.all(keys.map(uid => remove(ref(db, `presence/${uid}`)).catch(() => {})));
          }
        }
        if (purgeMode === "all" || purgeMode === "lobby") {
          const lobSnap = await get(ref(db, "lobby"));
          if (lobSnap.exists()) {
            const keys = Object.keys(lobSnap.val());
            count += keys.length;
            await Promise.all(keys.map(sid => remove(ref(db, `lobby/${sid}`)).catch(() => {})));
          }
        }
      }
    } catch (err) {
      console.warn("Purge execution error:", err);
    }

    const added = Math.max(1, count);
    const newTotal = purgedCount + added;
    setPurgedCount(newTotal);
    localStorage.setItem("echo_purged_count", String(newTotal));

    const nowStr = new Date().toLocaleTimeString();
    setLastPurgeTime(nowStr);
    localStorage.setItem("echo_last_purge_time", nowStr);

    const today = new Date().toISOString().split("T")[0];
    if (isAuto) {
      const newAutoToday = autoPurgedToday + added;
      setAutoPurgedToday(newAutoToday);
      localStorage.setItem("echo_auto_purged_today", String(newAutoToday));
      localStorage.setItem("echo_auto_purged_today_date", today);
    }
    const newToday = purgedToday + added;
    setPurgedToday(newToday);
    localStorage.setItem("echo_purged_today", String(newToday));
    localStorage.setItem("echo_purged_today_date", today);

    const modeLabel = purgeMode === "all" ? "presence+lobby" : purgeMode;
    addLog(
      isAuto
        ? `⚡ Auto-Purge (${autoPurgeInterval}m): Cleared ${count} ${modeLabel} sessions. Total: ${newTotal}.`
        : `🧹 Manual Purge: Cleared ${count} ${modeLabel} sessions. Total: ${newTotal}.`,
      "purge"
    );

    toast({ 
      title: isAuto ? "⚡ Auto-Purge Completed!" : "🧹 Lobby Purged!", 
      description: `Cleared ${count} ${modeLabel} sessions. Today: ${newToday} | All-time: ${newTotal}` 
    });

    setPurgeRunning(false);
    setPurgePreviewCount(null);

    // 10-second cooldown
    if (!isAuto) {
      setPurgeCooldown(true);
      if (purgeCooldownRef.current) clearTimeout(purgeCooldownRef.current);
      purgeCooldownRef.current = setTimeout(() => setPurgeCooldown(false), 10000);
    }
  }, [purgeMode, purgedCount, purgedToday, autoPurgedToday, purgeCooldown, autoPurgeInterval]);

  // Deterministic calculation of metrics for stability
  const derivedMetrics = useMemo(() => {
    const weeklyVelocity = visitData.slice(-7).map((d, i) => ({
      day: d.date === "BASE" ? "B" : new Date(d.date).toLocaleDateString(undefined, { weekday: 'narrow' }),
      value: d.visits || 0,
      uniqueKey: `${d.date}-${i}`
    }));

    const capacity = 50; 
    const loadPercent = Math.min(100, (onlineCount / capacity) * 100);
    const gaugeData = [
      { name: "Active", value: loadPercent, color: "#8b5cf6" },
      { name: "Idle", value: Math.max(0, 100 - loadPercent), color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }
    ];

    const hours = ["6am", "10am", "12pm", "5pm", "8pm"];
    const last7Days = visitData.slice(-7);
    const heatmap = hours.map((time, hIdx) => {
      const row: any = { time };
      const curves = [0.2, 0.5, 0.8, 1.0, 0.7];
      const curve = curves[hIdx] || 0.5;
      last7Days.forEach((day, dIdx) => {
        const dailyTotal = (day.visits || 0);
        row[`day_${dIdx}`] = Math.max(1, Math.round(dailyTotal * curve));
      });
      return row;
    });

    let chartData = visitData.map(v => ({ ...v, value: v.visits, projected: Math.round(v.visits * 1.2) }));
    let chartConfig = { name: "Visits", threshold: "Projected", unit: "Visits" };

    if (selectedMetric === "ENGAGEMENT") {
      chartData = matchData.map(m => ({ ...m, value: m.matches, projected: Math.round(m.matches * 1.15) }));
      chartConfig = { name: "Matches", threshold: "Target", unit: "Matches" };
    } else if (selectedMetric === "INTENSITY") {
      chartData = hourlyData.map(h => ({ ...h, value: h.visits, projected: Math.round(h.visits * 1.3) }));
      chartConfig = { name: "Load", threshold: "Baseline", unit: "Requests" };
    }

    return { weeklyVelocity, gaugeData, heatmap, loadPercent, chartData, chartConfig };
  }, [visitData, matchData, hourlyData, onlineCount, isDark, selectedMetric]);

  const filteredBannedWords = useMemo(() => {
    return bannedWords.filter(w => w.toLowerCase().includes(searchWord.trim().toLowerCase()));
  }, [bannedWords, searchWord]);

  const filteredReports = useMemo(() => {
    return safetyReports.filter(r => 
      (r.reason || "").toLowerCase().includes(searchReport.trim().toLowerCase()) || 
      (r.reportedId || "").toLowerCase().includes(searchReport.trim().toLowerCase())
    );
  }, [safetyReports, searchReport]);

  const filteredBlacklist = useMemo(() => {
    return blacklist.filter(uid => uid.toLowerCase().includes(searchBlacklist.trim().toLowerCase()));
  }, [blacklist, searchBlacklist]);

  // Realtime Firebase listeners
  useEffect(() => {
    if (!db || !authorized) return;
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch(() => {});
    }

    const visitsRef = ref(db, "analytics/daily_visits");
    const unsubVisits = onValue(visitsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let formatted = Object.entries(data)
          .map(([date, count]) => ({ 
            date, 
            visits: typeof count === "number" ? count : 0,
            projected: Math.round((typeof count === "number" ? count : 0) * 1.25),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14);

        if (formatted.length < 2) {
          formatted = [{ date: "BASE", visits: 10, projected: 15 }, ...formatted];
        }

        if (formatted.length >= 2) {
          const last = formatted[formatted.length - 1].visits;
          const prev = formatted[formatted.length - 2].visits;
          setGrowth(prev === 0 ? 100 : Math.round(((last - prev) / prev) * 100));
        }
        setVisitData(formatted);
      }
    }, (error) => console.error("[Admin] Visits Error:", error));

    const matchesRef = ref(db, "analytics/daily_matches");
    const unsubMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data)
          .map(([date, count]) => ({ 
            date, 
            matches: typeof count === "number" ? count : 0,
            projected: Math.round((typeof count === "number" ? count : 0) * 1.1),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14);
        setMatchData(formatted);
      }
    }, (error) => console.error("[Admin] Matches Error:", error));

    const today = new Date().toISOString().split("T")[0];
    const hourlyRef = ref(db, `analytics/hourly_visits/${today}`);
    const unsubHourly = onValue(hourlyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Array.from({ length: 24 }, (_, i) => ({
          date: `${i}:00`,
          visits: data[i] || 0,
          projected: Math.round((data[i] || 0) * 1.2),
        }));
        setHourlyData(formatted);
      }
    }, (error) => console.error("[Admin] Hourly Error:", error));

    const presenceRef = ref(db, "presence");
    const lobbyRef = ref(db, "lobby");

    let pCount = 0;
    let lCount = 0;

    const checkSmartPurgeThreshold = (total: number) => {
      setCurrentGhostCount(total);
      if (smartPurgeEnabled && total >= smartPurgeThreshold) {
        const now = Date.now();
        // Cooldown: limit smart auto-purge to at most once every 30 seconds
        if (now - lastSmartPurgeRef.current > 30000) {
          lastSmartPurgeRef.current = now;
          handlePurgeStalePresence(true);
        }
      }
    };

    const unsubPresence = onValue(presenceRef, (snapshot) => {
      pCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      setOnlineCount(pCount);
      checkSmartPurgeThreshold(pCount + lCount);
    }, (error) => console.error("[Admin] Presence Error:", error));

    const unsubLobby = onValue(lobbyRef, (snapshot) => {
      lCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      checkSmartPurgeThreshold(pCount + lCount);
    }, (error) => console.error("[Admin] Lobby Error:", error));

    const reportsRef = ref(db, "admin/reports");
    const unsubReports = onValue(reportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setSafetyReports(formatted);
      } else {
        setSafetyReports([]);
      }
    }, (error) => console.error("[Admin] Reports Error:", error));

    const wordsRef = ref(db, "settings/safety/profanity_list");
    const unsubWords = onValue(wordsRef, (snapshot) => {
      if (snapshot.exists()) {
        setBannedWords(snapshot.val());
      } else {
        setBannedWords(DEFAULT_BANNED_WORDS);
        set(wordsRef, DEFAULT_BANNED_WORDS).catch(() => {});
      }
    }, (error) => console.error("[Admin] Words Error:", error));

    const appealsRef = ref(db, "admin/appeals");
    const unsubAppeals = onValue(appealsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data)
          .map(([uid, val]: [string, any]) => ({ uid, ...val }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAppeals(formatted);
      } else {
        setAppeals([]);
      }
    }, (error) => console.error("[Admin] Appeals Error:", error));

    const blacklistRef = ref(db, "admin/blacklist");
    const unsubBlacklist = onValue(blacklistRef, (snapshot) => {
      if (snapshot.exists()) {
        setBlacklist(Object.keys(snapshot.val()));
      } else {
        setBlacklist([]);
      }
    }, (error) => console.error("[Admin] Blacklist Error:", error));

    return () => { 
      unsubVisits(); unsubMatches(); unsubHourly(); unsubPresence(); unsubLobby(); 
      unsubReports(); unsubWords(); unsubAppeals(); unsubBlacklist();
    };
  }, [authorized]);

  const totalVisits = visitData.reduce((sum, day) => sum + (day.visits || 0), 0);

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    const wordToAdd = newWord.trim().toLowerCase();
    if (bannedWords.includes(wordToAdd)) {
      toast({ title: "Already Exists", description: `"${wordToAdd}" is already in the filter.` });
      return;
    }
    const updated = [...bannedWords, wordToAdd];
    set(ref(db, "settings/safety/profanity_list"), updated)
      .then(() => {
        setNewWord("");
        toast({ title: "Word Added", description: `"${wordToAdd}" is now in the filter.` });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to update word list." }));
  };

  const handleDeleteWord = (word: string) => {
    const updated = bannedWords.filter(w => w !== word);
    set(ref(db, "settings/safety/profanity_list"), updated)
      .then(() => toast({ title: "Word Removed", description: "Filter updated successfully." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to remove word." }));
  };

  const handleClearAllWords = () => {
    if (bannedWords.length === 0) return;
    set(ref(db, "settings/safety/profanity_list"), [])
      .then(() => {
        setBannedWords([]);
        toast({ title: "Filter Cleared", description: "All banned words removed from filter list." });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to clear filter list." }));
  };

  const handleBanUser = (id: string) => {
    set(ref(db, `admin/blacklist/${id}`), true)
      .then(() => {
        toast({ title: "User Banned", description: `Session ${id.slice(0, 8)}... added to blacklist.` });
        safetyReports.forEach(r => {
          if (r.reportedId === id) handleDismissReport(r.id);
        });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to ban user." }));
  };

  const handleUnbanUser = (id: string) => {
    const blacklistRef = ref(db, `admin/blacklist/${id}`);
    const appealRef = ref(db, `admin/appeals/${id}`);
    
    remove(blacklistRef)
      .then(() => remove(appealRef))
      .then(() => toast({ title: "User Restored", description: "Access restored successfully." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to restore access." }));
  };

  const handleManualBan = () => {
    if (!manualUid.trim()) return;
    handleBanUser(manualUid.trim());
    setManualUid("");
  };

  const handleManualUnban = () => {
    if (!manualUid.trim()) return;
    handleUnbanUser(manualUid.trim());
    setManualUid("");
  };

  const handleDismissReport = (reportId: string) => {
    remove(ref(db, `admin/reports/${reportId}`))
      .then(() => toast({ title: "Report Dismissed" }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to dismiss report." }));
  };

  const handleDismissAllReports = () => {
    if (safetyReports.length === 0) return;
    const promises = safetyReports.map(r => remove(ref(db, `admin/reports/${r.id}`)));
    Promise.all(promises)
      .then(() => toast({ title: "All Reports Dismissed" }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to clear reports." }));
  };

  const handleInjectDemoData = () => {
    const today = new Date();
    const batchVisits: any = {};
    const batchMatches: any = {};

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      batchVisits[dateStr] = 30 + (i * 3) + ((i % 3) * 5);
      batchMatches[dateStr] = 15 + (i * 2) + ((i % 2) * 4);
    }

    const todayStr = today.toISOString().split("T")[0];
    const hoursData = Array.from({ length: 24 }, (_, h) => Math.max(2, Math.round(5 + Math.sin(h / 3) * 6)));
    
    set(ref(db, "analytics/daily_visits"), batchVisits)
      .then(() => set(ref(db, "analytics/daily_matches"), batchMatches))
      .then(() => set(ref(db, `analytics/hourly_visits/${todayStr}`), hoursData))
      .then(() => toast({ title: "Demo Analytics Live", description: "Vibrant stats updated for testing." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to inject demo data." }));
  };

  // --- Passcode Protection Screen ---
  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border border-border/60 bg-card/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8">
          <CardContent className="p-0 flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            
            <div>
              <h2 className="text-xl font-black tracking-tight">Admin Portal</h2>
              <p className="text-xs text-muted-foreground mt-1">Enter authorized passcode to access live controls.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              <Input
                type="password"
                placeholder="Enter admin passcode..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(false);
                }}
                className={`h-11 text-center font-mono text-sm rounded-xl transition-all ${passcodeError ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                autoFocus
              />

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="flex-1 h-10 text-xs font-bold rounded-xl"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exit
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-10 text-xs font-bold rounded-xl shadow-lg"
                >
                  Unlock <Sparkles className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">

      {/* ── Maintenance Confirmation Dialog ── */}
      {showMaintConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-black">
                  {maintenanceMode ? "Disable Maintenance?" : "Enable Maintenance Mode?"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {maintenanceMode
                    ? "This will resume normal matching for all visitors."
                    : "This will pause new stranger matching. Active chats are not affected."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMaintConfirm(false)}
                className="flex-1 h-9 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmToggleMaintenance}
                className={`flex-1 h-9 text-xs font-bold rounded-xl ${maintenanceMode ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"} text-white`}
              >
                {maintenanceMode ? "Yes, Resume Matching" : "Yes, Enable Maintenance"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 gap-4 sm:gap-5 max-w-7xl mx-auto w-full">
        
        {/* ─── Header ─── */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate("/")}
              className="h-9 w-9 rounded-xl border-border/50 shrink-0"
              title="Return to App"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none flex items-center gap-2">
                IncogTalk Super Admin Command Center
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  PRO V2.5
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Realtime global moderation, WebRTC signaling & threat monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const auditData = {
                  timestamp: new Date().toISOString(),
                  onlineUsers: onlineCount,
                  totalVisits,
                  bannedWordsCount: bannedWords.length,
                  blacklistedSessions: blacklist,
                  pendingReports: safetyReports,
                };
                const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `IncogTalk-Audit-Log-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast({ title: "Audit Log Downloaded!", description: "System security snapshot exported." });
              }}
              className="h-8.5 text-xs font-bold gap-1.5 rounded-xl border-border/50 hover:border-primary text-foreground shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Export Audit Log
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestToggleMaintenance}
              className={`h-8.5 text-xs font-bold gap-1.5 rounded-xl border-rose-500/30 transition-all ${maintenanceMode ? "bg-rose-500 text-white border-rose-500" : "text-rose-400 hover:bg-rose-500/10"}`}
            >
              <Lock className="h-3.5 w-3.5" />
              {maintenanceMode ? "Maintenance ACTIVE" : "Maintenance Mode"}
              {maintenanceMode && maintDurationDisplay && (
                <span className="ml-1 text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded-md">{maintDurationDisplay}</span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePurgeStalePresence(false)}
              disabled={purgeCooldown || purgeRunning}
              className={`h-8.5 text-xs font-bold gap-1.5 rounded-xl border-border/50 text-foreground hover:bg-secondary transition-all ${purgeCooldown ? "opacity-50 cursor-not-allowed" : ""}`}
              title={purgeCooldown ? "Cooldown: wait 10s" : "Purge ghost sessions from lobby"}
            >
              {purgeRunning ? (
                <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              )}
              {purgeCooldown ? "Cooldown…" : purgeRunning ? "Purging…" : "Purge Lobby"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInjectDemoData}
              className="h-8.5 text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
            >
              <Activity className="h-3.5 w-3.5" /> Inject Stats
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount} Users Online</span>
            </div>
          </div>
        </header>

        {/* ─── Top Metrics Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          <SummaryCard 
            title="Active Users Online" 
            value={onlineCount} 
            icon={Users}
            colorClass="bg-emerald-500"
            data={derivedMetrics.weeklyVelocity} 
            trend={12} 
          />
          <SummaryCard 
            title="Total Network Visits" 
            value={totalVisits > 1000 ? (totalVisits / 1000).toFixed(1) + "k" : totalVisits} 
            icon={Eye}
            colorClass="bg-blue-500"
            data={visitData.map(v => ({ value: v.visits }))} 
            trend={growth} 
          />
          <SummaryCard 
            title="Server Capacity Load" 
            value={`${derivedMetrics.loadPercent.toFixed(0)}%`} 
            icon={Activity}
            colorClass="bg-violet-500"
            data={derivedMetrics.weeklyVelocity.map(v => ({ value: (v.value / 50) * 100 }))} 
            trend={1} 
          />
        </div>

        {/* ─── Main Grid Layout ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* ─── Main Content Tabs Area (3/4 Desktop) ─── */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white flex-1 flex flex-col overflow-hidden rounded-2xl">
              
              <div className="p-3 sm:p-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {selectedMetric === "SAFETY" ? "Safety & Moderation Center" : "Performance Analytics"}
                  </h3>
                  {selectedMetric !== "SAFETY" && (
                    <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" /> 
                        {derivedMetrics.chartConfig.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 opacity-60" /> 
                        {derivedMetrics.chartConfig.threshold}
                      </span>
                    </div>
                  )}
                </div>

                <Tabs value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)} className="w-full sm:w-auto overflow-x-auto">
                  <TabsList className="h-9 bg-muted/50 border border-border/40 p-1 rounded-xl flex flex-nowrap w-max sm:w-auto">
                    <TabsTrigger value="TRAFFIC" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg shrink-0">
                      <Users className="h-3.5 w-3.5" /> Traffic
                    </TabsTrigger>
                    <TabsTrigger value="ENGAGEMENT" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg shrink-0">
                      <MessageSquare className="h-3.5 w-3.5" /> Matches
                    </TabsTrigger>
                    <TabsTrigger value="INTENSITY" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg shrink-0">
                      <Zap className="h-3.5 w-3.5" /> Load
                    </TabsTrigger>
                    <TabsTrigger value="SAFETY" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg shrink-0">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Safety
                    </TabsTrigger>
                    <TabsTrigger value="HEALTH" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg shrink-0">
                      <Activity className="h-3.5 w-3.5 text-amber-400" /> Logs & Guide
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 w-full p-3 sm:p-5 overflow-y-auto max-h-[85vh]">
                {selectedMetric === "SAFETY" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-1">
                    
                    {/* ── LEFT COLUMN: PROFANITY & MANUAL BAN ── */}
                    <div className="space-y-4">
                      {/* Profanity Filter Manager */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            Profanity Banned Words ({bannedWords.length})
                          </h4>
                          {bannedWords.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleClearAllWords}
                              className="h-6 text-[10px] text-rose-500 hover:bg-rose-500/10 font-bold px-2 rounded-lg gap-1"
                            >
                              <Trash2 className="h-3 w-3" /> Clear All
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add banned word…" 
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                            className="h-8.5 text-xs rounded-xl"
                          />
                          <Button size="sm" onClick={handleAddWord} className="h-8.5 gap-1 rounded-xl text-xs font-bold shrink-0">
                            <Plus className="h-3.5 w-3.5" /> Add
                          </Button>
                        </div>

                        {/* Preset Packs Bar */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Presets:</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9.5px] font-bold rounded-lg px-2 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                            onClick={() => {
                              const pack = ["whatsapp", "telegram", "t.me", "free crypto", "claim prize", "double btc", "click here", "cash app"];
                              const merged = Array.from(new Set([...bannedWords, ...pack]));
                              set(ref(db, "settings/safety/profanity_list"), merged)
                                .then(() => toast({ title: "Spam Filter Pack Added!", description: `${pack.length} spam keywords imported.` }));
                            }}
                          >
                            + Spam Pack
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9.5px] font-bold rounded-lg px-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 shrink-0"
                            onClick={() => {
                              const pack = ["slur", "harass", "abuse", "nude", "hack", "scam", "exploit"];
                              const merged = Array.from(new Set([...bannedWords, ...pack]));
                              set(ref(db, "settings/safety/profanity_list"), merged)
                                .then(() => toast({ title: "Abuse Filter Pack Added!", description: `${pack.length} safety keywords imported.` }));
                            }}
                          >
                            + Abuse Pack
                          </Button>
                        </div>

                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input 
                            placeholder="Search filter list..."
                            value={searchWord}
                            onChange={(e) => setSearchWord(e.target.value)}
                            className="h-8.5 text-xs rounded-xl pl-9 bg-background/50"
                          />
                        </div>

                        <div className="min-h-[100px] max-h-56 overflow-y-auto border border-border/30 rounded-xl p-2.5 flex flex-wrap gap-1.5 bg-background/40 content-start">
                          {filteredBannedWords.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground m-auto text-center font-medium">No matching banned words</p>
                          ) : filteredBannedWords.map((word) => (
                            <div key={word} className="flex items-center gap-1.5 px-2.5 py-1 bg-card/80 hover:bg-card rounded-lg border border-border/50 shadow-sm text-xs font-semibold">
                              <span>{word}</span>
                              <button onClick={() => handleDeleteWord(word)} className="text-muted-foreground hover:text-rose-500 transition-colors ml-1">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Manual Session Moderation */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Manual Moderation Controls</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Restrict or restore user sessions instantly using Session ID.</p>
                        </div>

                        <Input 
                          placeholder="Paste User Session ID..."
                          value={manualUid}
                          onChange={(e) => setManualUid(e.target.value)}
                          className="h-8.5 text-xs rounded-xl font-mono"
                        />

                        <div className="flex gap-2">
                          <Button 
                            variant="destructive"
                            className="flex-1 h-8.5 text-xs font-bold rounded-xl gap-1.5 shadow-sm"
                            onClick={handleManualBan}
                            disabled={!manualUid.trim()}
                          >
                            <UserX className="h-3.5 w-3.5" /> Ban Session
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1 h-8.5 text-xs font-bold rounded-xl gap-1.5"
                            onClick={handleManualUnban}
                            disabled={!manualUid.trim()}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Restore Access
                          </Button>
                        </div>
                      </section>

                      {/* Automated Maintenance & Lobby Health Control Center */}
                      <section className="space-y-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" /> Maintenance & Auto-Purge Controls
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                            Purged: {purgedCount}
                          </span>
                        </div>

                        {/* Auto-Purge 15-Min Switch */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-background/50 text-xs">
                          <div>
                            <p className="font-bold text-foreground">Auto-Purge Lobby (15m Interval)</p>
                            <p className="text-[10px] text-muted-foreground">Automated routine cleanup of ghost sessions.</p>
                          </div>
                          <Button
                            size="sm"
                            variant={autoPurgeEnabled ? "default" : "outline"}
                            onClick={handleToggleAutoPurge}
                            className={`h-7 text-[10px] font-bold rounded-lg ${autoPurgeEnabled ? "bg-amber-500 hover:bg-amber-600 text-black font-extrabold" : ""}`}
                          >
                            {autoPurgeEnabled ? "AUTO-PURGE ON" : "DISABLED"}
                          </Button>
                        </div>

                        {/* Custom Maintenance Note Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            Custom Maintenance Notice for Visitors:
                          </label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Custom maintenance note..."
                              value={customMaintMsg}
                              onChange={(e) => setCustomMaintMsg(e.target.value)}
                              className="h-8 text-xs rounded-xl bg-background/50"
                            />
                            <Button size="sm" onClick={handleUpdateCustomMaintMsg} className="h-8 px-2.5 text-xs font-bold rounded-xl shrink-0">
                              Save
                            </Button>
                          </div>
                        </div>
                      </section>

                      {/* Global Live Broadcast Announcement Control Panel */}
                      <section className="space-y-3 p-4 rounded-2xl border border-primary/30 bg-primary/5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Global Broadcast Announcement
                          </h4>
                          {currentAnnouncement && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleClearAnnouncement}
                              className="h-6 text-[10px] text-rose-400 hover:bg-rose-500/10 font-bold px-2 rounded-lg"
                            >
                              Clear Live Banner
                            </Button>
                          )}
                        </div>

                        {currentAnnouncement ? (
                          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground truncate">📢 Live: {currentAnnouncement}</span>
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full shrink-0">ACTIVE</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground font-medium">No live broadcast message active right now.</p>
                        )}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Type announcement message (e.g. 📢 Server update complete!)..."
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handlePublishAnnouncement()}
                            className="h-8.5 text-xs rounded-xl bg-background/50"
                          />
                          <Button size="sm" onClick={handlePublishAnnouncement} className="h-8.5 px-3 text-xs font-bold rounded-xl shrink-0">
                            Broadcast
                          </Button>
                        </div>
                      </section>
                    </div>

                    {/* ── RIGHT COLUMN: REPORTS, BLACKLIST & APPEALS ── */}
                    <div className="space-y-4">
                      {/* Active User Reports */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Pending Reports ({safetyReports.length})
                          </h4>
                          {safetyReports.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleDismissAllReports}
                              className="h-6 text-[10px] text-rose-500 hover:bg-rose-500/10 font-bold px-2 rounded-lg"
                            >
                              Dismiss All
                            </Button>
                          )}
                        </div>

                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input 
                            placeholder="Search reported UIDs or reasons..."
                            value={searchReport}
                            onChange={(e) => setSearchReport(e.target.value)}
                            className="h-8.5 text-xs rounded-xl pl-9 bg-background/50"
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-border/30 rounded-xl bg-background/40 divide-y divide-border/20">
                          {filteredReports.length === 0 ? (
                            <div className="p-6 text-center m-auto space-y-1">
                              <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto" />
                              <p className="text-[11px] text-muted-foreground font-medium">All reports resolved — System Clean ✨</p>
                            </div>
                          ) : filteredReports.map((r, i) => (
                            <div key={r.id || i} className="p-3 flex items-center justify-between gap-3 hover:bg-card/40 transition-colors">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    {r.reason?.toLowerCase().includes("harass") || r.reason?.toLowerCase().includes("abuse") ? "CRITICAL" : "HIGH"}
                                  </span>
                                  <p className="text-xs font-bold text-foreground truncate">{r.reason || "Safety Violation"}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                  <span className="truncate max-w-[140px]">UID: {r.reportedId}</span>
                                  {r.timestamp && <span>· {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button size="sm" variant="destructive" className="h-7 px-2.5 text-[10px] font-bold rounded-lg shadow-sm" onClick={() => handleBanUser(r.reportedId)}>
                                  <UserX className="h-3 w-3 mr-1" /> Ban
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-semibold rounded-lg text-muted-foreground hover:text-foreground" onClick={() => handleDismissReport(r.id)}>
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Blacklisted Sessions */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UserX className="h-3.5 w-3.5 text-muted-foreground" /> Blacklisted Sessions ({blacklist.length})
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">IP/Device Guard Active</span>
                        </div>

                        <div className="h-32 overflow-y-auto border border-border/30 rounded-xl bg-background/40 divide-y divide-border/20">
                          {filteredBlacklist.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-6 text-center m-auto font-medium">No blacklisted sessions</p>
                          ) : filteredBlacklist.map((uid) => (
                            <div key={uid} className="p-2 px-3 flex items-center justify-between gap-3 hover:bg-card/30 transition-colors">
                              <span className="text-[11px] font-mono text-muted-foreground truncate select-all">{uid}</span>
                              <Button 
                                size="sm" variant="ghost" 
                                className="h-6 px-2.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg shrink-0 gap-1"
                                onClick={() => handleUnbanUser(uid)}
                              >
                                <ShieldCheck className="h-3 w-3" /> Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                  </div>
                ) : selectedMetric === "HEALTH" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-1">
                    
                    {/* ── LEFT COLUMN: REALTIME SYSTEM LOGS TERMINAL ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-secondary/10">
                        <div>
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-amber-400" /> Realtime System Activity Logs ({systemLogs.length})
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Live tracking for Maintenance Mode & Lobby Purges.</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9.5px] font-bold rounded-lg px-2"
                            onClick={() => {
                              const text = systemLogs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join("\n");
                              const blob = new Blob([text], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `IncogTalk-System-Logs-${new Date().toISOString().split("T")[0]}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              toast({ title: "Logs Exported!", description: "Saved text log snapshot." });
                            }}
                          >
                            Export .txt
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[9.5px] text-rose-400 hover:bg-rose-500/10 font-bold px-2 rounded-lg"
                            onClick={() => {
                              setSystemLogs([]);
                              localStorage.removeItem("echo_system_logs");
                              toast({ title: "Logs Cleared" });
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      {/* Log Terminal Window */}
                      <div className="h-[520px] overflow-y-auto border border-border/40 rounded-2xl p-3 bg-black/90 font-mono text-xs space-y-2">
                        {systemLogs.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                            <p className="text-xs font-medium">No activity logged yet. Trigger Maintenance or Purge to see live events!</p>
                          </div>
                        ) : systemLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] leading-relaxed">
                            <span className="text-muted-foreground shrink-0 text-[10px]">{log.time}</span>
                            <span className={`px-1.5 py-0.2 text-[8.5px] font-black uppercase rounded shrink-0 ${
                              log.type === "purge" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              log.type === "maint" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                              log.type === "announce" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                              "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-zinc-200 font-sans">{log.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── RIGHT COLUMN: ENHANCED OPERATIONS CONTROL PANEL ── */}
                    <div className="space-y-3">

                      {/* ▸ MAINTENANCE CONTROL CARD */}
                      <section className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" /> Maintenance Control
                          </h4>
                          {maintenanceMode && maintDurationDisplay && (
                            <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                              Active: {maintDurationDisplay}
                            </span>
                          )}
                        </div>

                        {/* Schedule Maintenance */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            Schedule Maintenance Window:
                          </label>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 flex gap-1.5 items-center">
                              <span className="text-[9px] text-muted-foreground font-bold shrink-0">ON</span>
                              <Input
                                type="time"
                                value={scheduledMaintTime}
                                onChange={(e) => setScheduledMaintTime(e.target.value)}
                                disabled={scheduledMaintActive}
                                className="h-7 text-xs rounded-lg bg-background/50"
                              />
                            </div>
                            <div className="flex-1 flex gap-1.5 items-center">
                              <span className="text-[9px] text-muted-foreground font-bold shrink-0">OFF</span>
                              <Input
                                type="time"
                                value={scheduledMaintEndTime}
                                onChange={(e) => setScheduledMaintEndTime(e.target.value)}
                                disabled={scheduledMaintActive}
                                className="h-7 text-xs rounded-lg bg-background/50"
                              />
                            </div>
                            {scheduledMaintActive ? (
                              <Button size="sm" variant="ghost" onClick={handleCancelScheduledMaint} className="h-7 text-[9px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg px-2 shrink-0">
                                Cancel
                              </Button>
                            ) : (
                              <Button size="sm" onClick={handleScheduleMaintenance} disabled={!scheduledMaintTime} className="h-7 text-[9px] font-bold rounded-lg px-2.5 shrink-0">
                                <Timer className="h-3 w-3 mr-1" /> Set
                              </Button>
                            )}
                          </div>
                          {scheduledMaintActive && (
                            <div className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                              <Timer className="h-3 w-3" /> Scheduled: ON at {scheduledMaintTime}{scheduledMaintEndTime ? `, OFF at ${scheduledMaintEndTime}` : ""}
                            </div>
                          )}
                        </div>

                        {/* Custom Notice */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            Custom Visitor Notice:
                          </label>
                          <div className="flex gap-1.5">
                            <Input
                              placeholder="Maintenance notice..."
                              value={customMaintMsg}
                              onChange={(e) => setCustomMaintMsg(e.target.value)}
                              className="h-7 text-xs rounded-lg bg-background/50"
                            />
                            <Button size="sm" onClick={handleUpdateCustomMaintMsg} className="h-7 px-2 text-[9px] font-bold rounded-lg shrink-0">
                              Save
                            </Button>
                          </div>
                        </div>

                        {/* Maintenance History */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> History ({maintHistory.length})
                          </label>
                          <div className="h-20 overflow-y-auto border border-border/30 rounded-lg bg-background/30 divide-y divide-border/20">
                            {maintHistory.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground p-3 text-center">No history yet</p>
                            ) : maintHistory.slice(0, 10).map(h => (
                              <div key={h.id} className="px-2.5 py-1.5 flex items-center justify-between text-[10px]">
                                <span className={`font-bold ${h.action.includes("ON") || h.action === "Enabled" ? "text-rose-400" : "text-emerald-400"}`}>
                                  {h.action}
                                </span>
                                <span className="text-muted-foreground font-mono">{h.date} {h.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* ▸ PURGE CONTROL CARD */}
                      <section className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Purge Control
                          </h4>
                          <div className="flex items-center gap-2">
                            {lastPurgeTime && (
                              <span className="text-[9px] font-mono text-muted-foreground">Last: {lastPurgeTime}</span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
                              Today: {purgedToday} | All: {purgedCount}
                            </span>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={handleFetchPurgePreview} className="h-7 text-[9px] font-bold rounded-lg px-2.5 gap-1">
                            <Eye className="h-3 w-3" /> Preview
                          </Button>
                          {purgePreviewCount && (
                            <div className="flex gap-2 text-[10px] font-bold">
                              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                Presence: {purgePreviewCount.presence}
                              </span>
                              <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                Lobby: {purgePreviewCount.lobby}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Selective Mode */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            Purge Target:
                          </label>
                          <div className="flex gap-1.5">
                            {(["all", "presence", "lobby"] as const).map((mode) => (
                              <Button
                                key={mode}
                                size="sm"
                                variant={purgeMode === mode ? "default" : "outline"}
                                onClick={() => setPurgeMode(mode)}
                                className={`h-7 text-[9px] font-bold rounded-lg px-2.5 capitalize ${purgeMode === mode ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}`}
                              >
                                {mode === "all" ? "Both" : mode}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Purge Action */}
                        <Button
                          size="sm"
                          onClick={() => handlePurgeStalePresence(false)}
                          disabled={purgeCooldown || purgeRunning}
                          className={`w-full h-8 text-xs font-bold rounded-xl gap-1.5 ${purgeCooldown ? "opacity-50" : "bg-amber-500 hover:bg-amber-600 text-black"}`}
                        >
                          {purgeRunning ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Purging...</>
                          ) : purgeCooldown ? (
                            <><Clock className="h-3.5 w-3.5" /> Cooldown (10s)...</>
                          ) : (
                            <><RefreshCw className="h-3.5 w-3.5" /> Execute Purge Now</>
                          )}
                        </Button>
                      </section>

                      {/* ▸ AUTO-PURGE & SMART THRESHOLD PURGE CARD */}
                      <section className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" /> Auto-Purge & Smart Trigger
                          </h4>
                          <Button
                            size="sm"
                            variant={autoPurgeEnabled ? "default" : "outline"}
                            onClick={handleToggleAutoPurge}
                            className={`h-6 text-[9px] font-bold rounded-lg px-2.5 ${autoPurgeEnabled ? "bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold" : ""}`}
                          >
                            {autoPurgeEnabled ? <><Pause className="h-3 w-3 mr-0.5" /> TIMER ON</> : <><Play className="h-3 w-3 mr-0.5" /> TIMER OFF</>}
                          </Button>
                        </div>

                        {/* Timer Interval Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Settings className="h-3 w-3" /> Timer Interval:
                          </label>
                          <div className="flex gap-1.5 flex-wrap">
                            {[5, 10, 15, 30, 60].map((mins) => (
                              <Button
                                key={mins}
                                size="sm"
                                variant={autoPurgeInterval === mins ? "default" : "outline"}
                                onClick={() => handleChangeAutoPurgeInterval(mins)}
                                className={`h-6 text-[9px] font-bold rounded-lg px-2 ${autoPurgeInterval === mins ? "bg-emerald-500 hover:bg-emerald-600 text-black" : ""}`}
                              >
                                {mins < 60 ? `${mins}m` : "1h"}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* 🧠 Smart Threshold Purge Feature */}
                        <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-background/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              <span className="text-[11px] font-bold text-foreground">Smart Threshold Purge</span>
                            </div>
                            <Button
                              size="sm"
                              variant={smartPurgeEnabled ? "default" : "outline"}
                              onClick={() => {
                                const next = !smartPurgeEnabled;
                                setSmartPurgeEnabled(next);
                                localStorage.setItem("echo_smart_purge", String(next));
                                addLog(next ? `🧠 Smart Threshold Auto-Purge ENABLED (Limit: ${smartPurgeThreshold} ghosts).` : "🧠 Smart Threshold Auto-Purge DISABLED.", "purge");
                                toast({ title: next ? "🧠 Smart Purge Enabled" : "Smart Purge Disabled", description: next ? `Auto-cleans when queue > ${smartPurgeThreshold} ghosts` : "Threshold auto-cleanup paused." });
                              }}
                              className={`h-5.5 text-[8.5px] font-extrabold rounded-md px-2 ${smartPurgeEnabled ? "bg-amber-500 text-black hover:bg-amber-600" : ""}`}
                            >
                              {smartPurgeEnabled ? "ACTIVE" : "OFF"}
                            </Button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9.5px]">
                              <span className="text-muted-foreground font-semibold">Ghost Limit Threshold:</span>
                              <span className="font-mono font-bold text-amber-400">{smartPurgeThreshold} ghosts</span>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {[5, 10, 15, 25, 50].map((limit) => (
                                <Button
                                  key={limit}
                                  size="sm"
                                  variant={smartPurgeThreshold === limit ? "default" : "outline"}
                                  onClick={() => {
                                    setSmartPurgeThreshold(limit);
                                    localStorage.setItem("echo_smart_threshold", String(limit));
                                    toast({ title: "Threshold Updated", description: `Smart purge will run when ghost queue exceeds ${limit}.` });
                                  }}
                                  className={`h-5 text-[8.5px] font-bold px-2 rounded ${smartPurgeThreshold === limit ? "bg-amber-500 text-black hover:bg-amber-600" : ""}`}
                                >
                                  {limit}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Live Queue Capacity Meter */}
                          <div className="flex items-center justify-between text-[9.5px] p-1.5 rounded-lg bg-black/40 border border-white/10 font-mono">
                            <span className="text-zinc-300">Live Ghost Queue:</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-black ${currentGhostCount >= smartPurgeThreshold ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                                {currentGhostCount} / {smartPurgeThreshold}
                              </span>
                              {currentGhostCount >= smartPurgeThreshold && (
                                <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-sans font-bold uppercase">
                                  AUTO PURGING
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Next Purge Countdown & Stats */}
                        {autoPurgeEnabled && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/30">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <Timer className="h-3 w-3 text-emerald-400" />
                              <span className="font-bold text-foreground">Next timer purge:</span>
                              <span className="font-mono font-extrabold text-emerald-400">{nextAutoPurgeDisplay || "—"}</span>
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              Auto today: {autoPurgedToday}
                            </span>
                          </div>
                        )}
                      </section>

                    </div>

                  </div>
                ) : (
                  <div className="h-[360px] sm:h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart key={selectedMetric} data={derivedMetrics.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                        <CartesianGrid vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                        <XAxis 
                          dataKey="date" axisLine={false} tickLine={false} 
                          tick={{ fill: "currentColor", fontSize: 10, opacity: 0.5 }} 
                          dy={5}
                          tickFormatter={(v) => {
                            if (v === "BASE") return "";
                            if (v.includes(":00")) return v;
                            return v.split("-").slice(1).join("/");
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.5 }} width={35} />
                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                        <Area type="monotone" dataKey="value" name={derivedMetrics.chartConfig.name} stroke="#8b5cf6" strokeWidth={2.5} fill="#8b5cf6" fillOpacity={0.1} connectNulls />
                        <Area type="monotone" dataKey="projected" name={derivedMetrics.chartConfig.threshold} stroke="#3b82f6" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ─── Sidebar Widgets (1/4 Desktop) ─── */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            
            {/* Server Load Gauge Widget */}
            <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white flex flex-col items-center justify-center overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-2 w-full mb-1">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Server Capacity</h5>
              </div>
              <div className="w-full relative flex flex-col items-center" style={{ minHeight: 110 }}>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={derivedMetrics.gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="65%" outerRadius="95%" dataKey="value" stroke="none">
                      {derivedMetrics.gaugeData.map((e, i) => <Cell key={`gauge-cell-${i}`} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-1 text-center">
                  <span className="text-2xl font-black block leading-none font-mono">{derivedMetrics.loadPercent.toFixed(0)}%</span>
                  <span className="text-[9.5px] text-muted-foreground font-semibold">Realtime Load</span>
                </div>
              </div>
            </Card>

            {/* Weekly Velocity Bar Chart */}
            <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white flex flex-col overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">7-Day Activity</h5>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derivedMetrics.weeklyVelocity}>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="Visits" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={12} />
                    <XAxis dataKey="uniqueKey" axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.5 }} tickFormatter={(val) => {
                      const entry = derivedMetrics.weeklyVelocity.find(v => v.uniqueKey === val);
                      return entry ? entry.day : "";
                    }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Activity Heatmap */}
            <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white flex flex-col overflow-hidden rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Usage Heatmap</h5>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 px-0.5">
                  <div />
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={`${d}-${i}`} className="text-[9px] font-bold text-muted-foreground text-center">{d}</div>
                  ))}
                </div>
                {derivedMetrics.heatmap.map((row) => (
                  <div key={row.time} className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 px-0.5">
                    <div className="text-[9px] font-bold text-muted-foreground flex items-center">{row.time}</div>
                    {[0,1,2,3,4,5,6].map(idx => (
                      <HeatmapCell key={idx} value={row[`day_${idx}`] || 0} max={Math.max(...visitData.map(v => v.visits || 0)) || 10} />
                    ))}
                  </div>
                ))}
              </div>
            </Card>

          </div>

        </div>

        {/* ─── Footer ─── */}
        <footer className="shrink-0 flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-2 border-t border-border/20">
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            IncogTalk Admin Console v2.0
          </p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </footer>

      </div>
    </div>
  );
};

export default AdminDashboard;
