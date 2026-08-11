import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { SharedFileItem, ShareRecord, ExpirationOption, DownloadLimitOption } from "../types";
import { createShareRecord, formatBytes } from "../services/fileSharingService";
import { Copy, Check, QrCode, Lock, Clock, Download, ShieldCheck, FileText, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: SharedFileItem[];
  onShareCreated?: (share: ShareRecord) => void;
}

export const ShareCodeModal: React.FC<ShareCodeModalProps> = ({
  isOpen,
  onClose,
  selectedFiles,
  onShareCreated,
}) => {
  const [expiration, setExpiration] = useState<ExpirationOption>("7d");
  const [downloadLimit, setDownloadLimit] = useState<DownloadLimitOption>("unlimited");
  const [password, setPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);

  const [createdShare, setCreatedShare] = useState<ShareRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = async () => {
    if (!selectedFiles.length) return;
    setIsGenerating(true);

    try {
      const share = await createShareRecord({
        files: selectedFiles,
        expirationOption: expiration,
        downloadLimitOption: downloadLimit,
        password: enablePassword ? password : "",
      });

      setCreatedShare(share);
      onShareCreated?.(share);
      toast.success(`Share Code generated: ${share.code}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create share code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareUrl = createdShare
    ? `${window.location.origin}/file-sharing?code=${createdShare.code}`
    : "";

  const handleCopyCode = async () => {
    if (!createdShare) return;
    try {
      await navigator.clipboard.writeText(createdShare.code);
      setCopiedCode(true);
      toast.success("Share code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code.");
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Direct share link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl || !createdShare) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LiveTalk File Share - Code ${createdShare.code}`,
          text: `Access ${selectedFiles.length} shared file(s) via LiveTalk with code: ${createdShare.code}`,
          url: shareUrl,
        });
        toast.success("Share menu opened!");
      } catch {
        /* share cancelled */
      }
    } else {
      handleCopyLink();
    }
  };

  const handleResetModal = () => {
    setCreatedShare(null);
    setShowQR(false);
    setPassword("");
    setEnablePassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetModal()}>
      <DialogContent className="max-w-lg w-[95vw] p-6 rounded-2xl bg-card border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary bg-primary/10">
              <ShieldCheck className="h-3 w-3" /> Secure Share Generator
            </Badge>
          </div>
          <DialogTitle className="text-xl font-display font-bold text-foreground">
            {createdShare ? "Share Code Generated ✓" : "Configure Share Options"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {createdShare
              ? "Give this 6-character code or share link to anyone to access your files."
              : `Creating a share code for ${selectedFiles.length} file(s).`}
          </DialogDescription>
        </DialogHeader>

        {/* Selected Files List */}
        <div className="py-2 space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Selected Files ({selectedFiles.length})
          </span>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {selectedFiles.map((f) => (
              <div key={f.id} className="p-2 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate text-foreground font-medium">{f.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 pl-2">
                  {formatBytes(f.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!createdShare ? (
          /* Options Configuration Form */
          <div className="space-y-4 pt-1">
            {/* Expiration selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Expiration Time
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(["1h", "1d", "7d", "30d", "never"] as ExpirationOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setExpiration(opt)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      expiration === opt
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {opt === "never" ? "Never" : opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Download limit selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 text-primary" /> Max Downloads
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(["unlimited", "1", "5", "10", "25"] as DownloadLimitOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDownloadLimit(opt)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      downloadLimit === opt
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {opt === "unlimited" ? "Unlimited" : `${opt} max`}
                  </button>
                ))}
              </div>
            </div>

            {/* Password protection option */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" /> Password Protection
                </label>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded accent-primary h-4 w-4"
                />
              </div>

              {enablePassword && (
                <Input
                  type="password"
                  placeholder="Enter access password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs rounded-xl"
                />
              )}
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-purple-600 font-extrabold text-white text-xs shadow-md shadow-primary/20 gap-2 mt-2"
            >
              <Sparkles className="h-4 w-4" /> Generate Share Code
            </Button>
          </div>
        ) : (
          /* Result Card with Code & QR */
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Share Code Box */}
            <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-card border border-primary/30 rounded-2xl p-5 text-center space-y-2 shadow-inner">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
                Your Share Code
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-foreground tracking-widest selection:bg-primary selection:text-white py-1">
                {createdShare.code}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground px-3.5 py-2"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? "Code Copied!" : "Copy Code"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleNativeShare}
                  className="rounded-xl text-xs font-bold gap-1.5 border border-primary/30 text-primary hover:bg-primary/10 px-3.5 py-2"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share via App
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="rounded-xl text-xs font-bold gap-1.5 border-border/60 px-3 py-2"
                >
                  <QrCode className="h-3.5 w-3.5" /> {showQR ? "Hide QR" : "QR"}
                </Button>
              </div>
            </div>

            {/* QR Code Display */}
            {showQR && (
              <div className="flex flex-col items-center justify-center p-4 bg-background rounded-2xl border border-border/70 text-center space-y-2 animate-fade-in">
                <QRCodeSVG value={shareUrl} size={150} level="M" includeMargin />
                <p className="text-[11px] text-muted-foreground font-medium">Scan to access shared file(s)</p>
              </div>
            )}

            {/* Share Link Input Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Direct Share Link
              </span>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs font-mono rounded-xl bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-xs font-semibold rounded-xl gap-1.5 shrink-0 border-border/60"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-secondary/40 border border-border/40 font-medium">
              <div>
                <span className="text-muted-foreground block text-[10px]">Expires</span>
                <span className="text-foreground">
                  {createdShare.expiresAt ? new Date(createdShare.expiresAt).toLocaleDateString() : "Never"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Max Downloads</span>
                <span className="text-foreground">
                  {createdShare.maxDownloads ? `${createdShare.maxDownloads} downloads` : "Unlimited"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={handleResetModal}
              className="w-full text-xs rounded-xl text-muted-foreground hover:text-foreground"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
