import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2, Smartphone, CheckCircle2, AlertCircle, ArrowRight, X, Camera, Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consumeSessionToken, validateSessionToken } from "@/features/cross-device-sync/sessionTokens";
import { useSEO } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import QrScanner from "@/components/chat/QrScanner";

const getOrCreateSessionId = () => {
  let id = localStorage.getItem("echo_session_id_v2");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_session_id_v2", id);
  }
  return id;
};

/** After a token is consumed, redirect into the correct room */
function redirectToRoom(roomId: string, navigate: ReturnType<typeof useNavigate>) {
  // Private rooms have format "private_XXXXXX" — extract the 6-char code
  const privateMatch = roomId.match(/^private_([A-Z0-9]+)$/i);
  if (privateMatch) {
    const code = privateMatch[1].toUpperCase();
    sessionStorage.setItem("echo_join_room", code);
    navigate("/chat", { replace: true });
    return;
  }
  // Random match room — store full room ID so ChatPage can reconnect
  sessionStorage.setItem("echo.handoff.room", roomId);
  navigate(`/chat?handoff=${encodeURIComponent(roomId)}`, { replace: true });
}

type Stage = "idle" | "auto-claiming" | "manual-entry" | "validating" | "success" | "error";
type InputMode = "code" | "scan";

const HandoffPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("code");
  const [manualToken, setManualToken] = useState("");
  const [manualRoomId, setManualRoomId] = useState("");
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const urlRoom = params.get("room") ?? "";
  const urlToken = params.get("token") ?? "";

  useSEO({
    title: "Join Session – LiveTalk",
    description: "Continue your LiveTalk session on this device.",
  });

  // ── Auto-claim when URL has room + token (QR scan path) ─────────────────────
  useEffect(() => {
    if (!urlRoom || !urlToken) {
      setStage("manual-entry");
      setTimeout(() => tokenInputRef.current?.focus(), 200);
      return;
    }
    claim(urlRoom, urlToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = async (room: string, token: string) => {
    setStage("auto-claiming");
    setError(null);
    try {
      const sessionId = getOrCreateSessionId();
      const valid = await validateSessionToken(room, token);
      if (!valid) {
        setError("This handoff code expired or was already used. Go back and tap 'New handoff code' on your other device.");
        setStage("error");
        return;
      }
      const ok = await consumeSessionToken(room, token, sessionId);
      if (!ok) {
        setError("Could not claim this session — another device may have already used this code.");
        setStage("error");
        return;
      }
      setStage("success");
      setTimeout(() => redirectToRoom(room, navigate), 1200);
    } catch (e) {
      console.error("[Handoff] claim error:", e);
      setError("Something went wrong connecting. Please try again.");
      setStage("error");
    }
  };

  // ── Manual submit ────────────────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    const token = manualToken.trim().toUpperCase();
    const room = manualRoomId.trim();

    if (!token || token.length < 6) {
      setError("Enter the full 8-character handoff code.");
      return;
    }
    if (!room) {
      setError("Also enter the Room ID shown below the code on the other device.");
      return;
    }

    setStage("validating");
    setError(null);
    await claim(room, token);
    if (stage !== "success") setStage("manual-entry");
  };

  // ── QR scan handler ─────────────────────────────────────────────────────────
  const handleQrScan = async (decoded: string) => {
    // Expect URL like /handoff?room=...&token=...
    try {
      const url = new URL(decoded);
      const room = url.searchParams.get("room") ?? "";
      const token = url.searchParams.get("token") ?? "";
      if (room && token) {
        await claim(room, token);
        return;
      }
    } catch { /* not a URL — try raw */ }

    // Maybe raw "ROOM|TOKEN" or just a token — show error
    setError("Invalid QR code. Scan the QR from the Cross-device Sync panel.");
    setInputMode("code");
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-5 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BrandLogo className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight">Join Session</h1>
            <p className="text-sm text-muted-foreground mt-1">Continue your chat on this device</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Claiming / validating */}
          {(stage === "auto-claiming" || stage === "validating") && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                {stage === "auto-claiming" ? "Linking this device to your session…" : "Checking code…"}
              </p>
            </motion.div>
          )}

          {/* Success */}
          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">Session linked!</p>
                <p className="text-sm text-muted-foreground">Joining your chat…</p>
              </div>
            </motion.div>
          )}

          {/* Error from auto-claim */}
          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-destructive/10 border border-destructive/25 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive leading-relaxed">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setStage("manual-entry"); setError(null); }}
                >
                  Enter manually
                </Button>
                <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
              </div>
            </motion.div>
          )}

          {/* Manual entry */}
          {stage === "manual-entry" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* How to get the code */}
              <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How to use</p>
                {[
                  "On your other device, open the chat and look for the 📱 Cross-device Sync panel",
                  "Copy the 8-character handoff code and the Room ID shown on the panel",
                  "Paste both below and tap Connect — or scan the QR code directly",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>

              {/* Input mode tabs */}
              <div className="flex rounded-xl bg-muted/50 p-0.5 border border-border/40">
                <button
                  onClick={() => { setInputMode("code"); setError(null); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                    inputMode === "code"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Keyboard className="h-3.5 w-3.5" /> Enter Code
                </button>
                <button
                  onClick={() => { setInputMode("scan"); setError(null); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                    inputMode === "scan"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Camera className="h-3.5 w-3.5" /> Scan QR
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 flex items-start gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive leading-relaxed flex-1">{error}</p>
                    <button onClick={() => setError(null)}>
                      <X className="h-3.5 w-3.5 text-destructive/60" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {inputMode === "scan" ? (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <QrScanner
                      onScanSuccess={handleQrScan}
                      onClose={() => setInputMode("code")}
                    />
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                      Point your camera at the QR code on the Cross-device Sync panel
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="code-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {/* Room ID */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Room ID</label>
                      <Input
                        placeholder="e.g. private_ABCDEF or paste from panel"
                        value={manualRoomId}
                        onChange={(e) => setManualRoomId(e.target.value.trim())}
                        className="font-mono text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground/70">
                        Tap "Copy link" on the panel and paste — the Room ID is in the URL after <code>room=</code>
                      </p>
                    </div>

                    {/* Handoff code */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Handoff code</label>
                      <div className="flex gap-2">
                        <Input
                          ref={tokenInputRef}
                          placeholder="K8A5KK6N"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value.toUpperCase().slice(0, 8))}
                          onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                          className="font-mono text-center text-lg tracking-[0.2em] uppercase font-bold"
                          maxLength={8}
                        />
                        <Button
                          onClick={handleManualSubmit}
                          disabled={manualToken.length < 6 || !manualRoomId.trim()}
                          size="icon"
                          className="shrink-0 h-10 w-10"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleManualSubmit}
                      disabled={manualToken.length < 6 || !manualRoomId.trim()}
                      className="w-full"
                      size="lg"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Connect this device
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => navigate("/")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
              >
                ← Back to home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HandoffPage;
