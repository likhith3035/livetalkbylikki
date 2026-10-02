import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";
import {
  BeamSession, BeamTransferItem, SharedFileItem
} from "../types";
import {
  createBeamSession,
  listenBeamSession,
  sendBeamTransfer,
  burnSecretInBeam,
  closeBeamSession,
  uploadBeamFile,
  extendBeamSession,
  toggleSessionApproval,
  updateTransferApprovalStatus,
  getDeviceSummary,
  getOrCreateDeviceId
} from "../services/beamService";
import { getSavedFiles, saveFiles, formatBytes } from "../services/fileSharingService";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  QrCode, Copy, Check, Sparkles, Smartphone, Laptop, Tablet, ArrowRight,
  Download, Eye, EyeOff, FileText, Send, UploadCloud, RefreshCw, X,
  ShieldCheck, Flame, ExternalLink, HardDrive, CheckCircle2, Wifi,
  Clock, FolderArchive, Mic, Volume2, ShieldAlert, AlertTriangle, Users
} from "lucide-react";
import { toast } from "sonner";
import { sounds, haptics } from "@/lib/sounds";

interface LiveBeamReceiverViewProps {
  onClose?: () => void;
}

export const LiveBeamReceiverView: React.FC<LiveBeamReceiverViewProps> = ({ onClose }) => {
  const [session, setSession] = useState<BeamSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Time remaining in session
  const [timeLeftSec, setTimeLeftSec] = useState<number>(15 * 60);

  // File preview modal state
  const [previewFile, setPreviewFile] = useState<SharedFileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Reverse beam state (sending from receiver back to sender)
  const [reverseText, setReverseText] = useState("");
  const [isUploadingReverseFile, setIsUploadingReverseFile] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  const processedTransferIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Beam Session
  useEffect(() => {
    let cleanupListener: (() => void) | null = null;

    const init = async () => {
      try {
        setIsInitializing(true);
        const newSession = await createBeamSession();
        setSession(newSession);

        cleanupListener = listenBeamSession(newSession.code, (updatedSession) => {
          if (!updatedSession) return;

          setSession((prev) => {
            // Check if sender just connected
            if (!prev?.sender && updatedSession.sender) {
              sounds.connected();
              haptics.vibrate([100, 50, 100]);
              toast.success(`🎉 ${updatedSession.sender.name} paired with your screen!`);
            }
            return updatedSession;
          });

          // Check for incoming transfers
          if (updatedSession.transfers) {
            const transfers = Object.values(updatedSession.transfers);
            const myDeviceId = getOrCreateDeviceId();

            transfers.forEach((item) => {
              if (item.senderId !== myDeviceId && !processedTransferIdsRef.current.has(item.id)) {
                processedTransferIdsRef.current.add(item.id);
                sounds.messageReceived();
                haptics.vibrate(80);

                if (updatedSession.requireApproval && item.status === "pending") {
                  toast.info(`🔔 Incoming transfer from ${item.senderName} waiting for your approval.`);
                  return;
                }

                toast.success(`📥 New ${item.type} beamed from ${item.senderName}!`);

                // Auto-save files to local library if accepted
                if (item.files && item.files.length > 0 && item.status !== "declined") {
                  try {
                    const currentFiles = getSavedFiles();
                    const newItems = item.files.filter((nf) => !currentFiles.some((cf) => cf.id === nf.id));
                    if (newItems.length > 0) {
                      saveFiles([...newItems, ...currentFiles]);
                    }
                  } catch {
                    /* ignore */
                  }

                  // Auto download if toggle enabled
                  if (autoDownload && item.status === "accepted") {
                    item.files.forEach((file) => {
                      if (file.url) {
                        const link = document.createElement("a");
                        link.href = file.url;
                        link.download = file.name;
                        link.target = "_blank";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    });
                  }
                }
              }
            });
          }
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to initialize Live Beam Drop.");
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      if (cleanupListener) cleanupListener();
    };
  }, [autoDownload]);

  // Session Expiry Countdown Interval
  useEffect(() => {
    if (!session?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining === 0 && session.status !== "closed") {
        setSession((prev) => prev ? { ...prev, status: "closed" } : null);
        toast.error("Live Beam Drop session expired for security.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  const shareUrl = session
    ? `${window.location.origin}/file-sharing?beam=${session.code}`
    : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Pairing link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleCopyCode = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.code);
      setCopiedCode(true);
      toast.success("Pairing code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code.");
    }
  };

  const handleExtend = async () => {
    if (!session) return;
    try {
      const newExp = await extendBeamSession(session.code, 15);
      setSession((prev) => prev ? { ...prev, expiresAt: newExp } : null);
      toast.success("Session extended by 15 minutes! ⏳");
    } catch {
      toast.error("Failed to extend session.");
    }
  };

  const handleToggleApprovalMode = async () => {
    if (!session) return;
    const nextVal = !session.requireApproval;
    try {
      await toggleSessionApproval(session.code, nextVal);
      setSession((prev) => prev ? { ...prev, requireApproval: nextVal } : null);
      if (nextVal) {
        toast.success("🛡️ Public Screen Protection Enabled! Incoming files will require your manual approval.");
      } else {
        toast.success("⚡ Auto-Accept Enabled! Incoming files appear on screen immediately.");
      }
    } catch {
      toast.error("Failed to update security mode.");
    }
  };

  const handleApprove = async (transferId: string) => {
    if (!session) return;
    await updateTransferApprovalStatus(session.code, transferId, "accepted");
    sounds.messageSent();
    toast.success("Transfer accepted & saved to screen!");
  };

  const handleDecline = async (transferId: string) => {
    if (!session) return;
    await updateTransferApprovalStatus(session.code, transferId, "declined");
    toast.info("Transfer declined.");
  };

  const handleInspectFile = (file: SharedFileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleRevealSecret = async (transferId: string, item: BeamTransferItem) => {
    setRevealedSecrets((prev) => ({ ...prev, [transferId]: true }));
    if (session && item.secretPayload?.burnAfterReading) {
      await burnSecretInBeam(session.code, transferId);
      toast.warning("🔥 Secret note has been burned after reading!");
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sounds.messageSent();
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  // 1-Click Download All as ZIP
  const handleDownloadAllZip = async () => {
    if (!session?.transfers) return;
    const allFiles: SharedFileItem[] = [];

    Object.values(session.transfers).forEach((tx) => {
      if (tx.status !== "declined" && tx.files?.length) {
        allFiles.push(...tx.files);
      }
    });

    if (allFiles.length === 0) {
      toast.error("No downloadable files in this session.");
      return;
    }

    setIsZipping(true);
    toast.info(`Packaging ${allFiles.length} file(s) into ZIP bundle...`);

    try {
      const zip = new JSZip();
      for (const item of allFiles) {
        if (!item.url) continue;
        const res = await fetch(item.url);
        const blob = await res.blob();
        zip.file(item.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `LiveBeam_Files_${session.code}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);

      sounds.messageSent();
      toast.success(`ZIP Archive LiveBeam_Files_${session.code}.zip downloaded!`);
    } catch (err: any) {
      toast.error("Failed to generate ZIP archive: " + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Reverse send file from Receiver back to Mobile Phone
  const handleReverseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session || !e.target.files?.length) return;
    const file = e.target.files[0];
    setIsUploadingReverseFile(true);

    try {
      const myDevice = getDeviceSummary();
      const myDeviceId = getOrCreateDeviceId();
      const uploaded = await uploadBeamFile(file);

      await sendBeamTransfer(session.code, {
        senderId: myDeviceId,
        senderName: myDevice.name,
        type: "files",
        status: "accepted",
        files: [uploaded],
        note: `Beamed back from ${myDevice.name}`,
      });

      sounds.messageSent();
      toast.success(`Sent "${file.name}" to ${session.sender?.name || "paired device"}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send file.");
    } finally {
      setIsUploadingReverseFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Reverse send text back to Mobile Phone
  const handleSendReverseText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !reverseText.trim()) return;

    try {
      const myDevice = getDeviceSummary();
      const myDeviceId = getOrCreateDeviceId();

      await sendBeamTransfer(session.code, {
        senderId: myDeviceId,
        senderName: myDevice.name,
        type: "text",
        status: "accepted",
        textContent: reverseText.trim(),
      });

      sounds.messageSent();
      setReverseText("");
      toast.success(`Message sent to ${session.sender?.name || "paired device"}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    }
  };

  const handleNewSession = async () => {
    if (session) {
      await closeBeamSession(session.code);
    }
    processedTransferIdsRef.current.clear();
    setIsInitializing(true);
    const newSession = await createBeamSession();
    setSession(newSession);
    setIsInitializing(false);
    toast.success("Generated fresh Live Beam QR Code!");
  };

  const transfersList = session?.transfers
    ? Object.values(session.transfers).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const totalFilesCount = transfersList.reduce(
    (acc, tx) => acc + (tx.status !== "declined" && tx.files ? tx.files.length : 0),
    0
  );

  const connectedSendersList = session?.senders
    ? Object.values(session.senders).filter((s) => s.isOnline !== false)
    : session?.sender ? [session.sender] : [];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-fade-in max-w-4xl mx-auto">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/40 text-primary flex items-center justify-center text-xl shadow-inner shrink-0">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-foreground">
                Live QR Drop (AirDrop Mode)
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10 px-2 py-0.5 animate-pulse">
                ⚡ Real-time Beam
              </Badge>

              {/* Timer Pill */}
              <Badge
                variant="outline"
                className={`text-[10px] font-mono px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors ${
                  timeLeftSec < 120
                    ? "border-destructive text-destructive bg-destructive/10 animate-pulse"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                onClick={handleExtend}
                title="Click to extend session by 15 minutes"
              >
                <Clock className="h-3 w-3" />
                <span>{formatTimer(timeLeftSec)}</span>
                <span className="text-[9px] underline font-sans ml-0.5">+15m</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan with any phone camera to instantly beam files, photos, voice notes, clipboard text, or secrets to this screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Public Screen Mode (Require Approval Toggle) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleApprovalMode}
            className={`rounded-xl text-xs gap-1.5 h-8 font-semibold ${
              session?.requireApproval
                ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Require your approval before displaying incoming beamed files"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {session?.requireApproval ? "Protection: On" : "Protection: Off"}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            disabled={isInitializing}
            className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8"
            title="Generate new QR session"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isInitializing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left is QR & Pairing Card, Right is Live Feed */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Code & Pairing Info */}
        <div className="md:col-span-5 flex flex-col items-center bg-secondary/40 border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm text-center">
          {/* Status Pill with Multi-Peer count */}
          <div className="w-full flex items-center justify-center">
            {connectedSendersList.length > 0 ? (
              <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 text-xs px-3 py-1 font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <Users className="h-3.5 w-3.5" />
                <span>
                  {connectedSendersList.length === 1
                    ? `Paired with ${connectedSendersList[0].name}`
                    : `${connectedSendersList.length} Devices Paired`}
                </span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
                <Wifi className="h-3 w-3 animate-pulse text-amber-500" />
                <span>Waiting for phone to scan...</span>
              </Badge>
            )}
          </div>

          {/* QR Code with Sonar Halo Animation */}
          <div className="relative group p-4 bg-white rounded-2xl shadow-xl border-4 border-primary/20 flex items-center justify-center transition-transform hover:scale-[1.02]">
            {session ? (
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                Generating session...
              </div>
            )}
          </div>

          {/* Pairing Code & Direct Link */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card border border-border/70 text-xs">
              <span className="text-muted-foreground font-medium">Pairing PIN:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-foreground tracking-widest text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                  {session?.code || "...."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-7 w-7 rounded-lg"
                  title="Copy PIN"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full rounded-xl text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Mobile Pairing Link"}</span>
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            💡 Point your phone camera at this QR code. No app or registration needed!
          </div>

          {/* Auto-download Toggle */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1 hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={autoDownload}
              onChange={(e) => setAutoDownload(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span>Auto-download incoming files</span>
          </label>
        </div>

        {/* Right Column: Live Stream of Incoming Items & Reverse Send */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Live Beamed Items ({transfersList.length})
            </h3>

            {/* 1-Click ZIP Download button when multiple files beamed */}
            {totalFilesCount >= 2 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isZipping}
                onClick={handleDownloadAllZip}
                className="rounded-xl text-[11px] h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10 font-bold"
              >
                <FolderArchive className="h-3.5 w-3.5" />
                <span>{isZipping ? "Packaging ZIP..." : `Download All ZIP (${totalFilesCount})`}</span>
              </Button>
            )}
          </div>

          {/* Activity Feed Box */}
          <div className="min-h-[260px] max-h-[380px] overflow-y-auto space-y-3 p-3 rounded-2xl bg-secondary/30 border border-border/70 scrollbar-thin">
            {transfersList.length === 0 ? (
              <div className="h-full py-12 flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Smartphone className="h-5 w-5 animate-bounce" />
                </div>
                <p className="text-xs font-medium text-foreground">Waiting for incoming beam...</p>
                <p className="text-[11px] max-w-xs">
                  Scan the QR code with your phone and select files, photos, voice notes, text, or secrets.
                </p>
              </div>
            ) : (
              transfersList.map((item) => {
                const isFromMe = item.senderId === getOrCreateDeviceId();
                const isSecret = item.type === "secret";
                const isRevealed = revealedSecrets[item.id] || !item.secretPayload?.burnAfterReading;
                const isPending = item.status === "pending";
                const isDeclined = item.status === "declined";

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all animate-fade-in space-y-2 ${
                      isDeclined
                        ? "bg-secondary/20 border-border/40 opacity-60"
                        : isPending
                        ? "bg-amber-500/10 border-amber-500/40 shadow-md"
                        : isFromMe
                        ? "bg-primary/5 border-primary/20 ml-6"
                        : "bg-card border-border/80 mr-2 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                          {item.type}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {isFromMe ? "You (This Screen)" : item.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>

                    {/* Pending Approval Gate Banner */}
                    {isPending && !isFromMe && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Incoming transfer requests your permission</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5"
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDecline(item.id)}
                            className="h-7 text-xs rounded-lg text-muted-foreground hover:text-destructive px-2"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Declined Notice */}
                    {isDeclined && (
                      <p className="text-[11px] text-muted-foreground italic">
                        This transfer was declined.
                      </p>
                    )}

                    {/* Content only rendered if not pending or declined */}
                    {!isPending && !isDeclined && (
                      <>
                        {/* Files Payload with Inspect/Preview */}
                        {item.files && item.files.length > 0 && (
                          <div className="space-y-2">
                            {item.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-secondary/50 border border-border/60 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {file.category === "images" && file.url ? (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      className="h-10 w-10 rounded-lg object-cover border border-border shrink-0 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => handleInspectFile(file)}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                                      <HardDrive className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <p className="font-semibold text-foreground truncate">{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleInspectFile(file)}
                                    className="h-8 rounded-lg text-xs gap-1 text-muted-foreground hover:text-foreground"
                                    title="Preview file"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Preview</span>
                                  </Button>

                                  {file.url && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const a = document.createElement("a");
                                        a.href = file.url;
                                        a.download = file.name;
                                        a.target = "_blank";
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        toast.success(`Downloading ${file.name}`);
                                      }}
                                      className="h-8 rounded-lg text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      <span>Download</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Voice Note Audio Payload */}
                        {item.type === "voice" && (item.voiceNoteUrl || item.files?.[0]?.url) && (
                          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                                <Mic className="h-4 w-4" /> Beamed Voice Note
                              </span>
                              {item.voiceDurationSec && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {formatTimer(item.voiceDurationSec)}
                                </span>
                              )}
                            </div>
                            <audio
                              controls
                              className="w-full h-8 rounded-lg"
                              src={item.voiceNoteUrl || item.files?.[0]?.url}
                            />
                          </div>
                        )}

                        {/* Camera Snap Photo Payload */}
                        {item.cameraPhotoUrl && (
                          <div className="space-y-2">
                            <div
                              onClick={() =>
                                handleInspectFile({
                                  id: item.id,
                                  name: "Live_Camera_Snap.jpg",
                                  size: 0,
                                  mimeType: "image/jpeg",
                                  category: "images",
                                  url: item.cameraPhotoUrl!,
                                  uploadedAt: item.timestamp,
                                })
                              }
                              className="relative rounded-xl overflow-hidden border border-border max-h-48 group cursor-pointer"
                            >
                              <img
                                src={item.cameraPhotoUrl}
                                alt="Camera Snap"
                                className="w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = item.cameraPhotoUrl!;
                                  a.download = `camera_snap_${Date.now()}.jpg`;
                                  a.target = "_blank";
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary"
                              >
                                <Download className="h-3 w-3" /> Download Photo
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Text / Note Payload */}
                        {item.textContent && (
                          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/60 text-xs font-mono break-words whitespace-pre-wrap relative group">
                            <p className="text-foreground">{item.textContent}</p>
                            <div className="flex items-center justify-end gap-2 pt-2">
                              {item.textContent.startsWith("http") && (
                                <a
                                  href={item.textContent}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" /> Open Link
                                </a>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyText(item.textContent!)}
                                className="h-7 text-[11px] rounded-lg gap-1 text-primary hover:bg-primary/10"
                              >
                                <Copy className="h-3 w-3" /> Copy
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Secret Credential Payload */}
                        {isSecret && item.secretPayload && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4" /> {item.secretPayload.title || "Secret Credential"}
                              </span>
                              {item.secretPayload.burnAfterReading && (
                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 flex items-center gap-1">
                                  <Flame className="h-2.5 w-2.5" /> Burns on view
                                </Badge>
                              )}
                            </div>

                            {item.secretPayload.hasBeenViewed && !revealedSecrets[item.id] ? (
                              <div className="p-2 rounded-lg bg-black/40 text-muted-foreground text-center font-mono">
                                🔥 This secret has burned and is no longer accessible.
                              </div>
                            ) : isRevealed ? (
                              <div className="p-2 rounded-lg bg-black/40 text-foreground font-mono flex items-center justify-between gap-2">
                                <span className="select-all break-all">{item.secretPayload.secret}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyText(item.secretPayload!.secret)}
                                  className="h-7 w-7 rounded-lg shrink-0"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevealSecret(item.id, item)}
                                className="w-full rounded-xl text-xs gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-bold"
                              >
                                <Eye className="h-3.5 w-3.5" /> Reveal Secret
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Reverse Beam (Send back to Phone) */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-primary" /> Beam Back to {connectedSendersList[0]?.name || "Phone"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleReverseFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={connectedSendersList.length === 0 || isUploadingReverseFile}
                className="h-7 text-[11px] rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <UploadCloud className="h-3 w-3" />
                <span>{isUploadingReverseFile ? "Sending..." : "Send File to Phone"}</span>
              </Button>
            </div>

            <form onSubmit={handleSendReverseText} className="flex gap-2">
              <Input
                value={reverseText}
                onChange={(e) => setReverseText(e.target.value)}
                placeholder={connectedSendersList.length > 0 ? `Send a quick link or note to ${connectedSendersList[0].name}...` : "Pair device to send..."}
                disabled={connectedSendersList.length === 0}
                className="h-9 rounded-xl text-xs bg-secondary/40"
              />
              <Button
                type="submit"
                size="sm"
                disabled={connectedSendersList.length === 0 || !reverseText.trim()}
                className="h-9 rounded-xl px-3 text-xs bg-primary text-primary-foreground font-bold shadow-sm"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewFile(null);
        }}
        file={previewFile}
      />
    </div>
  );
};
