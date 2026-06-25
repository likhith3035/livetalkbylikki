import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { consumeSessionToken, validateSessionToken } from "@/features/cross-device-sync/sessionTokens";
import { useSEO } from "@/hooks/use-seo";

const getOrCreateSessionId = () => {
  let id = localStorage.getItem("echo_session_id_v2");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_session_id_v2", id);
  }
  return id;
};

const HandoffPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(true);

  const roomId = params.get("room") ?? "";
  const token = params.get("token") ?? "";

  useSEO({
    title: "Device Handoff – LiveTalk",
    description: "Continue your LiveTalk session on this device with a temporary handoff code.",
  });

  useEffect(() => {
    if (!roomId || !token) {
      setError("Invalid handoff link. Scan the QR code again from your other device.");
      setClaiming(false);
      return;
    }

    (async () => {
      const sessionId = getOrCreateSessionId();
      const valid = await validateSessionToken(roomId, token);
      if (!valid) {
        setError("This handoff code expired or was already used.");
        setClaiming(false);
        return;
      }
      const ok = await consumeSessionToken(roomId, token, sessionId);
      if (!ok) {
        setError("Could not claim this handoff session.");
        setClaiming(false);
        return;
      }
      sessionStorage.setItem("echo.handoff.room", roomId);
      sessionStorage.setItem("echo.handoff.token", token);
      navigate(`/chat?handoff=${encodeURIComponent(roomId)}`, { replace: true });
    })();
  }, [roomId, token, navigate]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center gap-4 bg-background">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        {claiming ? (
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        ) : (
          <Smartphone className="h-7 w-7 text-primary" />
        )}
      </div>
      <h1 className="text-xl font-bold font-display">Cross-device handoff</h1>
      {claiming ? (
        <p className="text-sm text-muted-foreground max-w-sm">Linking this device to your session…</p>
      ) : (
        <>
          <p className="text-sm text-destructive max-w-sm">{error}</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </>
      )}
    </div>
  );
};

export default HandoffPage;
