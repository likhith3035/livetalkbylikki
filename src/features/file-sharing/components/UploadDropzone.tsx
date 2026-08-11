import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SharedFileItem, UploadProgressItem } from "../types";
import { uploadFileWithProgress } from "../services/fileSharingService";
import { formatBytes, isExecutableFile } from "../utils/cryptoCode";
import { UploadCloud, File, AlertTriangle, CheckCircle, X, RefreshCw, Sparkles, FolderPlus } from "lucide-react";
import { toast } from "sonner";

interface UploadDropzoneProps {
  onUploadCompleted: (uploadedFiles: SharedFileItem[]) => void;
  folderId?: string | null;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadCompleted, folderId }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    if (!fileArray.length) return;

    // Filter out executable files with alert
    const safeFiles: File[] = [];
    const blockedNames: string[] = [];

    for (const f of fileArray) {
      if (isExecutableFile(f.name)) {
        blockedNames.push(f.name);
      } else {
        safeFiles.push(f);
      }
    }

    if (blockedNames.length > 0) {
      toast.error(`Security Alert: Executable files (${blockedNames.join(", ")}) were blocked from uploading.`);
    }

    if (!safeFiles.length) return;

    // Initialize progress items
    const newItems: UploadProgressItem[] = safeFiles.map((f) => ({
      id: "up-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      file: f,
      progress: 0,
      status: "uploading",
    }));

    setUploads((prev) => [...newItems, ...prev]);
    setIsUploadingGlobal(true);

    const completedFileItems: SharedFileItem[] = [];

    for (const item of newItems) {
      try {
        const result = await uploadFileWithProgress({
          file: item.file,
          folderId,
          onProgress: (percent) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === item.id ? { ...u, progress: percent } : u))
            );
          },
        });

        completedFileItems.push(result);
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: "completed", progress: 100 } : u))
        );
      } catch (err: any) {
        const msg = err.message || "Upload failed";
        toast.error(`Failed to upload ${item.file.name}: ${msg}`);
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: "error", errorMessage: msg } : u))
        );
      }
    }

    setIsUploadingGlobal(false);

    if (completedFileItems.length > 0) {
      toast.success(`Successfully uploaded ${completedFileItems.length} file(s)!`);
      onUploadCompleted(completedFileItems);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const cancelUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer relative overflow-hidden group ${
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.01] shadow-xl"
            : "border-border/80 hover:border-primary/50 bg-card/40 hover:bg-card/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
              Drag & Drop your files here
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Upload documents, images, videos, audio, or zip archives up to <span className="font-semibold text-foreground">100 MB</span> each.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl px-5 text-xs font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
          >
            <FolderPlus className="h-4 w-4" /> Browse Files
          </Button>

          <p className="text-[10px] text-muted-foreground/60">
            🔒 Executables (.exe, .bat, .cmd, .sh) are automatically blocked for safety.
          </p>
        </div>
      </div>

      {/* Progress Cards List */}
      {uploads.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Upload Status ({uploads.length})
            </span>
            {uploads.some((u) => u.status === "completed") && (
              <button
                onClick={() => setUploads((prev) => prev.filter((u) => u.status !== "completed"))}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Clear Completed
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <File className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-foreground truncate">{item.file.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>

                  {item.status === "uploading" && (
                    <div className="space-y-1">
                      <Progress value={item.progress} className="h-1.5 rounded-full" />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Uploading...</span>
                        <span>{item.progress}%</span>
                      </div>
                    </div>
                  )}

                  {item.status === "completed" && (
                    <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Upload Complete
                    </span>
                  )}

                  {item.status === "error" && (
                    <span className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {item.errorMessage || "Upload failed"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => cancelUpload(item.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
