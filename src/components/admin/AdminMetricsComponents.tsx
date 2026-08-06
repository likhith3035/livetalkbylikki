import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, LucideIcon } from "lucide-react";

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; dataKey?: string; value?: number; color?: string }>;
  label?: string;
  isDark?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 border ${isDark ? "bg-black/90 border-white/15 text-white" : "bg-white/95 border-black/10 text-slate-900 shadow-xl"}`}>
        <p className="text-[11px] text-muted-foreground font-bold mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
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

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
  data?: Array<{ value: number }>;
  trend?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, colorClass, data, trend }) => {
  const isUp = trend !== undefined && trend >= 0;
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
            {data && (
              <div className="h-10 w-24 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.12} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const HeatmapCell: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const intensity = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div 
      className="w-full aspect-square rounded-md transition-all hover:scale-125 cursor-pointer shadow-sm" 
      style={{ backgroundColor: `hsl(265 85% 60% / ${Math.max(0.1, intensity * 0.85)})` }}
      title={`${value} requests`}
    />
  );
};
