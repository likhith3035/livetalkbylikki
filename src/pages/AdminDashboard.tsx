import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { db } from "@/lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";
import { 
  ArrowLeft, ChevronUp, ChevronDown, Users, MessageSquare, Zap, 
  ShieldAlert, Trash2, ShieldCheck, UserX, Plus, Activity,
  Gauge, BarChart3, Grid3X3, Eye, Clock, Lock, RefreshCw, Sparkles, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_BANNED_WORDS = [
  "sex", "nude", "pussy", "dick", "boobs", "ass", 
  "modda", "lanja", "puku", "kojja", "denga", "dengutha"
];

const ADMIN_SECRET_TOKEN = "5f064930eee39bdc7dd4c2b651b159cf83782a11b543";

// --- Custom Recharts Tooltip ---
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 border ${isDark ? "bg-black/90 border-white/15 text-white" : "bg-white/95 border-black/10 text-slate-900 shadow-xl"}`}>
        <p className="text-[11px] text-muted-foreground font-bold mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || "#8b5cf6" }} />
                <span>{p.name || p.dataKey}</span>
              </span>
              <span className="font-mono text-sm font-black" style={{ color: p.color || "#8b5cf6" }}>
                {p.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- Summary Metric Card ---
const SummaryCard = ({ title, value, icon: Icon, colorClass, data, trend }: any) => {
  const isUp = trend >= 0;
  return (
    <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white hover:shadow-md transition-all duration-300 overflow-hidden group rounded-2xl">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={`w-1.5 ${colorClass} shrink-0`} />
          <div className="flex-1 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`h-11 w-11 rounded-2xl ${colorClass} bg-opacity-15 flex items-center justify-center shrink-0 border border-white/10 shadow-inner`}>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground leading-tight truncate">{title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h4 className="text-2xl font-black tracking-tight font-mono">{value}</h4>
                  {trend !== undefined && (
                    <span className={`text-[11px] font-extrabold flex items-center ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                      {isUp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {Math.abs(trend)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="h-10 w-24 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.12} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Deterministic Heatmap Cell ---
const HeatmapCell = ({ value, max }: { value: number; max: number }) => {
  const intensity = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div 
      className="w-full aspect-square rounded-md transition-all hover:scale-125 cursor-pointer shadow-sm" 
      style={{ backgroundColor: `hsl(265 85% 60% / ${Math.max(0.1, intensity * 0.85)})` }}
      title={`${value} requests`}
    />
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { toast } = useToast();
  const isDark = settings.darkMode;

  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("echo_admin_token");
    if (token === ADMIN_SECRET_TOKEN) {
      setAuthorized(true);
    }
  }, []);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() === "admin123" || passcode.trim() === ADMIN_SECRET_TOKEN) {
      sessionStorage.setItem("echo_admin_token", ADMIN_SECRET_TOKEN);
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
  const [selectedMetric, setSelectedMetric] = useState<"TRAFFIC" | "ENGAGEMENT" | "INTENSITY" | "SAFETY">("TRAFFIC");
  const [safetyReports, setSafetyReports] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");

  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [searchWord, setSearchWord] = useState("");
  const [searchReport, setSearchReport] = useState("");
  const [searchBlacklist, setSearchBlacklist] = useState("");
  const [manualUid, setManualUid] = useState("");

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
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      setOnlineCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    }, (error) => console.error("[Admin] Presence Error:", error));

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
      unsubVisits(); unsubMatches(); unsubHourly(); unsubPresence(); 
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
      <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 gap-4 sm:gap-5 max-w-7xl mx-auto w-full">
        
        {/* ─── Header ─── */}
        <header className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-card/40 border border-border/40 p-3 sm:p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate("/")}
              className="rounded-xl h-9 w-9 shrink-0 border-border/60 hover:bg-secondary"
              title="Return to App"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none flex items-center gap-2">
                Admin Control Hub
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Realtime moderation & network analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <span>{onlineCount} Online</span>
            </div>
          </div>
        </header>

        {/* ─── Top Metrics Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
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
          <div className="lg:col-span-3 min-h-[480px] flex flex-col">
            <Card className="border border-border/40 shadow-sm dark:bg-card/40 bg-white flex-1 flex flex-col overflow-hidden rounded-2xl">
              
              <div className="p-4 border-b border-border/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
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

                <Tabs value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)} className="w-auto">
                  <TabsList className="h-9 bg-muted/50 border border-border/40 p-1 rounded-xl">
                    <TabsTrigger value="TRAFFIC" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg">
                      <Users className="h-3.5 w-3.5" /> Traffic
                    </TabsTrigger>
                    <TabsTrigger value="ENGAGEMENT" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg">
                      <MessageSquare className="h-3.5 w-3.5" /> Matches
                    </TabsTrigger>
                    <TabsTrigger value="INTENSITY" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg">
                      <Zap className="h-3.5 w-3.5" /> Load
                    </TabsTrigger>
                    <TabsTrigger value="SAFETY" className="h-7 text-[11px] font-bold px-3 gap-1.5 rounded-lg">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Safety
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 w-full overflow-hidden p-4">
                {selectedMetric === "SAFETY" ? (
                  <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto pr-1">
                    
                    {/* ── LEFT COLUMN: PROFANITY & MANUAL BAN ── */}
                    <div className="space-y-4">
                      {/* Profanity Filter Manager */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            Profanity Banned Words ({bannedWords.length})
                          </h4>
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

                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input 
                            placeholder="Search filter list..."
                            value={searchWord}
                            onChange={(e) => setSearchWord(e.target.value)}
                            className="h-8.5 text-xs rounded-xl pl-9 bg-background/50"
                          />
                        </div>

                        <div className="h-44 overflow-y-auto border border-border/30 rounded-xl p-2.5 flex flex-wrap gap-1.5 bg-background/40 content-start">
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
                            placeholder="Search reports..."
                            value={searchReport}
                            onChange={(e) => setSearchReport(e.target.value)}
                            className="h-8.5 text-xs rounded-xl pl-9 bg-background/50"
                          />
                        </div>

                        <div className="h-40 overflow-y-auto border border-border/30 rounded-xl bg-background/40 divide-y divide-border/20">
                          {filteredReports.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-6 text-center m-auto font-medium">No pending user reports ✨</p>
                          ) : filteredReports.map((r) => (
                            <div key={r.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-card/30 transition-colors">
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-xs font-extrabold text-rose-500 truncate">{r.reason}</p>
                                <p className="text-[9.5px] font-mono text-muted-foreground truncate">{r.reportedId}</p>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <Button size="sm" variant="outline" className="h-6.5 px-2 text-[10px] font-bold border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg" onClick={() => handleBanUser(r.reportedId)}>
                                  Ban
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6.5 px-2 text-[10px] font-semibold rounded-lg" onClick={() => handleDismissReport(r.id)}>
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Blacklisted Sessions */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/10 shadow-sm">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-muted-foreground" /> Blacklisted Sessions ({blacklist.length})
                        </h4>

                        <div className="h-32 overflow-y-auto border border-border/30 rounded-xl bg-background/40 divide-y divide-border/20">
                          {filteredBlacklist.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-6 text-center m-auto font-medium">No blacklisted sessions</p>
                          ) : filteredBlacklist.map((uid) => (
                            <div key={uid} className="p-2 px-3 flex items-center justify-between gap-3 hover:bg-card/30 transition-colors">
                              <span className="text-[11px] font-mono text-muted-foreground truncate">{uid}</span>
                              <Button 
                                size="sm" variant="ghost" 
                                className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg shrink-0"
                                onClick={() => handleUnbanUser(uid)}
                              >
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                  </div>
                ) : (
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={derivedMetrics.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
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
                      {derivedMetrics.gaugeData.map((e, i) => <Cell key={i} fill={e.color} />)}
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
            LiveTalk Admin Console v2.0
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
