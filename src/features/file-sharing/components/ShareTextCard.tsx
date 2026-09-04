import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { ShareRecord, ExpirationOption, DownloadLimitOption } from "../types";
import { createTextShareRecord } from "../services/fileSharingService";
import { FileText, Sparkles, Clock, Download, Lock, Copy, Check, QrCode, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ShareTextCardProps {
  onShareCreated?: (share: ShareRecord) => void;
}

export const ShareTextCard: React.FC<ShareTextCardProps> = ({ onShareCreated }) => {
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [expiration, setExpiration] = useState<ExpirationOption>("7d");
  const [downloadLimit, setDownloadLimit] = useState<DownloadLimitOption>("unlimited");
  const [password, setPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [createdShare, setCreatedShare] = useState<ShareRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      toast.error("Please enter text or notes to share.");
      return;
    }

    setIsGenerating(true);
    try {
      const share = await createTextShareRecord({
        title: title.trim() || "Shared Text Note",
        textContent: textContent.trim(),
        expirationOption: expiration,
        downloadLimitOption: downloadLimit,
        password: enablePassword ? password : "",
      });

      setCreatedShare(share);
      onShareCreated?.(share);
      toast.success(`Text Share Code generated: ${share.code}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create text share code.");
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
          title: `IncogTalk Text Share - Code ${createdShare.code}`,
          text: `Access shared text note via IncogTalk with code: ${createdShare.code}`,
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

  const handleReset = () => {
    setCreatedShare(null);
    setTitle("");
    setTextContent("");
    setPassword("");
    setEnablePassword(false);
    setShowQR(false);
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold text-xl shadow-inner">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-display font-bold text-foreground">Share Text & Notes</h3>
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                Instant Code
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Share raw text, code snippets, or notes with custom security options.
            </p>
          </div>
        </div>

        {createdShare && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="text-xs rounded-xl">
            Create Another
          </Button>
        )}
      </div>

      {!createdShare ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Note Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Title / Subject (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. Project Notes, API Endpoints, Recipe..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-xl bg-background"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Text / Code Content</label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {charCount} chars • {wordCount} words
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="Paste or write your text here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-background border border-border/80 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed"
              required
            />
          </div>

          {/* Expiration Options */}
          <div className="space-y-1.5 pt-1">
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

          {/* Max Views / Burn */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-primary" /> Access Limit / Self-Destruct
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(["unlimited", "1", "5", "10", "25", "burn"] as DownloadLimitOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDownloadLimit(opt)}
                  className={`py-1.5 text-[11px] font-semibold rounded-xl border transition-all ${
                    downloadLimit === opt
                      ? opt === "burn"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm font-bold"
                        : "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  {opt === "unlimited" ? "Unlimited" : opt === "burn" ? "🔥 Burn (1x)" : `${opt} max`}
                </button>
              ))}
            </div>
          </div>

          {/* Password Protection */}
          <div className="space-y-2 pt-2 border-t border-border/40">
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
                placeholder="Set access password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs rounded-xl bg-background"
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={isGenerating}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-purple-600 font-extrabold text-white text-xs shadow-md shadow-primary/20 gap-2 mt-3"
          >
            <Sparkles className="h-4 w-4" /> Share Text & Get Code
          </Button>
        </form>
      ) : (
        /* Result Box */
        <div className="space-y-4 pt-1 animate-fade-in">
          <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-card border border-primary/30 rounded-2xl p-5 text-center space-y-2 shadow-inner">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
              Text Share Code Generated
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

          {showQR && (
            <div className="flex flex-col items-center justify-center p-4 bg-background rounded-2xl border border-border/70 text-center space-y-2 animate-fade-in">
              <QRCodeSVG value={shareUrl} size={150} level="M" includeMargin />
              <p className="text-[11px] text-muted-foreground font-medium">Scan to access shared text note</p>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Direct Share Link
            </span>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs font-mono rounded-xl bg-background" />
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

          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="w-full text-xs rounded-xl text-muted-foreground hover:text-foreground"
          >
            Share Another Text
          </Button>
        </div>
      )}
    </div>
  );
};
