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
  ShieldAlert, Trash2, ShieldCheck, UserX, Plus
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

// --- Custom Components ---

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl shadow-2xl backdrop-blur-md z-50 border ${isDark ? "bg-black/90 border-white/10" : "bg-white/95 border-black/5"}`}>
        <p className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm font-black flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
                <span className="opacity-70 text-[10px] uppercase font-bold">{p.name || p.dataKey}</span>
              </span>
              <span className="font-mono text-xs" style={{ color: p.color || p.stroke }}>{p.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- UI Sub-Components ---

const SummaryCard = ({ title, value, data, trend }: any) => {
  const isUp = trend >= 0;
  return (
    <Card className="border-none shadow-sm dark:bg-card/40 bg-white shadow-gray-200/50 dark:shadow-none hover:shadow-md transition-shadow">
      <CardContent className="p-3 lg:p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-xl lg:text-2xl font-black tracking-tight">{value}</h4>
            {trend !== undefined && (
              <span className={`text-[9px] font-bold flex items-center ${isUp ? "text-green-500" : "text-red-500"}`}>
                {isUp ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className="h-8 lg:h-10 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const HeatmapCell = ({ value, max }: { value: number; max: number }) => {
  const opacity = value / max;
  return (
    <div 
      className="w-full h-full min-h-[0.8rem] rounded-[2px] transition-all hover:scale-110 cursor-pointer" 
      style={{ backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, opacity)})` }}
    />
  );
};

