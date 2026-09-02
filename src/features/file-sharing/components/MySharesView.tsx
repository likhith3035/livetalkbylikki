import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShareRecord } from "../types";
import {
  getSavedShares,
  disableShareCode,
  deleteShareRecord,
  deleteAllShares,
  formatBytes,
} from "../services/fileSharingService";
import {
  Copy,
  Check,
  QrCode,
  Ban,
  Clock,
  Download,
  FileText,
  Share2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Lock,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const MySharesView: React.FC = () => {
  const [shares, setShares] = useState<ShareRecord[]>(getSavedShares);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "files" | "text" | "password" | "active" | "expired">("all");
  
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [qrShare, setQrShare] = useState<ShareRecord | null>(null);
  
  // Confirmation state
  const [deleteTargetShare, setDeleteTargetShare] = useState<ShareRecord | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

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

  const handleDisableShare = async (id: string, code: string) => {
    await disableShareCode(id);
    handleRefresh();
    toast.info(`Share code ${code} has been revoked.`);
  };

  const handleDeleteShare = async () => {
    if (!deleteTargetShare) return;
    const { id, code } = deleteTargetShare;
    await deleteShareRecord(id, code);
    setDeleteTargetShare(null);
    handleRefresh();
    toast.success(`Share code ${code} permanently deleted.`);
  };

  const handleDeleteAllShares = async () => {
    await deleteAllShares();
    setShowDeleteAllDialog(false);
    handleRefresh();
    toast.success("All share history has been cleared.");
  };

  // Filtered & Searched Share Records
  const filteredShares = useMemo(() => {
    return shares.filter((item) => {
      const isExpired = item.expiresAt && Date.now() > item.expiresAt;
      const isDisabled = item.status === "disabled" || !!item.disabledAt;
      const isBurned = item.status === "burned";

      // 1. Filter Tab
      if (filterTab === "files" && item.shareType !== "file" && item.files.length === 0) return false;
      if (filterTab === "text" && item.shareType !== "text" && !item.textContent) return false;
      if (filterTab === "password" && item.shareType !== "password" && !item.credentialData) return false;
      if (filterTab === "active" && (isDisabled || isExpired || isBurned)) return false;
      if (filterTab === "expired" && (!isExpired && !isDisabled && !isBurned)) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.credentialData?.title?.toLowerCase().includes(q);
        const matchText = item.textContent?.toLowerCase().includes(q);
        const matchFiles = item.files.some((f) => f.name.toLowerCase().includes(q));
        return matchCode || matchTitle || matchText || matchFiles;
      }

      return true;
    });
  }, [shares, filterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> My Share History ({shares.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage, copy links, or permanently revoke generated share codes.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs rounded-xl gap-1.5 border-border/60"
            title="Refresh List"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>

          {shares.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="text-xs rounded-xl gap-1.5 font-bold shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      {shares.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search code, text, or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9 bg-card border-border/70"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border/70 overflow-x-auto w-full sm:w-auto">
            {(
              [
                { id: "all", label: "All" },
                { id: "files", label: "📁 Files" },
                { id: "text", label: "📝 Text" },
                { id: "password", label: "🔑 Passwords" },
                { id: "active", label: "Active" },
                { id: "expired", label: "Expired/Revoked" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                  filterTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Share Cards List */}
      {filteredShares.length > 0 ? (
        <div className="space-y-3">
          {filteredShares.map((item) => {
            const isExpired = item.expiresAt && Date.now() > item.expiresAt;
            const isDisabled = item.status === "disabled" || !!item.disabledAt;
            const isBurned = item.status === "burned";
            const shareUrl = `${window.location.origin}/file-sharing?code=${item.code}`;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-card border border-border/80 shadow-md space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 text-foreground font-mono font-bold text-base tracking-widest shrink-0">
                      {item.code}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {item.shareType === "password"
                            ? "🔑 Password Credential"
                            : item.shareType === "text"
                            ? "📝 Text Note"
                            : `${item.files.length} file(s) attached`}
                        </span>
                        {item.shareType === "password" && (
                          <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                            Secret
                          </Badge>
                        )}
                        {item.shareType === "text" && (
                          <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30">
                            Text Note
                          </Badge>
                        )}
                        {isDisabled ? (
                          <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                        ) : isBurned ? (
                          <Badge variant="destructive" className="text-[10px] bg-amber-600 text-white">Burned</Badge>
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

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(item.code, item.id)}
                      className="text-xs rounded-xl gap-1.5 border-border/60"
                    >
                      {copiedCodeId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Code
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(item.code)}
                      className="text-xs rounded-xl gap-1.5 border-border/60"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Link
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

                    {!isDisabled && !isBurned && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableShare(item.id, item.code)}
                        className="text-xs rounded-xl text-amber-500 hover:bg-amber-500/10"
                        title="Revoke Share Code"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetShare(item)}
                      className="text-xs rounded-xl text-destructive hover:bg-destructive/10"
                      title="Delete Share Code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
                    {item.credentialData?.title && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-500 flex items-center gap-1.5">
                        <Lock className="h-3 w-3" /> {item.credentialData.title}
                      </span>
                    )}
                    {item.textContent && (
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] font-semibold text-blue-500 flex items-center gap-1.5 truncate max-w-xs">
                        <FileText className="h-3 w-3" /> {item.textContent.slice(0, 40)}...
                      </span>
                    )}
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
          <h4 className="text-base font-display font-bold text-foreground">No Matching Shares</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || filterTab !== "all"
              ? "No share codes match your current filter or search criteria."
              : "Your generated share codes and links will appear here."}
          </p>
        </div>
      )}

      {/* Delete Single Share Confirmation Dialog */}
      <AlertDialog open={!!deleteTargetShare} onOpenChange={(open) => !open && setDeleteTargetShare(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Share Code ({deleteTargetShare?.code})?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently delete this share code and revoke remote access on all devices. Recipients will no longer be able to download or view these contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShare} className="rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Shares Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Clear All Share History?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently delete all {shares.length} generated share codes and revoke access across all devices. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllShares} className="rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Shares
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
