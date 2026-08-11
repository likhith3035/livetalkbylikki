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
import { SharedFileItem, ShareRecord } from "../types";
import {
  Share2, KeyRound, UploadCloud, FolderOpen, ShieldCheck, Sparkles,
  ArrowRight, HardDrive, Lock, ArrowLeft, Home, QrCode, Camera
} from "lucide-react";
import { toast } from "sonner";

export const FileSharingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const codeFromUrl = searchParams.get("code");
  const [activeTab, setActiveTab] = useState<"home" | "upload" | "enter_code" | "scan_qr" | "files" | "shares">(
    codeFromUrl ? "enter_code" : "home"
  );

  const [activeAccessCode, setActiveAccessCode] = useState<string | null>(codeFromUrl);
  const [shareModalFiles, setShareModalFiles] = useState<SharedFileItem[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (codeFromUrl) {
      setActiveAccessCode(codeFromUrl.toUpperCase());
    }
  }, [codeFromUrl]);

  const handleUploadCompleted = (files: SharedFileItem[]) => {
    setShareModalFiles(files);
    setIsShareModalOpen(true);
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
        <Header onlineCount={3} onBack={() => navigate("/")} />
      </div>

      <div className="py-6 sm:py-10 px-4 sm:px-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary bg-primary/10">
                <ShieldCheck className="h-3.5 w-3.5" /> Direct File Sharing
              </Badge>
              <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                Fast & Encrypted
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight">
              File Sharing & Share Code
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Upload files up to 100 MB each and generate secure 6-character share codes, direct links, or QR codes.
            </p>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border/80 shadow-md overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { setActiveTab("home"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
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
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("enter_code")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "enter_code" || activeAccessCode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" /> Enter Code
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("scan_qr"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "scan_qr"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" /> Scan QR
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("files"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "files"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> My Files
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("shares"); setActiveAccessCode(null); setSearchParams({}); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "shares"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Share2 className="h-3.5 w-3.5" /> My Shares
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload & Share Card */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 hover:border-primary/50 transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      <UploadCloud className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-display font-bold text-foreground">
                      Upload & Share
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload documents, images, audio, video, or archive files. Automatically generate a 6-character short code or share link.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-2 shadow-md hover:scale-[1.01] transition-all mt-4"
                  >
                    Upload & Get Code <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Enter Share Code Card */}
                <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 hover:border-primary/50 transition-all group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      <KeyRound className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-display font-bold text-foreground">
                      Enter Share Code
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Received a 6-character share code from someone? Enter it here to access and download the shared files instantly.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("enter_code")}
                    variant="outline"
                    className="w-full h-11 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs gap-2 shadow-sm transition-all mt-4"
                  >
                    Enter Code <ArrowRight className="h-4 w-4" />
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
                    Point your camera at a LiveTalk File Share QR code or upload a QR image.
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
