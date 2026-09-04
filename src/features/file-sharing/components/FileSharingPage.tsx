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
import { SharedFileItem, ShareRecord } from "../types";
import {
  Share2, KeyRound, UploadCloud, FolderOpen, ShieldCheck, Sparkles,
  ArrowRight, HardDrive, Lock, ArrowLeft, Home, QrCode, Camera, FileText
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
  const [activeTab, setActiveTab] = useState<"home" | "upload" | "share_text" | "share_password" | "enter_code" | "scan_qr" | "files" | "shares">(
    codeFromUrl ? "enter_code" : "home"
  );

  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(codeFromUrl);
  const [shareModalFiles, setShareModalFiles] = useState<SharedFileItem[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [allFiles, setAllFiles] = useState<SharedFileItem[]>(getSavedFiles);

  useEffect(() => {
    // Auto-purge expired shares on app mount
    purgeExpiredShares();

    if (codeFromUrl) {
      const upper = codeFromUrl.toUpperCase();
      setActiveAccessCode(upper);
      document.title = `IncogTalk Shared Files (${upper}) – Access Code`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `Shared Files Received (Code: ${upper}) - IncogTalk File Share`);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", `Access shared files securely on IncogTalk with code ${upper}. Speak freely. Stay incognito.`);
    } else {
      document.title = "IncogTalk – Speak Freely. Stay Incognito | Encrypted File Sharing";
    }
  }, [codeFromUrl]);

  const handleUploadCompleted = (files: SharedFileItem[]) => {
    setShareModalFiles(files);
    setIsShareModalOpen(true);
    setAllFiles(getSavedFiles());
  };

  const handleAccessCode = (code: string) => {
    setSearchParams({ code: code.toUpperCase() });
    setActiveAccessCode(code.toUpperCase());
  };

  const handleQrScanSuccess = (decodedText: string) => {
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
      toast.error("Invalid QR Code. Please scan a valid File Share QR Code.");
    }
  };

  const handleClearAccessCode = () => {
    setActiveAccessCode(null);
    setSearchParams({});
    setActiveTab("home");
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-background text-foreground pb-12">
      {/* Mobile Top Header with Logo, Theme Toggle & Back Button */}
      <div className="lg:hidden sticky top-0 z-40">
        <Header onlineCount={onlineCount} onBack={() => navigate("/")} />
      </div>

      <div className="py-4 sm:py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/10 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3" /> Direct File Sharing
              </Badge>
              <Badge variant="secondary" className="text-[9px] uppercase font-mono px-1.5 py-0.5">
                Fast & Encrypted
              </Badge>
            </div>

            <h1 className="text-xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              File Sharing & Share Code
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-lg">
              Upload files up to 100 MB each and generate secure 6-character share codes, direct links, or QR codes.
            </p>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border/80 shadow-sm overflow-x-auto w-full sm:w-auto no-scrollbar touch-pan-x">
          <button
            type="button"
            onClick={() => { setActiveTab("home"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
              activeTab === "home" && !activeAccessCode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("upload"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "upload"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadCloud className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("share_text"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "share_text"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3 w-3" /> Share Text
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("share_password"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "share_password"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="h-3 w-3" /> Share Password
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("enter_code"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              (activeTab === "enter_code" || activeAccessCode) && activeTab !== "home"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3 w-3" /> Enter Code
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("scan_qr"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "scan_qr"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-3 w-3" /> Scan QR
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("files"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "files"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3 w-3" /> My Files
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("shares"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === "shares"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="h-3 w-3" /> My Shares
          </button>
        </div>
      </div>

      {/* Active Code Access View */}
      {activeAccessCode ? (
        <SharedAccessView
          initialCode={activeAccessCode}
          onBackToSearch={handleClearAccessCode}
        />
      ) : (
        <>
          {/* Homepage Cards Grid */}
          {activeTab === "home" && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Upload & Share Card */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4 hover:border-primary/50 transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      <UploadCloud className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-display font-bold text-foreground">
                      Upload Files
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload documents, images, audio, video, or archives. Share using short codes or QR codes.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="w-full h-10 rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-2 shadow-md hover:scale-[1.01] transition-all mt-3"
                  >
                    Upload File <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Share Text Card */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4 hover:border-primary/50 transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-display font-bold text-foreground">
                      Share Text & Notes
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Paste or write raw text, code snippets, or notes. Generate an instant share code.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("share_text")}
                    variant="outline"
                    className="w-full h-10 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs gap-2 shadow-sm transition-all mt-3"
                  >
                    Share Text <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Share Password Card */}
                <div className="bg-card border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4 hover:border-amber-500/60 transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      <Lock className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-display font-bold text-foreground">
                      Share Password & Secrets
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Share Wi-Fi keys, logins, or tokens with auto-burn self-destruct & password protection.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("share_password")}
                    className="w-full h-10 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs gap-2 shadow-md hover:scale-[1.01] transition-all mt-3"
                  >
                    Share Password <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Direct Quick Dropzone */}
              <div className="bg-card/50 border border-border/70 rounded-3xl p-6 shadow-lg space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Quick Upload Dropzone
                </h4>
                <UploadDropzone onUploadCompleted={handleUploadCompleted} />
              </div>

              {/* Storage Quota Categorized Chart */}
              <StorageStatsCard files={allFiles} />
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-foreground">
                  Upload File & Create Share Code
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload single or multiple files to generate a shareable code.
                </p>
              </div>

              <UploadDropzone onUploadCompleted={handleUploadCompleted} />
            </div>
          )}

          {/* Share Text Tab */}
          {activeTab === "share_text" && (
            <div className="animate-fade-in max-w-2xl mx-auto py-2">
              <ShareTextCard />
            </div>
          )}

          {/* Share Password Tab */}
          {activeTab === "share_password" && (
            <div className="animate-fade-in max-w-2xl mx-auto py-2">
              <SharePasswordCard />
            </div>
          )}

          {/* Enter Code Tab */}
          {activeTab === "enter_code" && (
            <div className="max-w-md mx-auto animate-fade-in py-4">
              <EnterShareCodeCard onAccessCode={handleAccessCode} />
            </div>
          )}

          {/* Scan QR Code Tab */}
          {activeTab === "scan_qr" && (
            <div className="max-w-md mx-auto animate-fade-in py-4">
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-bold text-foreground flex items-center justify-center gap-2">
                    <Camera className="h-5 w-5 text-primary" /> Camera QR Scanner
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Point your camera at an IncogTalk File Share QR code or upload a QR image.
                  </p>
                </div>

                <QrScanner
                  onScanSuccess={handleQrScanSuccess}
                />
              </div>
            </div>
          )}

          {/* My Files Tab */}
          {activeTab === "files" && (
            <div className="animate-fade-in">
              <FileManagerView
                onSelectFilesForShare={(selected) => {
                  setShareModalFiles(selected);
                  setIsShareModalOpen(true);
                }}
              />
            </div>
          )}

          {/* My Shares Tab */}
          {activeTab === "shares" && (
            <div className="animate-fade-in">
              <MySharesView />
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
