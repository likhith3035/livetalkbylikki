import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { ShareRecord, ExpirationOption, DownloadLimitOption } from "../types";
import { createPasswordShareRecord } from "../services/fileSharingService";
import { generateShareCode } from "../utils/cryptoCode";
import { KeyRound, Sparkles, Clock, Download, Lock, Copy, Check, QrCode, Share2, ShieldCheck, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SharePasswordCardProps {
  onShareCreated?: (share: ShareRecord) => void;
}

export const SharePasswordCard: React.FC<SharePasswordCardProps> = ({ onShareCreated }) => {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [notes, setNotes] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const [expiration, setExpiration] = useState<ExpirationOption>("7d");
  const [downloadLimit, setDownloadLimit] = useState<DownloadLimitOption>("burn"); // Default burn for secrets!
  const [accessPassword, setAccessPassword] = useState("");
  const [enableAccessPassword, setEnableAccessPassword] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [createdShare, setCreatedShare] = useState<ShareRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleGenerateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    const array = new Uint32Array(16);
    window.crypto.getRandomValues(array);
    let randPass = "";
    for (let i = 0; i < 16; i++) {
      randPass += chars[array[i] % chars.length];
    }
    setPasswordValue(randPass);
    setShowSecret(true);
    toast.success("Strong random secret password generated!");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValue && !username && !notes) {
      toast.error("Please provide a password, username, or secret note to share.");
      return;
    }

    setIsGenerating(true);
    try {
      const share = await createPasswordShareRecord({
        credentialData: {
          title: title.trim() || "Secret Credential",
          username: username.trim(),
          password: passwordValue,
          notes: notes.trim(),
        },
        expirationOption: expiration,
        downloadLimitOption: downloadLimit,
        password: enableAccessPassword ? accessPassword : "",
      });

      setCreatedShare(share);
      onShareCreated?.(share);
      toast.success(`Password Share Code generated: ${share.code}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create password share code.");
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
          title: `IncogTalk Secure Password Share - Code ${createdShare.code}`,
          text: `Access shared credentials securely via IncogTalk with code: ${createdShare.code}`,
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
    setUsername("");
    setPasswordValue("");
    setNotes("");
    setAccessPassword("");
    setEnableAccessPassword(false);
    setShowQR(false);
  };

  return (
    <div className="bg-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold text-xl shadow-inner">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-display font-bold text-foreground">Share Password & Secrets</h3>
              <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/30 text-amber-500 bg-amber-500/10">
                End-to-End Encrypted
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Securely share Wi-Fi passwords, API keys, credentials, or secret notes.
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
          {/* Service Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Service / Title</label>
            <Input
              type="text"
              placeholder="e.g. Home Wi-Fi, GitHub Token, Database Login..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-xl bg-background"
              required
            />
          </div>

          {/* Username / Identifier */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Username / Email / Identifier (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. admin@example.com or @username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-xs rounded-xl bg-background"
            />
          </div>

          {/* Password / Secret Input with Generator & Eye Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Password / Secret Key</label>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Generate Strong Password
              </button>
            </div>

            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                placeholder="Enter password, secret key, or token..."
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="text-xs font-mono rounded-xl bg-background pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Additional Secret Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Port 5432, Server US-East, Instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none leading-relaxed"
            />
          </div>

          {/* Expiration Options */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Expiration Time
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(["1h", "1d", "7d", "30d", "never"] as ExpirationOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpiration(opt)}
                  className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    expiration === opt
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
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
              <Download className="h-3.5 w-3.5 text-amber-500" /> Auto-Burn / View Limit
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
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm font-bold animate-pulse"
                        : "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  {opt === "unlimited" ? "Unlimited" : opt === "burn" ? "🔥 Burn (1x)" : `${opt} max`}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Access Password Protection */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" /> Require Access Password
              </label>
              <input
                type="checkbox"
                checked={enableAccessPassword}
                onChange={(e) => setEnableAccessPassword(e.target.checked)}
                className="rounded accent-amber-500 h-4 w-4"
              />
            </div>

            {enableAccessPassword && (
              <Input
                type="password"
                placeholder="Set custom code unlock password..."
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                className="text-xs rounded-xl bg-background"
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={isGenerating}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 font-extrabold text-white text-xs shadow-md shadow-amber-600/20 gap-2 mt-3"
          >
            <ShieldCheck className="h-4 w-4" /> Share Password & Get Code
          </Button>
        </form>
      ) : (
        /* Result Box */
        <div className="space-y-4 pt-1 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-card border border-amber-500/30 rounded-2xl p-5 text-center space-y-2 shadow-inner">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
              Password Share Code Generated
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold text-foreground tracking-widest selection:bg-amber-600 selection:text-white py-1">
              {createdShare.code}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                onClick={handleCopyCode}
                className="rounded-xl text-xs font-bold gap-1.5 bg-amber-600 text-white hover:bg-amber-700 px-3.5 py-2"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Code Copied!" : "Copy Code"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleNativeShare}
                className="rounded-xl text-xs font-bold gap-1.5 border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 px-3.5 py-2"
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
              <p className="text-[11px] text-muted-foreground font-medium">Scan to access shared credentials</p>
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
            Share Another Password
          </Button>
        </div>
      )}
    </div>
  );
};
