import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import QrScanner from "@/components/chat/QrScanner";
import { UploadDropzone } from "./UploadDropzone";
import { EnterShareCodeCard } from "./EnterShareCodeCard";
import { SharedAccessView } from "./SharedAccessView";
import { ShareCodeModal } from "./ShareCodeModal";
import { FileManagerView } from "./FileManagerView";
import { MySharesView } from "./MySharesView";
import { StorageStatsCard } from "./StorageStatsCard";
import { ShareTextCard } from "./ShareTextCard";
import { SharePasswordCard } from "./SharePasswordCard";
import { LiveBeamReceiverView } from "./LiveBeamReceiverView";
import { LiveBeamSenderView } from "./LiveBeamSenderView";
import { SharedFileItem, ShareRecord } from "../types";
import {
  Share2, KeyRound, UploadCloud, FolderOpen, ShieldCheck, Sparkles,
  ArrowRight, HardDrive, Lock, ArrowLeft, Home, QrCode, Camera, FileText, Wifi, Smartphone
} from "lucide-react";
import { getSavedFiles, purgeExpiredShares } from "../services/fileSharingService";
import { toast } from "sonner";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";

export const FileSharingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();

  useSEO({
    title: "Encrypted File Sharing & 1-Click ZIP Download | IncogTalk",
    description: "Military-grade AES-256 client-side encrypted file sharing by IncogTalk. Upload, set burn-after-reading or passcode protection, and share via 6-character code with instant 1-click ZIP downloads.",
    keywords: "encrypted file sharing, aes-256 file drop, burn after reading file transfer, zip bundle download, secure file share, incogtalk file share",
    breadcrumbTitle: "Encrypted File Sharing",
    schema: {
      "@type": "WebApplication",
      "name": "IncogTalk Encrypted File Share",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web, Android",
      "url": "https://incogtalkk.netlify.app/file-sharing",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Client-side AES-256 Web Crypto encryption",
        "Burn after reading self-destruct shares",
        "1-click ZIP bundle downloads",
        "Passcode protected files",
        "Share via 6-character code or QR"
      ]
    }
  });

  const codeFromUrl = searchParams.get("code");
  const beamFromUrl = searchParams.get("beam");

  type MainTab = "beam" | "send" | "receive" | "library" | "beam_sender";
  type SendSubMode = "files" | "text" | "password";
  type ReceiveSubMode = "code" | "qr";
  type LibrarySubMode = "files" | "shares";

  const [activeTab, setActiveTab] = useState<MainTab>(
    beamFromUrl ? "beam_sender" : codeFromUrl ? "receive" : "beam"
  );
  const [sendSubMode, setSendSubMode] = useState<SendSubMode>("files");
  const [receiveSubMode, setReceiveSubMode] = useState<ReceiveSubMode>("code");
  const [librarySubMode, setLibrarySubMode] = useState<LibrarySubMode>("files");

  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(codeFromUrl);
  const [activeBeamCode, setActiveBeamCode] = useState<string | null>(beamFromUrl);
  const [shareModalFiles, setShareModalFiles] = useState<SharedFileItem[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [allFiles, setAllFiles] = useState<SharedFileItem[]>(getSavedFiles);

  useEffect(() => {
    // Auto-purge expired shares on app mount
    purgeExpiredShares();

    if (beamFromUrl) {
      const upperBeam = beamFromUrl.toUpperCase().replace(/^BEAM-/, "");
      setActiveBeamCode(upperBeam);
      setActiveTab("beam_sender");
      document.title = `Live Beam Drop (${upperBeam}) – IncogTalk`;
    } else if (codeFromUrl) {
      const upper = codeFromUrl.toUpperCase();
      setActiveAccessCode(upper);
      setActiveTab("receive");
      document.title = `IncogTalk Shared Files (${upper}) – Access Code`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `Shared Files Received (Code: ${upper}) - IncogTalk File Share`);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", `Access shared files securely on IncogTalk with code ${upper}. Speak freely. Stay incognito.`);
    } else {
      document.title = "IncogTalk – Speak Freely. Stay Incognito | Encrypted File Sharing";
    }
  }, [codeFromUrl, beamFromUrl]);

  const handleUploadCompleted = (files: SharedFileItem[]) => {
    setShareModalFiles(files);
    setIsShareModalOpen(true);
    setAllFiles(getSavedFiles());
  };

  const handleAccessCode = (code: string) => {
    setSearchParams({ code: code.toUpperCase() });
    setActiveAccessCode(code.toUpperCase());
    setActiveBeamCode(null);
  };

  const handleBeamCode = (beamPin: string) => {
    const clean = beamPin.toUpperCase().replace(/^BEAM-/, "");
    setSearchParams({ beam: clean });
    setActiveBeamCode(clean);
    setActiveAccessCode(null);
    setActiveTab("beam_sender");
  };

  const handleQrScanSuccess = (decodedText: string) => {
    // 1. Check if decoded text is a Live Beam Drop QR (e.g. ?beam=7K9M or /file-sharing?beam=...)
    const beamMatch = decodedText.match(/[?&]beam=([A-Za-z0-9-]+)/i) || decodedText.match(/BEAM-([A-Za-z0-9]+)/i);
    if (beamMatch) {
      const beamPin = beamMatch[1].toUpperCase().replace(/^BEAM-/, "");
      toast.success(`⚡ Live Beam QR Scanned: ${beamPin}`);
      handleBeamCode(beamPin);
      return;
    }

    // 2. Check if decoded text is a standard share URL with ?code= or /share/
    let scannedCode = decodedText.trim().toUpperCase();
    const urlMatch = decodedText.match(/[?&]code=([A-Za-z0-9]{6})/i) || decodedText.match(/\/share\/([A-Za-z0-9]{6})/i);
    if (urlMatch) {
      scannedCode = urlMatch[1].toUpperCase();
    } else if (scannedCode.length > 6) {
      const cleanMatch = scannedCode.match(/[A-Z0-9]{6}/);
      if (cleanMatch) scannedCode = cleanMatch[0];
    }

    if (scannedCode.length === 6) {
      toast.success(`✅ QR Code Scanned: ${scannedCode}`);
      handleAccessCode(scannedCode);
    } else {
      toast.error("Invalid QR Code. Please scan a valid File Share or Beam QR Code.");
    }
  };

  const handleClearAccessCode = () => {
    setActiveAccessCode(null);
    setActiveBeamCode(null);
    setSearchParams({});
    setActiveTab("receive");
  };

  const handleClearBeam = () => {
    setActiveBeamCode(null);
    setActiveAccessCode(null);
    setSearchParams({});
    setActiveTab("beam");
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-background text-foreground pb-12">
      {/* Mobile Top Header with Logo, Theme Toggle & Back Button */}
      <div className="lg:hidden sticky top-0 z-40">
        <Header onlineCount={onlineCount} onBack={() => navigate("/")} />
      </div>

      <div className="py-4 sm:py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/10 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 mr-1 inline" /> Direct Encrypted Sharing
              </Badge>
              <Badge variant="secondary" className="text-[9px] uppercase font-mono px-1.5 py-0.5">
                AES-256 Client-Side
              </Badge>
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5">
                ⚡ AirDrop Web
              </Badge>
            </div>

            <h1 className="text-xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              File Sharing & Live QR Drop
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-lg">
              Direct mobile-to-PC QR pairing, encrypted 6-character access codes, auto-burn secrets, and 1-click ZIP downloads.
            </p>
          </div>

          {/* Unified 4-Mode Segmented Dock */}
          <div className="w-full md:w-auto p-1 rounded-2xl bg-card border border-border/80 shadow-md">
            <div className="grid grid-cols-4 sm:flex sm:items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("beam");
                  setActiveAccessCode(null);
                  setActiveBeamCode(null);
                  setSearchParams({});
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === "beam"
                    ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>Live Drop</span>
                <span className="hidden lg:inline text-[8px] uppercase tracking-wider px-1 py-0.2 rounded bg-white/20 text-white font-mono font-bold">
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("send");
                  setActiveAccessCode(null);
                  setActiveBeamCode(null);
                  setSearchParams({});
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === "send"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("receive");
                  setActiveAccessCode(null);
                  setActiveBeamCode(null);
                  setSearchParams({});
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  (activeTab === "receive" || activeAccessCode) && activeTab !== "beam"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Receive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("library");
                  setActiveAccessCode(null);
                  setActiveBeamCode(null);
                  setSearchParams({});
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === "library"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Vault</span>
                {allFiles.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "library" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {allFiles.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active Beam Sender View (opened via QR scan or URL) */}
        {activeBeamCode || activeTab === "beam_sender" ? (
          <LiveBeamSenderView
            initialCode={activeBeamCode || ""}
            onExit={handleClearBeam}
          />
        ) : activeAccessCode ? (
          <SharedAccessView
            initialCode={activeAccessCode}
            onBackToSearch={handleClearAccessCode}
          />
        ) : (
          <>
            {/* 1. Live Beam Receiver Tab */}
            {activeTab === "beam" && (
              <div className="py-2 animate-fade-in">
                <LiveBeamReceiverView onClose={() => setActiveTab("send")} />
              </div>
            )}

            {/* 2. Send & Share Hub Tab */}
            {activeTab === "send" && (
              <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                {/* Send Mode Sub-Pills */}
                <div className="flex items-center justify-center gap-1 p-1 rounded-2xl bg-card border border-border/80 max-w-sm mx-auto shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSendSubMode("files")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sendSubMode === "files"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Files
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendSubMode("text")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sendSubMode === "text"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Text Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendSubMode("password")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sendSubMode === "password"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" /> Password
                  </button>
                </div>

                {sendSubMode === "files" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="text-lg font-display font-bold text-foreground">
                        Upload Files & Create Share Code
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Upload single or multiple files to generate a shareable 6-digit code or QR code.
                      </p>
                    </div>
                    <UploadDropzone onUploadCompleted={handleUploadCompleted} />
                  </div>
                )}

                {sendSubMode === "text" && (
                  <div className="animate-fade-in max-w-2xl mx-auto py-2">
                    <ShareTextCard />
                  </div>
                )}

                {sendSubMode === "password" && (
                  <div className="animate-fade-in max-w-2xl mx-auto py-2">
                    <SharePasswordCard />
                  </div>
                )}
              </div>
            )}

            {/* 3. Receive Hub Tab */}
            {activeTab === "receive" && (
              <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                {/* Receive Mode Sub-Pills */}
                <div className="flex items-center justify-center gap-1 p-1 rounded-2xl bg-card border border-border/80 max-w-xs mx-auto shadow-sm">
                  <button
                    type="button"
                    onClick={() => setReceiveSubMode("code")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      receiveSubMode === "code"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Enter Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiveSubMode("qr")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      receiveSubMode === "qr"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" /> Scan Camera
                  </button>
                </div>

                {receiveSubMode === "code" && (
                  <div className="animate-fade-in max-w-md mx-auto py-2">
                    <EnterShareCodeCard onAccessCode={handleAccessCode} onBeamCode={handleBeamCode} />
                  </div>
                )}

                {receiveSubMode === "qr" && (
                  <div className="animate-fade-in max-w-md mx-auto py-2">
                    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
                      <div className="space-y-1">
                        <h3 className="text-lg font-display font-bold text-foreground flex items-center justify-center gap-2">
                          <Camera className="h-5 w-5 text-primary" /> Camera QR Scanner
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Point your camera at an IncogTalk File Share or Live Beam QR code.
                        </p>
                      </div>
                      <QrScanner onScanSuccess={handleQrScanSuccess} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Vault & Library Tab */}
            {activeTab === "library" && (
              <div className="space-y-6 animate-fade-in">
                {/* Library Mode Sub-Pills */}
                <div className="flex items-center justify-center gap-1 p-1 rounded-2xl bg-card border border-border/80 max-w-xs mx-auto shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLibrarySubMode("files")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      librarySubMode === "files"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> My Files ({allFiles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibrarySubMode("shares")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      librarySubMode === "shares"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Active Shares
                  </button>
                </div>

                {librarySubMode === "files" && (
                  <div className="animate-fade-in">
                    <FileManagerView
                      onSelectFilesForShare={(selected) => {
                        setShareModalFiles(selected);
                        setIsShareModalOpen(true);
                      }}
                    />
                  </div>
                )}

                {librarySubMode === "shares" && (
                  <div className="animate-fade-in">
                    <MySharesView />
                  </div>
                )}

                {/* Storage breakdown */}
                <div className="pt-4 border-t border-border/40">
                  <StorageStatsCard files={allFiles} />
                </div>
              </div>
            )}
          </>
        )}

      {/* Share Modal */}
      <ShareCodeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedFiles={shareModalFiles}
      />
      </div>

      {/* Floating Mobile Hamburger Navigation */}
      <MobileNav />
    </div>
  );
};

export default FileSharingPage;
