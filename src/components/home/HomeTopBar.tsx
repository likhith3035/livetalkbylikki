import React from "react";
import { Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HomeTopBarProps {
  onlineCount: number;
  onOpenSearch: () => void;
  className?: string;
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({
  onlineCount,
  onOpenSearch,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "w-full flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 relative z-20 pointer-events-auto",
        className
      )}
    >
      {/* Left spacer to center the online badge, or mobile logo */}
      <div className="hidden md:flex flex-1 items-center" />

      {/* Floating Center Online Badge with Avatar Stack */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => navigate("/chat")}
          className="group flex items-center gap-2.5 rounded-full border border-stone-200/90 dark:border-white/10 bg-white/90 dark:bg-[#12141a]/85 backdrop-blur-xl px-4 py-1.5 text-xs font-semibold text-stone-800 dark:text-foreground shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/40 hover:border-amber-500/40 hover:bg-stone-50 dark:hover:bg-[#181a22]/90 transition-all cursor-pointer"
          title="Click to start chatting with online users"
        >
          {/* Green Online Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </span>

          <span className="text-stone-800 dark:text-white font-semibold text-[12px] sm:text-xs tracking-tight">
            {onlineCount.toLocaleString()} online now
          </span>

          {/* Overlapping User Avatar Stack */}
          <div className="flex items-center -space-x-2 shrink-0 ml-1">
            <div className="w-5 h-5 rounded-full ring-1.5 ring-white dark:ring-[#12141a] overflow-hidden bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-[9px] font-bold text-black shadow-sm">
              <span>🧑</span>
            </div>
            <div className="w-5 h-5 rounded-full ring-1.5 ring-white dark:ring-[#12141a] overflow-hidden bg-gradient-to-tr from-stone-700 to-stone-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
              <span>🧔</span>
            </div>
            <div className="w-5 h-5 rounded-full ring-1.5 ring-white dark:ring-[#12141a] overflow-hidden bg-gradient-to-tr from-amber-800 to-amber-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
              <span>👱</span>
            </div>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:translate-x-0.5 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-all ml-0.5" />
        </button>
      </div>

      {/* Right Search Input Box */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onOpenSearch}
          className="group flex items-center justify-between gap-3 w-52 sm:w-64 h-9 sm:h-10 px-3.5 rounded-full border border-stone-200/90 dark:border-white/10 bg-white/90 dark:bg-[#12141a]/85 backdrop-blur-xl text-stone-500 hover:text-stone-900 dark:text-muted-foreground dark:hover:text-foreground hover:border-amber-500/40 hover:bg-stone-50 dark:hover:bg-[#181a22]/90 shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/40 transition-all text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 dark:text-muted-foreground dark:group-hover:text-amber-400 transition-colors shrink-0" />
            <span className="truncate">Search features...</span>
          </div>

          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-500 dark:text-muted-foreground/80 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 shrink-0">
            Ctrl K
          </kbd>
        </button>
      </div>
    </header>
  );
};

export default HomeTopBar;
