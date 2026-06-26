import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Smartphone, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consumeSessionToken, validateSessionToken } from "@/features/cross-device-sync/sessionTokens";
import { useSEO } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";

const getOrCreateSessionId = () => {
  let id = localStorage.getItem("echo_session_id_v2");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_session_id_v2", id);
  }
  return id;
};

type Stage = "idle" | "auto-claiming" | "manual-entry" | "validating" | "success" | "error";

const HandoffPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualRoom, setManualRoom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const roomId = params.get("room") ?? "";
  const token = params.get("token") ?? "";

  useSEO({
    title: "Device Handoff – LiveTalk",
    description: "Continue your LiveTalk session on this device with a temporary handoff code.",
  });

  // Auto-claim when URL has room + token
  useEffect(() => {
    if (!roomId || !token) {
      // No URL params — show manual entry form
      setStage("manual-entry");
      setTimeout(() => inputRef.current?.focus(), 200);
      return;
    }

    setStage("auto-claiming");
    (async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const valid = await validateSessionToken(roomId, token);
        if (!valid) {
          setError("This handoff code has expired or was already used. Ask your other device for a new code.");
          setStage("error");
          return;
        }
        const ok = await consumeSessionToken(roomId, token, sessionId);
        if (!ok) {
          setError("Could not claim this session — it may have been used by another device.");
          setStage("error");
          return;
        }
        setStage("success");
        sessionStorage.setItem("echo.handoff.room", roomId);
        sessionStorage.setItem("echo.handoff.token", token);
        setTimeout(() => {
          navigate(`/chat?handoff=${encodeURIComponent(roomId)}`, { replace: true });
        }, 1400);
      } catch {
        setError("Something went wrong. Please try again.");
        setStage("error");
      }
    })();
  }, [roomId, token, navigate]);

  const handleManualSubmit = async () => {
    const code = manualCode.trim().toUpperCase();
    const room = manualRoom.trim();

    if (!code || code.length < 6) {
      setError("Please enter a valid 8-character handoff code.");
      return;
    }

    setStage("validating");
    setError(null);

    try {
      const sessionId = getOrCreateSessionId();

      // If room ID not provided, try to find it from the code
      // The code itself encodes the room — we try to validate with the code as both room and token
      const targetRoom = room || code; // fallback: some tokens use code as roomId prefix

      // First attempt with provided room
      let valid = room ? await validateSessionToken(room, code) : null;

      // If no room provided or validation failed, show helpful error
      if (!valid) {
        setError(
          room
            ? "Code not found or expired. Check the code and try again."
            : "Please also enter the Room ID shown on the panel beside the QR code. The code alone is not enough."
        );
        setStage("manual-entry");
        return;
      }

      const ok = await consumeSessionToken(room, code, sessionId);
      if (!ok) {
        setError("This code was already used or has expired.");
        setStage("manual-entry");
        return;
      }

      setStage("success");
      sessionStorage.setItem("echo.handoff.room", room);
      sessionStorage.setItem("echo.handoff.token", code);
      setTimeout(() => {
        navigate(`/chat?handoff=${encodeURIComponent(room)}`, { replace: true });
      }, 1400);
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("manual-entry");
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-5 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BrandLogo className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight">Device Handoff</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Continue your chat session on this device
            </p>
          </div>
        </div>

        {/* State: auto-claiming */}
        <AnimatePresence mode="wait">
          {stage === "auto-claiming" && (
            <motion.div
              key="claiming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Linking this device to your session…</p>
            </motion.div>
          )}

          {/* State: success */}
          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div className="h-16 w-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">Session linked!</p>
                <p className="text-sm text-muted-foreground">Redirecting to your chat…</p>
              </div>
            </motion.div>
          )}

          {/* State: error (from auto-claim) */}
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
                  Enter code manually
                </Button>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Home
                </Button>
              </div>
            </motion.div>
          )}

          {/* State: manual entry or validating */}
          {(stage === "manual-entry" || stage === "validating") && (
            <motion.div
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Instructions */}
              <div className="rounded-2xl bg-muted/50 border border-border/50 p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How to use</p>
                {[
                  "On your other device, open the Cross-device sync panel",
                  "Copy the 8-character handoff code",
                  "Paste it below and tap Connect",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-destructive/10 border border-destructive/25 px-3 py-2.5 flex items-start gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive leading-relaxed">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto shrink-0">
                      <X className="h-3.5 w-3.5 text-destructive/60" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Room ID input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Room ID</label>
                <Input
                  placeholder="Paste room ID from the panel"
                  value={manualRoom}
                  onChange={(e) => setManualRoom(e.target.value.trim())}
                  className="font-mono text-sm"
                  disabled={stage === "validating"}
                />
                <p className="text-[10px] text-muted-foreground/60">
                  Shown in the URL when the panel opens, or tap "Copy link" and paste here.
                </p>
              </div>

              {/* Code input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Handoff code</label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="e.g. K8A5KK6N"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase().slice(0, 8))}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    className="font-mono text-center text-lg tracking-[0.2em] uppercase font-bold"
                    maxLength={8}
                    disabled={stage === "validating"}
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={manualCode.length < 6 || stage === "validating"}
                    size="icon"
                    className="shrink-0 h-10 w-10"
                  >
                    {stage === "validating"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={manualCode.length < 6 || stage === "validating"}
                className="w-full"
                size="lg"
              >
                {stage === "validating" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting…</>
                ) : (
                  <><Smartphone className="h-4 w-4 mr-2" /> Connect this device</>
                )}
              </Button>

              <button
                onClick={() => navigate("/")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
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