// --- Main Page ---

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { toast } = useToast();
  const isDark = settings.darkMode;
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
      { name: "Idle", value: 100 - loadPercent, color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }
    ];

    // 3. Operational Heatmap Distribution (Simulated from Real Daily Totals)
    const hours = ["6am", "10am", "12pm", "5pm", "8pm"];
    const last7Days = visitData.slice(-7);
    const heatmap = hours.map((time, hIdx) => {
      const row: any = { time };
      last7Days.forEach((day, dIdx) => {
        // Distribute the real daily total visits based on a typical traffic curve
        const curve = [0.1, 0.4, 0.8, 1, 0.6][hIdx]; 
        const dailyTotal = (day.visits || 0);
        row[`day_${dIdx}`] = Math.max(1, Math.round(dailyTotal * curve * (0.8 + Math.random() * 0.4)));
      });
      return row;
    });

    // 4. Chart Content Switcher
    let chartData = visitData.map(v => ({ ...v, value: v.visits }));
    let chartConfig = { name: "Actual Visits", threshold: "Service Threshold", unit: "Visit Density" };

    if (selectedMetric === "ENGAGEMENT") {
      chartData = matchData.map(m => ({ ...m, value: m.matches }));
      chartConfig = { name: "Peer Matches", threshold: "Target Engagement", unit: "Match Rate" };
    } else if (selectedMetric === "INTENSITY") {
      chartData = hourlyData.map(h => ({ ...h, value: h.visits }));
      chartConfig = { name: "Direct Load", threshold: "Node Baseline", unit: "Load Spikes" };
    }

    return { weeklyVelocity, gaugeData, heatmap, loadPercent, chartData, chartConfig };
  }, [visitData, matchData, hourlyData, onlineCount, isDark, selectedMetric]);

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
    });

    const presenceRef = ref(db, "presence");
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      setOnlineCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
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
    });

    // Banned Words
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
    });

    return () => { 
      unsubVisits(); unsubMatches(); unsubHourly(); unsubPresence(); 
      unsubReports(); unsubWords(); unsubAppeals();
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

  const handleDismissReport = (reportId: string) => {
    remove(ref(db, `admin/reports/${reportId}`))
      .then(() => toast({ title: "Report Dismissed" }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to dismiss report." }));
  };

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden overflow-y-auto flex flex-col ${isDark ? "bg-[#09090B] text-white" : "bg-[#F8F9FA] text-[#1A1A1E]"} transition-colors duration-500`}>
      
      <div className="flex-1 flex flex-col p-3 lg:p-6 space-y-3 min-h-0 lg:min-h-0">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" size="icon" 
              onClick={() => navigate("/")}
              className="rounded-xl border-border bg-card/50 backdrop-blur-sm group shadow-sm h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none">Telemetry Control</h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Node Status: Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl ${isDark ? "bg-primary/10 border-primary/20" : "bg-white shadow-sm border-black/5"} border text-[9px] font-black uppercase tracking-widest text-primary`}>
              <span className="h-1 w-1 rounded-full bg-primary animate-pulse" /> Signal Stable
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          <SummaryCard title="Live Ingress" value={onlineCount} data={derivedMetrics.weeklyVelocity} trend={12} />
          <SummaryCard title="Traffic Volume" value={totalVisits > 1000 ? (totalVisits / 1000).toFixed(1) + "k" : totalVisits} data={visitData.map(v => ({ value: v.visits }))} trend={growth} />
          <SummaryCard title="Load Intensity" value={`${derivedMetrics.loadPercent.toFixed(1)}%`} data={derivedMetrics.weeklyVelocity.map(v => ({ value: (v.value / 50) * 100 }))} trend={0.1} />
        </div>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
          
          {/* Growth Chart */}
          <div className="lg:col-span-3 min-h-0 flex flex-col">
            <Card className="border-none shadow-sm dark:bg-card/40 bg-white shadow-gray-200/50 p-4 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-3 shrink-0">
                 <div className="flex items-center gap-4">
                   <h3 className="text-[9px] font-black uppercase tracking-widest opacity-40">
                     {selectedMetric === "SAFETY" ? "Safety & Policy Hub" : "Load Propagation Analysis"}
                   </h3>
                   {selectedMetric !== "SAFETY" && (
                     <div className="flex gap-2 text-[8px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {derivedMetrics.chartConfig.name}</span>
                        <span className="flex items-center gap-1 opacity-30"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> {derivedMetrics.chartConfig.threshold}</span>
                     </div>
                   )}
                 </div>

                 <Tabs value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)} className="w-auto">
                    <TabsList className="h-7 bg-muted/30 border border-border/50 p-0.5 rounded-lg">
                      <TabsTrigger value="TRAFFIC" className="h-6 text-[8px] font-black uppercase tracking-widest px-3 gap-1.5 transition-all">
                        <Users className="h-2.5 w-2.5" /> Traffic
                      </TabsTrigger>
                      <TabsTrigger value="ENGAGEMENT" className="h-6 text-[8px] font-black uppercase tracking-widest px-3 gap-1.5 transition-all">
                        <MessageSquare className="h-2.5 w-2.5" /> Engagement
                      </TabsTrigger>
                      <TabsTrigger value="INTENSITY" className="h-6 text-[8px] font-black uppercase tracking-widest px-3 gap-1.5 transition-all">
                        <Zap className="h-2.5 w-2.5" /> Intensity
                      </TabsTrigger>
                      <TabsTrigger value="SAFETY" className="h-6 text-[8px] font-black uppercase tracking-widest px-3 gap-1.5 transition-all">
                        <ShieldAlert className="h-2.5 w-2.5" /> Safety
                      </TabsTrigger>
                    </TabsList>
                 </Tabs>
              </div>

              <div className="flex-1 min-h-0 w-full overflow-hidden">
                {selectedMetric === "SAFETY" ? (
                  <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Profanity Manager */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Profanity Filter</h4>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Input 
                            placeholder="Add banned word..." 
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
                            className="h-8 w-full sm:w-48 text-[10px] bg-muted/20 border-border/50"
                          />
                          <Button size="sm" onClick={handleAddWord} className="h-8 gap-2 rounded-lg text-[10px] font-bold w-full sm:w-auto">
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bannedWords.map((word) => (
                          <div key={word} className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 transition-colors group">
                            <span className="text-[10px] font-bold">{word}</span>
                            <button onClick={() => handleDeleteWord(word)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reports Table */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Recent User Reports</h4>
                      <div className="border border-border/50 rounded-xl overflow-x-auto bg-muted/5 custom-scrollbar">
                        <div className="min-w-[600px]">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-muted/10 border-b border-border/50">
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">Reason</th>
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">Reported ID</th>
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">Timestamp</th>
                              <th className="px-4 py-3 text-right font-black uppercase tracking-wider opacity-40">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {safetyReports.length === 0 ? (
                              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground opacity-50 font-bold">No active reports. Community is clean!</td></tr>
                            ) : safetyReports.map((r) => (
                              <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                                <td className="px-4 py-3 font-bold text-destructive flex items-center gap-2">
                                  <ShieldAlert className="h-3 w-3 opacity-50" /> {r.reason}
                                </td>
                                <td className="px-4 py-3 font-mono opacity-60">{r.reportedId.slice(0, 12)}...</td>
                                <td className="px-4 py-3 opacity-40">{new Date(r.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleBanUser(r.reportedId)}>
                                    <UserX className="h-2.5 w-2.5" /> Ban
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1" onClick={() => handleDismissReport(r.id)}>
                                    <ShieldCheck className="h-2.5 w-2.5" /> Dismiss
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    </div>

                    {/* Appeals Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pending Ban Appeals</h4>
                      <div className="border border-border/50 rounded-xl overflow-x-auto bg-muted/5 custom-scrollbar">
                        <div className="min-w-[600px]">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-muted/10 border-b border-border/50">
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">Appeal Reason</th>
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">User ID</th>
                              <th className="px-4 py-3 text-left font-black uppercase tracking-wider opacity-40">Timestamp</th>
                              <th className="px-4 py-3 text-right font-black uppercase tracking-wider opacity-40">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {appeals.length === 0 ? (
                              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground opacity-50 font-bold">No pending appeals.</td></tr>
                            ) : appeals.map((a) => (
                              <tr key={a.uid} className="hover:bg-muted/10 transition-colors group">
                                <td className="px-4 py-3 font-medium text-white/80">
                                  {a.reason}
                                </td>
                                <td className="px-4 py-3 font-mono opacity-60">{a.uid.slice(0, 12)}...</td>
                                <td className="px-4 py-3 opacity-40">{new Date(a.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="sm" variant="glow" 
                                    className="h-6 px-3 text-[8px] font-black uppercase tracking-widest gap-1"
                                    onClick={() => handleUnbanUser(a.uid)}
                                  >
                                    <ShieldCheck className="h-2.5 w-2.5" /> Unban User
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={derivedMetrics.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid vertical={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} />
                      <XAxis 
                        dataKey="date" axisLine={false} tickLine={false} 
                        tick={{ fill: "currentColor", fontSize: 8, opacity: 0.4 }} 
                        dy={5}
                        tickFormatter={(v) => {
                          if (v === "BASE") return "";
                          if (v.includes(":00")) return v;
                          return v.split("-").slice(2).join("/");
                        }}
                      >
                         <Label value="Temporal Axis" offset={-10} position="insideBottom" style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.2, fill: 'currentColor' }} />
                      </XAxis>
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, opacity: 0.4 }}>
                         <Label value={derivedMetrics.chartConfig.unit} angle={-90} position="insideLeft" style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.2, fill: 'currentColor', textAnchor: 'middle' }} />
                      </YAxis>
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <Area type="monotone" dataKey="value" name={derivedMetrics.chartConfig.name} stroke="hsl(var(--primary))" strokeWidth={2.5} fill="hsl(var(--primary))" fillOpacity={0.05} connectNulls />
                      <Area type="monotone" dataKey="projected" name={derivedMetrics.chartConfig.threshold} stroke="#3b82f6" strokeWidth={1} fillOpacity={0} strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
            <Card className="border-none shadow-sm dark:bg-card/40 bg-white p-4 flex-1 flex flex-col items-center justify-center min-h-0">
              <h5 className="text-[8px] font-black uppercase tracking-widest opacity-30 w-full mb-2">Efficiency Gauge</h5>
              <div className="flex-1 w-full relative min-h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={derivedMetrics.gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="70%" outerRadius="95%" dataKey="value" stroke="none">
                    {derivedMetrics.gaugeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 left-0 right-0 text-center pb-1">
                   <span className="text-xl lg:text-2xl font-black block leading-none">{derivedMetrics.loadPercent.toFixed(1)}%</span>
                   <span className="text-[7px] font-black uppercase opacity-30">Load Integrity</span>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm dark:bg-card/40 bg-white p-4 flex-1 flex flex-col min-h-[120px]">
              <h5 className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2">Weekly Velocity</h5>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={60}>
                  <BarChart data={derivedMetrics.weeklyVelocity}>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="Visits" fill="#3B82F6" radius={1.5} barSize={8} key="bar-visits" />
                    <XAxis dataKey="uniqueKey" axisLine={false} tickLine={false} tick={{ fontSize: 7, opacity: 0.2 }} tickFormatter={(val) => {
                      const entry = derivedMetrics.weeklyVelocity.find(v => v.uniqueKey === val);
                      return entry ? entry.day : "";
                    }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-none shadow-sm dark:bg-card/40 bg-white p-4 flex-1 flex flex-col min-h-0">
              <h5 className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2">Sync Distribution</h5>
              <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
                <div className="grid grid-cols-7 gap-1 shrink-0 px-1">
                   {["M","T","W","T","F","S","S"].map((d, i) => <div key={`${d}-${i}`} className="text-[6px] font-black opacity-20 text-center">{d}</div>)}
                </div>
                {derivedMetrics.heatmap.map((row) => (
                  <div key={row.time} className="flex-1 grid grid-cols-7 gap-1 px-1">
                    {[0,1,2,3,4,5,6].map(idx => (
                        <HeatmapCell key={idx} value={row[`day_${idx}`] || 0} max={Math.max(...visitData.map(v => v.visits || 0)) || 10} />
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </div>

        {/* Footer info */}
        <div className="shrink-0 flex justify-between opacity-10 text-[6px] font-black uppercase tracking-[0.5em] pb-1">
           <p>LiveTalk Global Node Link // Secure</p>
           <p>Likhith Kami // Admin</p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
