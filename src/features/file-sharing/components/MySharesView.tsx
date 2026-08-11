import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareRecord } from "../types";
import { getSavedShares, disableShareCode, formatBytes } from "../services/fileSharingService";
import { Copy, Check, QrCode, Ban, Clock, Download, FileText, Share2, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export const MySharesView: React.FC = () => {
  const [shares, setShares] = useState<ShareRecord[]>(getSavedShares);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [qrShare, setQrShare] = useState<ShareRecord | null>(null);

  const handleRefresh = () => {
    setShares(getSavedShares());
  };

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      toast.success(`Share code ${code} copied!`);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      toast.error("Failed to copy code.");
    }
  };

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}/file-sharing?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Direct share link copied!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleDisableShare = (id: string, code: string) => {
    disableShareCode(id);
    handleRefresh();
    toast.info(`Share code ${code} has been disabled.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            My Active & Past Share Codes
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage your generated share codes, copy direct links, or revoke access anytime.
          </p>
        </div>
      </div>

      {shares.length > 0 ? (
        <div className="space-y-3">
          {shares.map((item) => {
            const isExpired = item.expiresAt && Date.now() > item.expiresAt;
            const isDisabled = item.status === "disabled" || !!item.disabledAt;
            const shareUrl = `${window.location.origin}/file-sharing?code=${item.code}`;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary font-mono font-extrabold text-base tracking-widest shrink-0">
                      {item.code}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {item.files.length} file(s) attached
                        </span>
                        {isDisabled ? (
                          <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                        ) : isExpired ? (
                          <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Expired</Badge>
                        ) : (
                          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        Created {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(item.code, item.id)}
                      className="text-xs rounded-xl gap-1.5 border-border/60"
                    >
                      {copiedCodeId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Code
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(item.code)}
                      className="text-xs rounded-xl gap-1.5 border-border/60"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Copy Link
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQrShare(qrShare?.id === item.id ? null : item)}
                      className="text-xs rounded-xl border-border/60"
                      title="Show QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>

                    {!isDisabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableShare(item.id, item.code)}
                        className="text-xs rounded-xl text-destructive hover:bg-destructive/10"
                        title="Disable Share Code"
                      >
                        <Ban className="h-3.5 w-3.5" /> Disable
                      </Button>
                    )}
                  </div>
                </div>

                {/* QR Code expansion */}
                {qrShare?.id === item.id && (
                  <div className="p-4 bg-background rounded-2xl border border-border/70 text-center space-y-2 animate-fade-in flex flex-col items-center">
                    <QRCodeSVG value={shareUrl} size={130} level="M" includeMargin />
                    <p className="text-[11px] font-mono text-muted-foreground">{shareUrl}</p>
                  </div>
                )}

                {/* Files attached summary */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Shared Contents
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.files.map((f) => (
                      <span key={f.id} className="px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/40 text-[11px] font-medium text-foreground flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-primary" /> {f.name} ({formatBytes(f.size)})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Analytics */}
                <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-2xl bg-secondary/30 border border-border/30 font-medium">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Downloads</span>
                    <span className="text-foreground font-mono font-bold">
                      {item.downloadCount} / {item.maxDownloads ?? "∞"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Expiration</span>
                    <span className="text-foreground">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Security</span>
                    <span className="text-foreground">
                      {item.hasPassword ? "🔒 Password Protected" : "Public Code"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-card border border-border/80 text-center space-y-3">
          <Share2 className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h4 className="text-base font-display font-bold text-foreground">No Active Shares Yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your generated share codes and links will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
