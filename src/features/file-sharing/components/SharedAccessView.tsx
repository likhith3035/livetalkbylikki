import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SharedFileItem, ShareRecord } from "../types";
import {
  getShareRecordByCode, verifySharePassword, incrementDownloadCount
} from "../services/fileSharingService";
import { formatBytes } from "../utils/cryptoCode";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  CheckCircle2, AlertTriangle, Lock, Download, Eye, Clock, ShieldAlert,
  FileText, Sparkles, FolderArchive, ArrowLeft, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface SharedAccessViewProps {
  initialCode: string;
  onBackToSearch?: () => void;
}

function formatRemainingTime(expiresAt: number | null): string {
  if (!expiresAt) return "Never expires";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Expires in ${days}d ${hours}h`;
  if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
  return `Expires in ${minutes}m`;
}

export const SharedAccessView: React.FC<SharedAccessViewProps> = ({
  initialCode,
  onBackToSearch,
}) => {
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<SharedFileItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadShare() {
      setIsLoading(true);
      const res = await getShareRecordByCode(initialCode);

      if (isMounted) {
        setShare(res.share);
        setStatusMessage(res.statusMessage || null);
        setIsPasswordUnlocked(!res.share?.hasPassword);
        setIsLoading(false);
      }
    }
    loadShare();
    return () => {
      isMounted = false;
    };
  }, [initialCode]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!share) return;

    setPasswordError(null);
    const isCorrect = await verifySharePassword(share, passwordInput);
    if (isCorrect) {
      setIsPasswordUnlocked(true);
      toast.success("Password verified! Access granted.");
    } else {
      setPasswordError("Incorrect password. Please try again.");
      toast.error("Incorrect password.");
    }
  };

  const handleDownloadSingleFile = (fileItem: SharedFileItem) => {
    if (!share) return;
    incrementDownloadCount(share.id);

    const a = document.createElement("a");
    a.href = fileItem.url;
    a.download = fileItem.name;
    a.target = "_blank";
    a.click();
    toast.success(`Downloading ${fileItem.name}...`);
  };

  const handleDownloadAll = async () => {
    if (!share || !share.files.length) return;
    incrementDownloadCount(share.id);

    toast.info(`Packaging ${share.files.length} file(s) into ZIP archive...`);
    try {
      const zip = new JSZip();

      for (const fileItem of share.files) {
        const response = await fetch(fileItem.url);
        const blob = await response.blob();
        zip.file(fileItem.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `LiveTalk_Share_${share.code}.zip`;
      a.click();
      URL.revokeObjectURL(zipUrl);

      toast.success(`ZIP Archive LiveTalk_Share_${share.code}.zip downloaded!`);
    } catch {
      toast.error("Failed to generate ZIP bundle. Falling back to individual downloads.");
      share.files.forEach((f, idx) => {
        setTimeout(() => {
          const a = document.createElement("a");
          a.href = f.url;
          a.download = f.name;
          a.target = "_blank";
          a.click();
        }, idx * 500);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-card border border-border/80 text-center space-y-3 animate-pulse">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-sm font-semibold text-foreground">Validating Share Code ({initialCode})...</p>
      </div>
    );
  }

  if (!share || statusMessage) {
    return (
      <div className="p-8 rounded-3xl bg-card border border-border/80 text-center space-y-4 shadow-xl">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto text-2xl">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-display font-bold text-foreground">
            Share Code Result
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {statusMessage || "The requested share code could not be found or processed."}
          </p>
        </div>

        {onBackToSearch && (
          <Button
            type="button"
            variant="outline"
            onClick={onBackToSearch}
            className="text-xs rounded-xl gap-1.5 border-border/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Enter Another Code
          </Button>
        )}
      </div>
    );
  }

  // Password Protected Gate
  if (!isPasswordUnlocked) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-amber-500/30 text-center space-y-4 shadow-xl">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
          <Lock className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-display font-bold text-foreground">
            Password Protected Share ({share.code})
          </h3>
          <p className="text-xs text-muted-foreground">
            The uploader required a password to access these shared file(s).
          </p>
        </div>

        {passwordError && (
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-xs mx-auto">
          <Input
            type="password"
            placeholder="Enter password..."
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="text-xs rounded-xl text-center"
          />

          <Button type="submit" className="w-full text-xs font-bold rounded-xl gap-2 bg-primary">
            Unlock & Access Files
          </Button>
        </form>
      </div>
    );
  }

  const isMulti = share.files.length > 1;

  return (
    <div className="bg-card border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-xl shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-display font-bold text-foreground">
                File Found ✓
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Code: {share.code}
              </Badge>
              {share.isBurnAfterReading && (
                <Badge variant="destructive" className="text-[10px] font-bold gap-1 bg-amber-600 text-white animate-pulse">
                  🔥 Burn After Reading (Auto-deletes after 1st download)
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] font-semibold gap-1 text-muted-foreground border border-border/50">
                <Clock className="h-3 w-3 text-primary" />
                {formatRemainingTime(share.expiresAt)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Shared {new Date(share.createdAt).toLocaleDateString()} • {share.files.length} file(s) available
            </p>
          </div>
        </div>

        {isMulti && (
          <Button
            type="button"
            onClick={handleDownloadAll}
            className="w-full sm:w-auto text-xs font-bold rounded-xl gap-2 bg-primary text-primary-foreground"
          >
            <FolderArchive className="h-4 w-4" /> Download All ({share.files.length} Files)
          </Button>
        )}
      </div>

      {/* Files List Cards */}
      <div className="space-y-3">
        {share.files.map((fileItem) => (
          <div
            key={fileItem.id}
            className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {fileItem.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{formatBytes(fileItem.size)}</span>
                  <span>•</span>
                  <span className="capitalize">{fileItem.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewFile(fileItem)}
                className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 border-border/60"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleDownloadSingleFile(fileItem)}
                className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 bg-primary text-primary-foreground font-bold"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownloadSingleFile}
      />
    </div>
  );
};
