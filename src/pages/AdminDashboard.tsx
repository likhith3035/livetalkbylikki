import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell
} from "recharts";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Users, MousePointer2, TrendingUp, 
  Calendar, Activity, ShieldCheck, Zap, Globe, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f1a] border border-primary/20 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
        <p className="text-sm font-bold text-primary">
          {payload[0].value.toLocaleString()} <span className="text-[10px] text-muted-foreground ml-1">Visitors</span>
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [visitData, setVisitData] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const visitsRef = ref(db, "analytics/daily_visits");
    const unsubscribeVisits = onValue(visitsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.entries(data)
          .map(([date, count]) => ({ date, visits: count }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-14);
        setVisitData(formattedData);
      }
      setLoading(false);
    });

    const presenceRef = ref(db, "presence");
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        setOnlineCount(Object.keys(snapshot.val()).length);
      } else {
        setOnlineCount(0);
      }
    });

    return () => {
      unsubscribeVisits();
      unsubscribePresence();
    };
  }, []);

  const totalVisits = visitData.reduce((sum, day) => sum + (day.visits || 0), 0);
  const averageVisits = visitData.length > 0 ? Math.round(totalVisits / visitData.length) : 0;

  return (
    <div className="min-h-screen bg-[#030303] text-[#f0f0f0] p-4 sm:p-8 lg:p-12 font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8"
        >
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="hover:bg-white/5 rounded-full border border-white/5 backdrop-blur-sm group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <ShieldCheck className="h-3 w-3" /> Admin Controls
              </div>
            </div>
            <h1 className="text-4xl xs:text-5xl lg:text-6xl font-black font-display tracking-tight text-white">
              Insight <span className="text-primary italic">Analytics</span>
            </h1>
            <p className="text-muted-foreground/60 mt-4 max-w-md text-sm font-medium leading-relaxed">
              Deep-dive into your platform's growth and user flow with real-time telemetry.
            </p>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-8 py-5 rounded-[2rem] backdrop-blur-xl shadow-2xl relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-online opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-online"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none mb-1">Live Echoes</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{onlineCount} Sessions Connected</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Total Visits", value: totalVisits, icon: MousePointer2, color: "primary", trend: "Live Tracking" },
            { label: "Daily Avg", value: averageVisits, icon: Zap, color: "accent", trend: "Stability" },
            { label: "Live Reach", value: onlineCount, icon: Globe, color: "online", trend: "Global" },
            { label: "Platform Status", value: "Active", icon: Activity, color: "online", trend: "Firebase OK" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden hover:border-white/20 transition-all group rounded-3xl h-full shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl bg-${stat.color}/10 border border-${stat.color}/20 group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40">{stat.trend}</div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-tighter">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  Velocity Metrics
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">Visitor density over the last 14 solar days.</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rolling Window</span>
              </div>
            </div>
            
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#444" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.split('-').slice(2).join('/')}
                    dy={18}
                  />
                  <YAxis 
                    stroke="#444" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#gradientPrimary)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-accent" />
                Momentum
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">Daily relative performance.</p>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#444" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.split('-').slice(2).join('/')}
                    dy={18}
                  />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="visits" 
                    radius={[12, 12, 12, 12]}
                    animationDuration={1500}
                  >
                    {visitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === visitData.length - 1 ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-[.2em] mb-2 font-bold">
                  <span>Growth Velocity</span>
                  <span className="text-primary">+12.4%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground"
        >
          // LiveTalk Intelligent Telemetry System v2.0 //
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
