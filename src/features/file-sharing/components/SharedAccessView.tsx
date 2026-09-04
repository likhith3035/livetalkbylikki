import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SharedFileItem, ShareRecord } from "../types";
import {
  getShareRecordByCode, verifySharePassword, incrementDownloadCount, saveFiles, getSavedFiles
} from "../services/fileSharingService";
import { formatBytes } from "../utils/cryptoCode";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  CheckCircle2, AlertTriangle, Lock, Download, Eye, Clock, ShieldAlert,
  FileText, Sparkles, FolderArchive, ArrowLeft, RefreshCw, KeyRound, Copy, Check, EyeOff,
  Image as ImageIcon, Video, Music, FileCode, Archive, HardDriveDownload, Share2, Save
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

function renderCategoryIcon(category: string, mimeType: string) {
  if (category === "images" || mimeType.includes("image")) {
    return <ImageIcon className="h-5 w-5 text-purple-400" />;
  }
  if (category === "videos" || mimeType.includes("video")) {
    return <Video className="h-5 w-5 text-rose-400" />;
  }
  if (category === "audio" || mimeType.includes("audio")) {
    return <Music className="h-5 w-5 text-amber-400" />;
  }
  if (category === "archives" || mimeType.includes("zip") || mimeType.includes("tar")) {
    return <Archive className="h-5 w-5 text-emerald-400" />;
  }
  if (mimeType.includes("json") || mimeType.includes("code") || mimeType.includes("javascript") || mimeType.includes("text")) {
    return <FileCode className="h-5 w-5 text-blue-400" />;
  }
  return <FileText className="h-5 w-5 text-primary" />;
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
  const [showCredentialSecret, setShowCredentialSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

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

  const handleDownloadSingleFile = async (fileItem: SharedFileItem) => {
    if (!share) return;
    incrementDownloadCount(share.id);

    toast.info(`Preparing download for "${fileItem.name}"...`);
    try {
      const response = await fetch(fileItem.url);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success(`Successfully downloaded "${fileItem.name}"!`);
    } catch {
      const a = document.createElement("a");
      a.href = fileItem.url;
      a.download = fileItem.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Opening "${fileItem.name}"...`);
    }
  };

  const handleSaveToMyFiles = (fileItem: SharedFileItem) => {
    const existing = getSavedFiles();
    const alreadySaved = existing.some((f) => f.name === fileItem.name && f.size === fileItem.size);
    if (alreadySaved) {
      toast.info(`"${fileItem.name}" is already saved in your File Manager.`);
      return;
    }
    const newFile: SharedFileItem = {
      ...fileItem,
      id: "file-saved-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      uploadedAt: Date.now(),
    };
    saveFiles([newFile, ...existing]);
    toast.success(`Saved "${fileItem.name}" to your File Manager!`);
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
      a.download = `IncogTalk_Share_${share.code}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      toast.success(`ZIP Archive IncogTalk_Share_${share.code}.zip downloaded!`);
    } catch {
      toast.error("Failed to generate ZIP bundle. Falling back to individual downloads.");
      share.files.forEach((f, idx) => {
        setTimeout(() => {
          handleDownloadSingleFile(f);
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

  // Password Lock Screen
  if (share.hasPassword && !isPasswordUnlocked) {
    return (
      <div className="p-8 rounded-3xl bg-card border border-amber-500/30 text-center space-y-5 shadow-xl animate-fade-in">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto font-bold text-xl">
          <Lock className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-display font-bold text-foreground">
            Password Protected Share ({share.code})
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
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

  const isPasswordShare = share.shareType === "password" || !!share.credentialData;
  const isTextShare = share.shareType === "text" || !!share.textContent;
  const isMulti = share.files.length > 1;

  // Password Credential View
  if (isPasswordShare && share.credentialData) {
    const cred = share.credentialData;
    return (
      <div className="bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold text-xl shrink-0">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-display font-bold text-foreground">
                  {cred.title || "Shared Password / Credential"}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500">
                  Code: {share.code}
                </Badge>
                {share.isBurnAfterReading && (
                  <Badge variant="destructive" className="text-[10px] font-bold gap-1 bg-amber-600 text-white animate-pulse">
                    🔥 Self-Destruct / Burn After Reading
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] font-semibold gap-1 text-muted-foreground border border-border/50">
                  <Clock className="h-3 w-3 text-amber-500" />
                  {formatRemainingTime(share.expiresAt)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                End-to-End Encrypted Secret Credential • Shared {new Date(share.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {onBackToSearch && (
            <Button type="button" variant="outline" size="sm" onClick={onBackToSearch} className="text-xs rounded-xl gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
        </div>

        {/* Credentials Box */}
        <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-4">
          {/* Username Field */}
          {cred.username && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Username / Email / Identifier
              </span>
              <div className="flex gap-2 items-center">
                <Input readOnly value={cred.username} className="text-xs font-mono rounded-xl bg-background text-foreground" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(cred.username!, "Username")}
                  className="text-xs rounded-xl gap-1.5 border-border/60 shrink-0"
                >
                  {copiedField === "Username" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "Username" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {/* Password Field */}
          {cred.password && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Password / Secret Key
              </span>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    type={showCredentialSecret ? "text" : "password"}
                    value={cred.password}
                    className="text-xs font-mono rounded-xl bg-background text-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentialSecret(!showCredentialSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showCredentialSecret ? "Hide Password" : "Show Password"}
                  >
                    {showCredentialSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleCopyText(cred.password, "Password");
                    if (share.id) incrementDownloadCount(share.id);
                  }}
                  className="text-xs rounded-xl gap-1.5 bg-amber-500 text-white font-bold shrink-0 hover:bg-amber-600"
                >
                  {copiedField === "Password" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "Password" ? "Copied Secret!" : "Copy Secret"}
                </Button>
              </div>
            </div>
          )}

          {/* Notes Field */}
          {cred.notes && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Additional Notes
              </span>
              <div className="p-3 rounded-xl bg-background border border-border/50 text-xs font-mono text-foreground whitespace-pre-wrap">
                {cred.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Text Note View
  if (isTextShare && share.textContent) {
    const rawText = share.textContent;
    const noteTitle = share.files[0]?.name.replace(/\.txt$/i, "") || "Shared Text Note";
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const charCount = rawText.length;

    return (
      <div className="bg-card border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold text-xl shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-display font-bold text-foreground">
                  {noteTitle}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  Code: {share.code}
                </Badge>
                {share.isBurnAfterReading && (
                  <Badge variant="destructive" className="text-[10px] font-bold gap-1 bg-amber-600 text-white animate-pulse">
                    🔥 Self-Destruct / Burn After Reading
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] font-semibold gap-1 text-muted-foreground border border-border/50">
                  <Clock className="h-3 w-3 text-primary" />
                  {formatRemainingTime(share.expiresAt)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Shared Text Note • {charCount.toLocaleString()} chars • {wordCount.toLocaleString()} words
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                handleCopyText(rawText, "Text Note");
                if (share.id) incrementDownloadCount(share.id);
              }}
              className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 bg-primary text-primary-foreground font-bold"
            >
              {copiedField === "Text Note" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedField === "Text Note" ? "Copied!" : "Copy Text"}
            </Button>

            {share.files.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadSingleFile(share.files[0])}
                className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 border-border/60"
              >
                <Download className="h-3.5 w-3.5" /> Download .txt
              </Button>
            )}
          </div>
        </div>

        {/* Text Reader Box */}
        <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 font-mono text-xs leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words shadow-inner">
          {rawText}
        </div>
      </div>
    );
  }

  // Standard File List View
  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-xl shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-display font-bold text-foreground">
                Shared Files Received ✓
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-foreground">
                Code: {share.code}
              </Badge>
              {share.isBurnAfterReading && (
                <Badge variant="destructive" className="text-[10px] font-bold gap-1 bg-amber-600 text-white">
                  🔥 Burn After Reading
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] font-semibold gap-1 text-muted-foreground border border-border/50">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {formatRemainingTime(share.expiresAt)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Shared {new Date(share.createdAt).toLocaleDateString()} • {share.files.length} file(s) ready to download or preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isMulti && (
            <Button
              type="button"
              onClick={handleDownloadAll}
              className="w-full sm:w-auto text-xs font-bold rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <FolderArchive className="h-4 w-4" /> Download All ZIP ({share.files.length} Files)
            </Button>
          )}

          {onBackToSearch && (
            <Button type="button" variant="outline" size="sm" onClick={onBackToSearch} className="text-xs rounded-xl gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
        </div>
      </div>

      {/* Download limit indicator & progress bar */}
      {share.maxDownloads !== null && (
        <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground font-semibold text-[11px]">
            <span className="flex items-center gap-1.5 text-foreground font-bold">
              <Download className="h-3.5 w-3.5 text-primary" /> Download Quota & Self-Destruct
            </span>
            <span className="font-mono text-foreground font-bold">
              {share.downloadCount} of {share.maxDownloads} downloads used
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                share.isBurnAfterReading
                  ? "bg-amber-500 animate-pulse"
                  : "bg-gradient-to-r from-primary to-purple-600"
              }`}
              style={{ width: `${Math.min(100, (share.downloadCount / share.maxDownloads) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Files List Cards */}
      <div className="space-y-3">
        {share.files.map((fileItem) => (
          <div
            key={fileItem.id}
            className="p-5 rounded-3xl bg-card border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/50 transition-all shadow-md group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-secondary/60 border border-border/70 flex items-center justify-center shrink-0 shadow-xs">
                {renderCategoryIcon(fileItem.category, fileItem.mimeType)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {fileItem.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-0.5">
                  <span className="font-bold text-foreground">{formatBytes(fileItem.size)}</span>
                  <span>•</span>
                  <span className="capitalize">{fileItem.category}</span>
                </div>
              </div>
            </div>

            {/* Enhanced File Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewFile(fileItem)}
                className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 border-border/70 hover:bg-secondary"
                title="Preview file in browser"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSaveToMyFiles(fileItem)}
                className="flex-1 sm:flex-none text-xs rounded-xl gap-1.5 border-border/70 hover:bg-secondary"
                title="Save copy to your local File Manager"
              >
                <Save className="h-3.5 w-3.5 text-primary" /> Save
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleDownloadSingleFile(fileItem)}
                className="flex-1 sm:flex-none text-xs font-bold rounded-xl gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
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
