import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BeamSession, BeamOptionType, BeamTransferItem, SharedFileItem
} from "../types";
import {
  joinBeamSession,
  listenBeamSession,
  sendBeamTransfer,
  uploadBeamFile,
  uploadBeamAudio,
  getDeviceSummary,
  getOrCreateDeviceId
} from "../services/beamService";
import { formatBytes } from "../services/fileSharingService";
import {
  Smartphone, UploadCloud, Camera, FileText, Lock, Send, CheckCircle2,
  Sparkles, X, ArrowLeft, Flame, Eye, EyeOff, Clipboard, Download, ExternalLink,
  HardDrive, AlertCircle, Mic, Square, Play, Pause, Clock, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { sounds, haptics } from "@/lib/sounds";

interface LiveBeamSenderViewProps {
  initialCode: string;
  onExit: () => void;
}

export const LiveBeamSenderView: React.FC<LiveBeamSenderViewProps> = ({ initialCode, onExit }) => {
  const cleanCode = initialCode.toUpperCase().replace(/^BEAM-/, "").trim();

  const [session, setSession] = useState<BeamSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [activeOption, setActiveOption] = useState<BeamOptionType>("files");

  // Files state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Camera state
  const [capturedPhoto, setCapturedPhoto] = useState<{ file: File; previewUrl: string } | null>(null);

  // Voice Note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Text state
  const [textContent, setTextContent] = useState("");

  // Secret state
  const [secretTitle, setSecretTitle] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [burnAfterReading, setBurnAfterReading] = useState(true);
  const [showSecretValue, setShowSecretValue] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Join session & setup listener
  useEffect(() => {
    let cleanupListener: (() => void) | null = null;

    const join = async () => {
      try {
        setIsConnecting(true);
        setConnectError(null);

        const joinedSession = await joinBeamSession(cleanCode);
        setSession(joinedSession);
        sounds.connected();
        haptics.vibrate([80, 40, 80]);
        toast.success(`Connected to ${joinedSession.receiver.name}!`);

        cleanupListener = listenBeamSession(cleanCode, (updated) => {
          if (updated) {
            setSession(updated);
          }
        });
      } catch (err: any) {
        setConnectError(err.message || "Failed to connect to Live Beam Drop.");
        sounds.blocked();
      } finally {
        setIsConnecting(false);
      }
    };

    join();

    return () => {
      if (cleanupListener) cleanupListener();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url);
    };
  }, [cleanCode]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Handle camera capture
  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedPhoto({ file, previewUrl });
    }
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ blob: audioBlob, url: audioUrl, duration: recordingSeconds });
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      sounds.messageSent();
      haptics.vibrate(50);
    } catch {
      toast.error("Microphone access denied or not supported on this device.");
    }
  };

  // Stop Voice Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      sounds.messageReceived();
      haptics.vibrate([40, 40]);
    }
  };

  // Cancel Voice Recording
  const handleCancelVoice = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setRecordingSeconds(0);
  };

  // Paste clipboard into text
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTextContent(text);
        toast.success("Pasted from clipboard!");
      }
    } catch {
      toast.error("Please paste manually.");
    }
  };

  // Main Beam Execution
  const handleBeam = async () => {
    if (!session || isTransmitting) return;

    setIsTransmitting(true);
    setUploadProgress(10);

    const myDevice = getDeviceSummary();
    const myDeviceId = getOrCreateDeviceId();

    try {
      if (activeOption === "files") {
        if (!selectedFiles.length) {
          toast.error("Please choose at least one file to beam.");
          setIsTransmitting(false);
          return;
        }

        const uploadedItems: SharedFileItem[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const progressBase = Math.round((i / selectedFiles.length) * 80);
          const uploaded = await uploadBeamFile(file, (p) => {
            setUploadProgress(progressBase + Math.round((p / selectedFiles.length) * 0.8));
          });
          uploadedItems.push(uploaded);
        }

        setUploadProgress(95);

        await sendBeamTransfer(session.code, {
          senderId: myDeviceId,
          senderName: myDevice.name,
          type: "files",
          files: uploadedItems,
          note: `Beamed ${uploadedItems.length} file(s) from ${myDevice.name}`,
        });

        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success(`🚀 Beamed ${uploadedItems.length} file(s) to ${session.receiver.name}!`);
      } else if (activeOption === "camera") {
        if (!capturedPhoto) {
          toast.error("Please take a photo first.");
          setIsTransmitting(false);
          return;
        }

        setUploadProgress(30);
        const uploaded = await uploadBeamFile(capturedPhoto.file, (p) => setUploadProgress(30 + p * 0.6));
        setUploadProgress(95);

        await sendBeamTransfer(session.code, {
          senderId: myDeviceId,
          senderName: myDevice.name,
          type: "camera",
          cameraPhotoUrl: uploaded.url,
          note: `Live photo snap from ${myDevice.name}`,
        });

        setCapturedPhoto(null);
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        toast.success(`📷 Photo beamed to ${session.receiver.name}!`);
      } else if (activeOption === "voice") {
        if (!recordedAudio) {
          toast.error("Please record a voice note first.");
          setIsTransmitting(false);
          return;
        }

        setUploadProgress(30);
        const uploaded = await uploadBeamAudio(recordedAudio.blob, recordedAudio.duration, (p) =>
          setUploadProgress(30 + p * 0.6)
        );
        setUploadProgress(95);

        await sendBeamTransfer(session.code, {
          senderId: myDeviceId,
          senderName: myDevice.name,
          type: "voice",
          voiceNoteUrl: uploaded.url,
          voiceDurationSec: recordedAudio.duration,
          files: [uploaded],
          note: `Voice note from ${myDevice.name}`,
        });

        handleCancelVoice();
        toast.success(`🎙️ Voice note beamed to ${session.receiver.name}!`);
      } else if (activeOption === "text") {
        if (!textContent.trim()) {
          toast.error("Please enter or paste some text.");
          setIsTransmitting(false);
          return;
        }

        setUploadProgress(60);
        await sendBeamTransfer(session.code, {
          senderId: myDeviceId,
          senderName: myDevice.name,
          type: "text",
          textContent: textContent.trim(),
        });

        setTextContent("");
        toast.success(`📋 Text note beamed to ${session.receiver.name}!`);
      } else if (activeOption === "secret") {
        if (!secretValue.trim()) {
          toast.error("Please enter a secret password or token.");
          setIsTransmitting(false);
          return;
        }

        setUploadProgress(60);
        await sendBeamTransfer(session.code, {
          senderId: myDeviceId,
          senderName: myDevice.name,
          type: "secret",
          secretPayload: {
            title: secretTitle.trim() || "Secret Note",
            secret: secretValue.trim(),
            burnAfterReading,
            hasBeenViewed: false,
          },
        });

        setSecretTitle("");
        setSecretValue("");
        toast.success(`🔑 Secret beamed securely to ${session.receiver.name}!`);
      }

      sounds.messageSent();
      haptics.vibrate([100, 50, 150]);
    } catch (err: any) {
      toast.error(err.message || "Failed to beam item.");
    } finally {
      setIsTransmitting(false);
      setUploadProgress(null);
    }
  };

  const transfersList = session?.transfers
    ? Object.values(session.transfers).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (isConnecting) {
    return (
      <div className="bg-card border border-border/80 rounded-3xl p-8 max-w-lg mx-auto shadow-2xl text-center space-y-4 animate-fade-in">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <Smartphone className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground">
          Connecting to Live Beam Drop...
        </h3>
        <p className="text-xs text-muted-foreground">
          Pairing with session <span className="font-mono font-bold text-primary">{cleanCode}</span>
        </p>
      </div>
    );
  }

  if (connectError || !session) {
    return (
      <div className="bg-card border border-destructive/30 rounded-3xl p-8 max-w-lg mx-auto shadow-2xl text-center space-y-4 animate-fade-in">
        <div className="h-12 w-12 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground">
          Unable to Connect
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {connectError || "The Live Beam Drop session may have ended or the code is incorrect."}
        </p>
        <Button
          type="button"
          onClick={onExit}
          className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Return to File Sharing
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden animate-fade-in max-w-xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="h-8 w-8 rounded-xl shrink-0"
            title="Exit Session"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <h2 className="text-sm sm:text-base font-display font-extrabold text-foreground truncate">
                Beam to {session.receiver.name}
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              AirDrop Web Session: <span className="font-mono text-primary font-bold">{session.code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {session.requireApproval && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[9px] px-1.5 py-0.5">
              Shield: Approval
            </Badge>
          )}
          <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 text-[10px] px-2 py-0.5">
            🟢 Live Paired
          </Badge>
        </div>
      </div>

      {/* 5 Options Selector */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-secondary/50 border border-border/80 text-xs">
        <button
          type="button"
          onClick={() => setActiveOption("files")}
          className={`py-2 px-0.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeOption === "files"
              ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span className="text-[9px] sm:text-[10px]">Files</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption("camera")}
          className={`py-2 px-0.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeOption === "camera"
              ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span className="text-[9px] sm:text-[10px]">Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption("voice")}
          className={`py-2 px-0.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeOption === "voice"
              ? "bg-purple-600 text-white shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-4 w-4" />
          <span className="text-[9px] sm:text-[10px]">Voice</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption("text")}
          className={`py-2 px-0.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeOption === "text"
              ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="text-[9px] sm:text-[10px]">Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption("secret")}
          className={`py-2 px-0.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeOption === "secret"
              ? "bg-amber-600 text-white shadow-sm scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span className="text-[9px] sm:text-[10px]">Secret</span>
        </button>
      </div>

      {/* Option 1: Files */}
      {activeOption === "files" && (
        <div className="space-y-3 animate-fade-in">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-secondary/30 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-secondary/50 space-y-2 group"
          >
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Tap to choose photos, documents, or files"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Supports any file type up to 100 MB
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-secondary/30 border border-border/60">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border/40">
                  <span className="truncate max-w-[200px] font-medium text-foreground">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{formatBytes(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Option 2: Camera Snap */}
      {activeOption === "camera" && (
        <div className="space-y-3 animate-fade-in">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraChange}
          />

          {!capturedPhoto ? (
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-secondary/30 rounded-2xl p-7 text-center cursor-pointer transition-all hover:bg-secondary/50 space-y-2 group"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-foreground">Tap to take a photo</p>
              <p className="text-[10px] text-muted-foreground">
                Snaps directly with phone camera and beams to screen
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-border max-h-56 bg-black">
                <img src={capturedPhoto.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setCapturedPhoto(null)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-xl shadow-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                Photo captured: {capturedPhoto.file.name} ({formatBytes(capturedPhoto.file.size)})
              </p>
            </div>
          )}
        </div>
      )}

      {/* Option 3: Voice Note */}
      {activeOption === "voice" && (
        <div className="space-y-4 animate-fade-in">
          {!recordedAudio ? (
            <div className="border border-border/80 bg-secondary/30 rounded-2xl p-6 text-center space-y-4">
              <div
                className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center shadow-lg transition-all ${
                  isRecording
                    ? "bg-destructive text-white animate-pulse ring-4 ring-destructive/30"
                    : "bg-purple-600 text-white hover:scale-105"
                }`}
              >
                <Mic className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-bold text-foreground">
                  {isRecording ? `Recording... (${formatTimer(recordingSeconds)})` : "Tap to Record Voice Note"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Record a quick audio memo to beam to the desktop screen
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                {!isRecording ? (
                  <Button
                    type="button"
                    onClick={handleStartRecording}
                    className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 h-9 gap-1.5"
                  >
                    <Mic className="h-4 w-4" /> Start Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="rounded-xl text-xs font-bold px-4 h-9 gap-1.5 animate-pulse"
                  >
                    <Square className="h-4 w-4" /> Stop & Preview
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-400 flex items-center gap-1.5">
                  <Mic className="h-4 w-4" /> Voice Memo Ready ({formatTimer(recordedAudio.duration)})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelVoice}
                  className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                >
                  Discard
                </Button>
              </div>

              <audio controls className="w-full h-8 rounded-lg" src={recordedAudio.url} />
            </div>
          )}
        </div>
      )}

      {/* Option 4: Text / Link */}
      {activeOption === "text" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Type or paste text:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteClipboard}
              className="h-7 text-[10px] rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Clipboard className="h-3 w-3" /> Paste Clipboard
            </Button>
          </div>

          <Textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste a long URL, note, phone number, address, or code snippet..."
            className="rounded-xl min-h-[110px] text-xs bg-secondary/30 resize-none"
          />
        </div>
      )}

      {/* Option 5: Secret / Password */}
      {activeOption === "secret" && (
        <div className="space-y-3 animate-fade-in">
          <Input
            value={secretTitle}
            onChange={(e) => setSecretTitle(e.target.value)}
            placeholder="Label (e.g. Wi-Fi Password, API Key)"
            className="rounded-xl text-xs bg-secondary/30 h-9"
          />

          <div className="relative">
            <Input
              type={showSecretValue ? "text" : "password"}
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Secret value or password..."
              className="rounded-xl text-xs bg-secondary/30 h-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowSecretValue((v) => !v)}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showSecretValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1 hover:text-foreground">
            <input
              type="checkbox"
              checked={burnAfterReading}
              onChange={(e) => setBurnAfterReading(e.target.checked)}
              className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" /> Burn after 1 view (Auto-destruct)
            </span>
          </label>
        </div>
      )}

      {/* Progress Bar during Transmission */}
      {uploadProgress !== null && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>Beaming data...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Beam Button */}
      <Button
        type="button"
        onClick={handleBeam}
        disabled={isTransmitting || (activeOption === "voice" && isRecording)}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white font-extrabold text-sm gap-2 shadow-lg hover:scale-[1.01] transition-all"
      >
        <Sparkles className="h-4 w-4" />
        <span>{isTransmitting ? "Beaming to Screen..." : `Beam to ${session.receiver.name} 🚀`}</span>
      </Button>

      {/* Live Activity & Status Feedback (With Approval State) */}
      {transfersList.length > 0 && (
        <div className="space-y-2 border-t border-border/50 pt-4">
          <h4 className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Session Transfers ({transfersList.length})</span>
            <span className="text-[10px] text-muted-foreground font-mono">Live Sync</span>
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-secondary/30 border border-border/60">
            {transfersList.map((item) => {
              const isMine = item.senderId === getOrCreateDeviceId();
              const isPending = item.status === "pending";
              const isDeclined = item.status === "declined";

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg text-xs border ${
                    isDeclined
                      ? "bg-destructive/10 border-destructive/30"
                      : isPending
                      ? "bg-amber-500/10 border-amber-500/30"
                      : isMine
                      ? "bg-card border-border/60"
                      : "bg-primary/10 border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-foreground">
                      {isMine ? "You sent:" : `Received from ${item.senderName}:`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500 bg-amber-500/10 px-1 py-0">
                          ⏳ Awaiting Approval
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">
                          ❌ Declined
                        </Badge>
                      )}
                      {!isPending && !isDeclined && isMine && (
                        <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[9px] px-1 py-0">
                          ✅ Delivered
                        </Badge>
                      )}
                      <span className="text-muted-foreground font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {item.files && item.files.length > 0 && (
                    <div className="mt-1">
                      {item.files.map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="truncate">{f.name}</span>
                          {f.url && (
                            <a
                              href={f.url}
                              download={f.name}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-bold shrink-0"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.type === "voice" && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-400 font-semibold">
                      <Mic className="h-3 w-3" /> Voice Memo
                    </div>
                  )}

                  {item.textContent && (
                    <p className="mt-1 font-mono text-[11px] text-foreground truncate">{item.textContent}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
