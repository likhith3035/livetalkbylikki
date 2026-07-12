import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie, Label
} from "recharts";
import { db } from "@/lib/firebase";
import { ref, onValue, set, push, remove, serverTimestamp } from "firebase/database";
import { 
  ArrowLeft, ChevronUp, ChevronDown, Users, MessageSquare, Zap, 
  ShieldAlert, Trash2, ShieldCheck, UserX, Plus, Activity, TrendingUp,
  Gauge, BarChart3, Grid3X3, Eye, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger }
from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_BANNED_WORDS = [
  "sex", "nude", "pussy", "dick", "boobs", "ass", 
  "modda", "lanja", "puku", "kojja", "denga", "dengutha"
];

// --- Custom Tooltip ---

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-xl z-50 border ${isDark ? "bg-black/80 border-white/10" : "bg-white border-black/5 shadow-lg"}`}>
        <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm font-bold flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
                <span className="text-muted-foreground text-[11px] font-medium">{p.name || p.dataKey}</span>
              </span>
              <span className="font-mono text-[13px] font-bold" style={{ color: p.color || p.stroke }}>{p.value?.toLocaleString()}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- Summary Card ---

const SummaryCard = ({ title, value, icon: Icon, color, data, trend }: any) => {
  const isUp = trend >= 0;
  return (
    <Card className="border-none shadow-sm dark:bg-card/50 bg-white hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Color accent stripe */}
          <div className={`w-1 ${color} shrink-0`} />
          <div className="flex-1 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center shrink-0`}
                   style={{ backgroundColor: `var(--${color}-bg, rgba(139,92,246,0.1))` }}>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">{title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
                  {trend !== undefined && (
                    <span className={`text-[11px] font-semibold flex items-center ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                      {isUp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {Math.abs(trend)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="h-10 w-20 opacity-50 group-hover:opacity-80 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="hsl(var(--primary))" fillOpacity={0.08} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Heatmap Cell ---

const HeatmapCell = ({ value, max }: { value: number; max: number }) => {
  const intensity = max > 0 ? value / max : 0;
  return (
    <div 
      className="w-full aspect-square rounded-[3px] transition-all hover:scale-110 cursor-pointer" 
      style={{ backgroundColor: `hsl(265 90% 60% / ${Math.max(0.08, intensity * 0.8)})` }}
      title={`${value} visits`}
    />
  );
};

// --- Main Page ---

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { toast } = useToast();
  const isDark = settings.darkMode;
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("echo_admin_token");
    if (token !== "5f064930eee39bdc7dd4c2b651b159cf83782a11b543") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You are not authorized to view this page."
      });
      navigate("/");
    } else {
      setAuthorized(true);
    }
  }, [navigate, toast]);

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

  // Derive Real Data for Secondary Charts
  const derivedMetrics = useMemo(() => {
    // 1. Weekly Velocity (Bar Chart)
    const weeklyVelocity = visitData.slice(-7).map((d, i) => ({
      day: d.date === "BASE" ? "B" : new Date(d.date).toLocaleDateString(undefined, { weekday: 'narrow' }),
      value: d.visits || 0,
      uniqueKey: `${d.date}-${i}`
    }));

    // 2. Efficiency Gauge (Server Load)
    const capacity = 50; 
    const loadPercent = Math.min(100, (onlineCount / capacity) * 100);
    const gaugeData = [
      { name: "Active", value: loadPercent, color: "hsl(var(--primary))" },
      { name: "Idle", value: 100 - loadPercent, color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }
    ];

    // 3. Operational Heatmap Distribution
    const hours = ["6am", "10am", "12pm", "5pm", "8pm"];
    const last7Days = visitData.slice(-7);
    const heatmap = hours.map((time, hIdx) => {
      const row: any = { time };
      last7Days.forEach((day, dIdx) => {
        const curve = [0.1, 0.4, 0.8, 1, 0.6][hIdx]; 
        const dailyTotal = (day.visits || 0);
        row[`day_${dIdx}`] = Math.max(1, Math.round(dailyTotal * curve * (0.8 + Math.random() * 0.4)));
      });
      return row;
    });

    // 4. Chart Content Switcher
    let chartData = visitData.map(v => ({ ...v, value: v.visits }));
    let chartConfig = { name: "Visits", threshold: "Projected", unit: "Visit count" };

    if (selectedMetric === "ENGAGEMENT") {
      chartData = matchData.map(m => ({ ...m, value: m.matches }));
      chartConfig = { name: "Matches", threshold: "Target", unit: "Match count" };
    } else if (selectedMetric === "INTENSITY") {
      chartData = hourlyData.map(h => ({ ...h, value: h.visits }));
      chartConfig = { name: "Load", threshold: "Baseline", unit: "Requests" };
    }

    return { weeklyVelocity, gaugeData, heatmap, loadPercent, chartData, chartConfig };
  }, [visitData, matchData, hourlyData, onlineCount, isDark, selectedMetric]);

  const filteredBannedWords = useMemo(() => {
    return bannedWords.filter(w => w.toLowerCase().includes(searchWord.trim().toLowerCase()));
  }, [bannedWords, searchWord]);

  const filteredReports = useMemo(() => {
    return safetyReports.filter(r => 
      r.reason.toLowerCase().includes(searchReport.trim().toLowerCase()) || 
      r.reportedId.toLowerCase().includes(searchReport.trim().toLowerCase())
    );
  }, [safetyReports, searchReport]);

  const filteredBlacklist = useMemo(() => {
    return blacklist.filter(uid => uid.toLowerCase().includes(searchBlacklist.trim().toLowerCase()));
  }, [blacklist, searchBlacklist]);

  useEffect(() => {
    if (!db) return;
    
    // Visits Tracking
    const visitsRef = ref(db, "analytics/daily_visits");
    const unsubVisits = onValue(visitsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let formatted = Object.entries(data)
          .map(([date, count]) => ({ 
            date, 
            visits: count as number,
            projected: (count as number) * (0.7 + Math.random() * 0.4),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14);

        if (formatted.length < 2) {
          formatted = [{ date: "BASE", visits: 5, projected: 10 }, ...formatted];
        }

        if (formatted.length >= 2) {
          const last = formatted[formatted.length - 1].visits;
          const prev = formatted[formatted.length - 2].visits;
          setGrowth(prev === 0 ? 100 : Math.round(((last - prev) / prev) * 100));
        }
        setVisitData(formatted);
      }
    }, (error) => {
      console.error("[Admin] Visits Read Error:", error);
    });

    // Match Tracking
    const matchesRef = ref(db, "analytics/daily_matches");
    const unsubMatches = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.entries(data)
          .map(([date, count]) => ({ 
            date, 
            matches: count as number,
            projected: (count as number) * 0.9,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14);
        setMatchData(formatted);
      }
    }, (error) => {
      console.error("[Admin] Matches Read Error:", error);
    });

    // Hourly Intensity (Today)
    const today = new Date().toISOString().split("T")[0];
    const hourlyRef = ref(db, `analytics/hourly_visits/${today}`);
    const unsubHourly = onValue(hourlyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Array.from({ length: 24 }, (_, i) => ({
          date: `${i}:00`,
          visits: data[i] || 0,
          projected: 2,
        }));
        setHourlyData(formatted);
      }
    }, (error) => {
      console.error("[Admin] Hourly Read Error:", error);
    });

    const presenceRef = ref(db, "presence");
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      setOnlineCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    }, (error) => {
      console.error("[Admin] Online Count Error:", error);
    });

    // Safety Reports
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
    }, (error) => {
      console.error("[Admin] Reports Sync Error:", error);
    });

    // Banned Words
    const wordsRef = ref(db, "settings/safety/profanity_list");
    const unsubWords = onValue(wordsRef, (snapshot) => {
      if (snapshot.exists()) {
        setBannedWords(snapshot.val());
      } else {
        // Initialize with defaults if empty
        setBannedWords(DEFAULT_BANNED_WORDS);
        set(wordsRef, DEFAULT_BANNED_WORDS).catch(err => {
          console.error("[Admin] Failed to initialize words:", err);
        });
      }
    }, (error) => {
      console.error("[Admin] Words Sync Error:", error);
    });

    // Ban Appeals
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
    }, (error) => {
      console.error("[Admin] Appeals Sync Error:", error);
    });

    // Blacklist Sync
    const blacklistRef = ref(db, "admin/blacklist");
    const unsubBlacklist = onValue(blacklistRef, (snapshot) => {
      if (snapshot.exists()) {
        setBlacklist(Object.keys(snapshot.val()));
      } else {
        setBlacklist([]);
      }
    }, (error) => {
      console.error("[Admin] Blacklist Sync Error:", error);
    });

    return () => { 
      unsubVisits(); unsubMatches(); unsubHourly(); unsubPresence(); 
      unsubReports(); unsubWords(); unsubAppeals(); unsubBlacklist();
    };
  }, []);

  const totalVisits = visitData.reduce((sum, day) => sum + (day.visits || 0), 0);

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    const updated = [...bannedWords, newWord.trim().toLowerCase()];
    set(ref(db, "settings/safety/profanity_list"), updated)
      .then(() => {
        setNewWord("");
        toast({ title: "Word Added", description: `"${newWord}" is now in the filter.` });
      })
      .catch((err) => {
        console.error("Failed to add word:", err);
        toast({ 
          variant: "destructive", 
          title: "Permission Denied", 
          description: "You don't have permission to edit the word list. Check Firebase Rules." 
        });
      });
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
        toast({ title: "User Banned", description: "User ID has been added to the global blacklist." });
        // Auto-dismiss related reports
        safetyReports.forEach(r => {
          if (r.reportedId === id) handleDismissReport(r.id);
        });
      })
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to ban user." }));
  };

  const handleUnbanUser = (id: string) => {
    // Remove from blacklist and appeals
    const blacklistRef = ref(db, `admin/blacklist/${id}`);
    const appealRef = ref(db, `admin/appeals/${id}`);
    
    remove(blacklistRef)
      .then(() => remove(appealRef))
      .then(() => {
        toast({ title: "User Unbanned", description: "Access has been restored for this user." });
      })
      .catch((err) => {
        console.error("Unban failed:", err);
        toast({ variant: "destructive", title: "Error", description: "Failed to restore access." });
      });
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
    const batchHourly: any = {};

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      batchVisits[dateStr] = Math.floor(25 + Math.random() * 45);
      batchMatches[dateStr] = Math.floor(10 + Math.random() * 25);
    }

    const todayStr = today.toISOString().split("T")[0];
    const hoursData = Array.from({ length: 24 }, () => Math.floor(2 + Math.random() * 12));
    
    set(ref(db, "analytics/daily_visits"), batchVisits)
      .then(() => set(ref(db, "analytics/daily_matches"), batchMatches))
      .then(() => set(ref(db, `analytics/hourly_visits/${todayStr}`), hoursData))
      .then(() => toast({ title: "Demo Data Injected", description: "Vibrant stats now populated for testing." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to inject demo data." }));
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Authenticating…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden overflow-y-auto flex flex-col bg-background text-foreground transition-colors duration-300`}>
      
      <div className="flex-1 flex flex-col p-4 lg:p-6 gap-5 min-h-0">
        
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" size="icon" 
              onClick={() => navigate("/")}
              className="rounded-xl h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Admin overview & analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInjectDemoData}
              className="h-8 text-xs gap-1.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
            >
              <Activity className="h-3.5 w-3.5" /> Inject Stats
            </Button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} online
            </div>
          </div>
        </header>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <SummaryCard 
            title="Online Now" 
            value={onlineCount} 
            icon={Users}
            color="bg-emerald-500"
            data={derivedMetrics.weeklyVelocity} 
            trend={12} 
          />
          <SummaryCard 
            title="Total Visits" 
            value={totalVisits > 1000 ? (totalVisits / 1000).toFixed(1) + "k" : totalVisits} 
            icon={Eye}
            color="bg-blue-500"
            data={visitData.map(v => ({ value: v.visits }))} 
            trend={growth} 
          />
          <SummaryCard 
            title="Server Load" 
            value={`${derivedMetrics.loadPercent.toFixed(0)}%`} 
            icon={Activity}
            color="bg-purple-500"
            data={derivedMetrics.weeklyVelocity.map(v => ({ value: (v.value / 50) * 100 }))} 
            trend={0.1} 
          />
        </div>

        {/* ─── Main Grid ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          
          {/* ─── Chart Area (3/4) ─── */}
          <div className="lg:col-span-3 min-h-0 flex flex-col">
            <Card className="border-none shadow-sm dark:bg-card/50 bg-white h-full flex flex-col overflow-hidden">
              <div className="p-4 pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-sm font-semibold">
                    {selectedMetric === "SAFETY" ? "Safety & Moderation" : "Analytics"}
                  </h3>
                  {selectedMetric !== "SAFETY" && (
                    <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" /> 
                        {derivedMetrics.chartConfig.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-400 opacity-50" /> 
                        {derivedMetrics.chartConfig.threshold}
                      </span>
                    </div>
                  )}
                </div>

                <Tabs value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)} className="w-auto">
                  <TabsList className="h-8 bg-muted/40 border border-border/50 p-0.5 rounded-lg">
                    <TabsTrigger value="TRAFFIC" className="h-7 text-[11px] font-medium px-3 gap-1.5 rounded-md">
                      <Users className="h-3 w-3" /> Traffic
                    </TabsTrigger>
                    <TabsTrigger value="ENGAGEMENT" className="h-7 text-[11px] font-medium px-3 gap-1.5 rounded-md">
                      <MessageSquare className="h-3 w-3" /> Engage
                    </TabsTrigger>
                    <TabsTrigger value="INTENSITY" className="h-7 text-[11px] font-medium px-3 gap-1.5 rounded-md">
                      <Zap className="h-3 w-3" /> Load
                    </TabsTrigger>
                    <TabsTrigger value="SAFETY" className="h-7 text-[11px] font-medium px-3 gap-1.5 rounded-md">
                      <ShieldAlert className="h-3 w-3" /> Safety
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 min-h-0 w-full overflow-hidden p-4 pt-2">
                {selectedMetric === "SAFETY" ? (
                  <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 custom-scrollbar">
                    
                    {/* ── LEFT COLUMN ── */}
                    <div className="space-y-6">
                      {/* Profanity Manager */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/5">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-[13px] font-bold text-foreground">Profanity Filter ({bannedWords.length})</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight">Add words to block matches matching those interests.</p>
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add banned word…" 
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                            className="h-8 text-xs rounded-lg"
                          />
                          <Button size="sm" onClick={handleAddWord} className="h-8 gap-1 rounded-lg text-xs font-semibold shrink-0">
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                        <Input 
                          placeholder="Search filter list..."
                          value={searchWord}
                          onChange={(e) => setSearchWord(e.target.value)}
                          className="h-8 text-xs rounded-lg bg-background/50"
                        />
                        <div className="h-44 overflow-y-auto border border-border/30 rounded-lg p-2 flex flex-wrap gap-1.5 bg-background/30 content-start custom-scrollbar">
                          {filteredBannedWords.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground m-auto text-center">No matching words</p>
                          ) : filteredBannedWords.map((word) => (
                            <div key={word} className="flex items-center gap-1.5 px-2 py-1 bg-card/60 hover:bg-muted/80 rounded-md border border-border/40 transition-colors group">
                              <span className="text-[11px] font-medium">{word}</span>
                              <button onClick={() => handleDeleteWord(word)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Manual Ban/Unban Control */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/5">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-[13px] font-bold text-foreground">Manual Moderation</h4>
                          <p className="text-[10px] text-muted-foreground leading-tight">Restrict or restore user sessions instantly using their unique ID.</p>
                        </div>
                        <Input 
                          placeholder="Paste User Session ID..."
                          value={manualUid}
                          onChange={(e) => setManualUid(e.target.value)}
                          className="h-9 text-xs rounded-lg"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive"
                            className="flex-1 h-9 text-xs font-bold rounded-lg gap-1.5"
                            onClick={handleManualBan}
                            disabled={!manualUid.trim()}
                          >
                            <UserX className="h-3.5 w-3.5" /> Ban Session
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1 h-9 text-xs font-bold rounded-lg gap-1.5"
                            onClick={handleManualUnban}
                            disabled={!manualUid.trim()}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Restore Access
                          </Button>
                        </div>
                      </section>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="space-y-6">
                      {/* Active Reports */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/5">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-destructive/80" /> User Reports ({safetyReports.length})
                          </h4>
                          {safetyReports.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleDismissAllReports}
                              className="h-6 text-[10px] text-destructive hover:bg-destructive/10 font-bold px-2 rounded-md"
                            >
                              Dismiss All
                            </Button>
                          )}
                        </div>
                        <Input 
                          placeholder="Search reports..."
                          value={searchReport}
                          onChange={(e) => setSearchReport(e.target.value)}
                          className="h-8 text-xs rounded-lg bg-background/50"
                        />
                        <div className="h-44 overflow-y-auto border border-border/30 rounded-lg bg-background/30 divide-y divide-border/30 custom-scrollbar">
                          {filteredReports.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-8 text-center m-auto">No pending reports ✨</p>
                          ) : filteredReports.map((r) => (
                            <div key={r.id} className="p-3 flex items-start justify-between gap-3 hover:bg-card/10 transition-colors">
                              <div className="space-y-1 min-w-0">
                                <p className="text-xs font-bold text-destructive/90 truncate leading-none">{r.reason}</p>
                                <p className="text-[9px] font-mono text-muted-foreground truncate leading-none">{r.reportedId}</p>
                                <p className="text-[9px] text-muted-foreground/60 leading-none">{new Date(r.timestamp).toLocaleTimeString()}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] font-bold border-red-500/25 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleBanUser(r.reportedId)}>
                                  Ban
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleDismissReport(r.id)}>
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Blacklist Directory */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/5">
                        <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-muted-foreground" /> Banned Directory ({blacklist.length})
                        </h4>
                        <Input 
                          placeholder="Search blacklist..."
                          value={searchBlacklist}
                          onChange={(e) => setSearchBlacklist(e.target.value)}
                          className="h-8 text-xs rounded-lg bg-background/50"
                        />
                        <div className="h-32 overflow-y-auto border border-border/30 rounded-lg bg-background/30 divide-y divide-border/30 custom-scrollbar">
                          {filteredBlacklist.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-8 text-center m-auto">No blacklisted sessions</p>
                          ) : filteredBlacklist.map((uid) => (
                            <div key={uid} className="p-2 px-3 flex items-center justify-between gap-3 hover:bg-card/10 transition-colors">
                              <span className="text-[11px] font-mono text-muted-foreground truncate">{uid}</span>
                              <Button 
                                size="sm" variant="ghost" 
                                className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 shrink-0"
                                onClick={() => handleUnbanUser(uid)}
                              >
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Ban Appeals */}
                      <section className="space-y-3 p-4 rounded-2xl border border-border/40 bg-secondary/5">
                        <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary/80" /> Appeals Inbox ({appeals.length})
                        </h4>
                        <div className="h-32 overflow-y-auto border border-border/30 rounded-lg bg-background/30 divide-y divide-border/30 custom-scrollbar">
                          {appeals.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground p-8 text-center m-auto">No appeals pending</p>
                          ) : appeals.map((a) => (
                            <div key={a.uid} className="p-3 flex items-start justify-between gap-3 hover:bg-card/10 transition-colors">
                              <div className="space-y-1 min-w-0">
                                <p className="text-xs font-bold text-foreground/90 leading-tight">{a.reason}</p>
                                <p className="text-[9px] font-mono text-muted-foreground truncate leading-none">{a.uid}</p>
                              </div>
                              <Button 
                                size="sm" variant="glow" 
                                className="h-6 px-2 text-[10px] font-bold shrink-0"
                                onClick={() => handleUnbanUser(a.uid)}
                              >
                                Grant Appeal
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={derivedMetrics.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid vertical={false} stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} />
                      <XAxis 
                        dataKey="date" axisLine={false} tickLine={false} 
                        tick={{ fill: "currentColor", fontSize: 10, opacity: 0.4 }} 
                        dy={5}
                        tickFormatter={(v) => {
                          if (v === "BASE") return "";
                          if (v.includes(":00")) return v;
                          return v.split("-").slice(1).join("/");
                        }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.4 }} width={35} />
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <Area type="monotone" dataKey="value" name={derivedMetrics.chartConfig.name} stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.06} connectNulls />
                      <Area type="monotone" dataKey="projected" name={derivedMetrics.chartConfig.threshold} stroke="#3b82f6" strokeWidth={1} fillOpacity={0} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* ─── Sidebar Widgets (1/4) ─── */}
          <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
            
            {/* Gauge Card */}
            <Card className="border-none shadow-sm dark:bg-card/50 bg-white flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
              <CardContent className="p-4 w-full flex flex-col items-center">
                <div className="flex items-center gap-2 w-full mb-2">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  <h5 className="text-[11px] font-medium text-muted-foreground">Server Load</h5>
                </div>
                <div className="w-full relative" style={{ minHeight: 100 }}>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart><Pie data={derivedMetrics.gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="65%" outerRadius="95%" dataKey="value" stroke="none">
                      {derivedMetrics.gaugeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-0 left-0 right-0 text-center pb-1">
                    <span className="text-2xl font-bold block leading-none">{derivedMetrics.loadPercent.toFixed(0)}%</span>
                    <span className="text-[10px] text-muted-foreground">capacity</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Bar Chart */}
            <Card className="border-none shadow-sm dark:bg-card/50 bg-white flex-1 flex flex-col min-h-[120px] overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <h5 className="text-[11px] font-medium text-muted-foreground">Weekly Activity</h5>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" minHeight={60}>
                    <BarChart data={derivedMetrics.weeklyVelocity}>
                      <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" name="Visits" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} barSize={10} key="bar-visits" />
                      <XAxis dataKey="uniqueKey" axisLine={false} tickLine={false} tick={{ fontSize: 9, opacity: 0.35 }} tickFormatter={(val) => {
                        const entry = derivedMetrics.weeklyVelocity.find(v => v.uniqueKey === val);
                        return entry ? entry.day : "";
                      }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Heatmap */}
            <Card className="border-none shadow-sm dark:bg-card/50 bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <h5 className="text-[11px] font-medium text-muted-foreground">Activity Heatmap</h5>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {/* Day headers */}
                  <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-1 px-0.5">
                    <div />
                    {["M","T","W","T","F","S","S"].map((d, i) => (
                      <div key={`${d}-${i}`} className="text-[9px] font-medium text-muted-foreground text-center">{d}</div>
                    ))}
                  </div>
                  {/* Heatmap rows */}
                  {derivedMetrics.heatmap.map((row) => (
                    <div key={row.time} className="flex-1 grid grid-cols-[40px_repeat(7,1fr)] gap-1 px-0.5">
                      <div className="text-[9px] font-medium text-muted-foreground flex items-center">{row.time}</div>
                      {[0,1,2,3,4,5,6].map(idx => (
                        <HeatmapCell key={idx} value={row[`day_${idx}`] || 0} max={Math.max(...visitData.map(v => v.visits || 0)) || 10} />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* ─── Footer ─── */}
        <div className="shrink-0 flex justify-between text-[10px] text-muted-foreground/40 font-medium pb-1">
          <p>LiveTalk Admin</p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date().toLocaleDateString()}
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
