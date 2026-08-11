import React from "react";
import { SharedFileItem, FileCategory } from "../types";
import { formatBytes } from "../utils/cryptoCode";
import { HardDrive, Image, FileText, Video, Music, Archive, File } from "lucide-react";

interface StorageStatsCardProps {
  files: SharedFileItem[];
  maxStorageBytes?: number; // default 10 GB
}

const CATEGORY_CONFIG: Record<
  FileCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bgColor: string }
> = {
  images: { label: "Images", icon: Image, color: "text-emerald-500", bgColor: "bg-emerald-500" },
  videos: { label: "Videos", icon: Video, color: "text-purple-500", bgColor: "bg-purple-500" },
  documents: { label: "Documents", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500" },
  audio: { label: "Audio", icon: Music, color: "text-amber-500", bgColor: "bg-amber-500" },
  archives: { label: "Archives", icon: Archive, color: "text-rose-500", bgColor: "bg-rose-500" },
  other: { label: "Other Files", icon: File, color: "text-slate-400", bgColor: "bg-slate-400" },
};

export const StorageStatsCard: React.FC<StorageStatsCardProps> = ({
  files,
  maxStorageBytes = 10 * 1024 * 1024 * 1024, // 10 GB
}) => {
  const activeFiles = files.filter((f) => !f.isInTrash);
  const totalUsedBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);
  const usedPercent = Math.min(100, Math.round((totalUsedBytes / maxStorageBytes) * 100));

  const byCategory = activeFiles.reduce(
    (acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.size;
      return acc;
    },
    { images: 0, videos: 0, documents: 0, audio: 0, archives: 0, other: 0 } as Record<FileCategory, number>
  );

  return (
    <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-display font-bold text-foreground">Storage Allocation</h4>
            <p className="text-[11px] text-muted-foreground font-mono">
              {formatBytes(totalUsedBytes)} of {formatBytes(maxStorageBytes)} used ({usedPercent}%)
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20">
          {activeFiles.length} File(s)
        </span>
      </div>

      {/* Multi-Segment Categorized Progress Bar */}
      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5 p-0.5">
        {(Object.keys(CATEGORY_CONFIG) as FileCategory[]).map((cat) => {
          const bytes = byCategory[cat] || 0;
          if (bytes <= 0) return null;
          const pct = Math.max(1, (bytes / maxStorageBytes) * 100);
          return (
            <div
              key={cat}
              style={{ width: `${pct}%` }}
              className={`h-full rounded-full transition-all ${CATEGORY_CONFIG[cat].bgColor}`}
              title={`${CATEGORY_CONFIG[cat].label}: ${formatBytes(bytes)}`}
            />
          );
        })}
      </div>

      {/* Category breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {(Object.keys(CATEGORY_CONFIG) as FileCategory[]).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const bytes = byCategory[cat] || 0;

          return (
            <div
              key={cat}
              className="p-2.5 rounded-2xl bg-secondary/40 border border-border/40 flex items-center gap-2.5 text-xs"
            >
              <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground block truncate">{config.label}</span>
                <span className="font-mono font-semibold text-foreground text-[11px]">
                  {formatBytes(bytes)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
