import { useState, useCallback } from "react";
import { Link2, ArrowRight, Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence } from "framer-motion";
import QrScanner from "@/components/chat/QrScanner";
import { cn } from "@/lib/utils";

interface PrivateRoomDialogProps {
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => void;
  disabled?: boolean;
}

const PrivateRoomDialog = ({ onCreateRoom, onJoinRoom, disabled }: PrivateRoomDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinMode, setJoinMode] = useState<"code" | "scan">("code");

  const handleCreate = () => {
    onCreateRoom();
    setOpen(false);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast({ title: "Invalid code", description: "Please enter a valid room code.", variant: "destructive" });
      return;
    }
    onJoinRoom(code);
    setOpen(false);
    setJoinCode("");
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    // Extract room code from URL or use raw text
    let code = decodedText.trim().toUpperCase();

    // If it's a URL like https://incogtalkk.netlify.app/room/ABCDEF
    const urlMatch = decodedText.match(/\/room\/([A-Za-z0-9]+)/i);
    if (urlMatch) {
      code = urlMatch[1].toUpperCase();
    }

    if (code.length >= 4) {
      toast({ title: "✅ QR Scanned!", description: `Joining room ${code}...` });
      onJoinRoom(code);
      setOpen(false);
    } else {
      toast({ title: "Invalid QR", description: "This QR code doesn't contain a valid room code.", variant: "destructive" });
    }
  }, [onJoinRoom, toast]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setJoinCode("");
      setJoinMode("code");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="gap-1.5 h-8 px-2 sm:px-3 text-xs"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Room</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Private Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Create room */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Create a room</p>
            <Button onClick={handleCreate} variant="glow" className="w-full gap-2">
              <Link2 className="h-4 w-4" />
              Generate Room &amp; Show QR
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              A QR code and invite link will be generated for your friend to scan or click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or join a room</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Join room — Tabbed: Code / Scan */}
          <div className="space-y-3">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-muted/50 p-0.5 border border-border/40">
              <button
                onClick={() => setJoinMode("code")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200",
                  joinMode === "code"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Keyboard className="h-3.5 w-3.5" />
                Enter Code
              </button>
              <button
                onClick={() => setJoinMode("scan")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200",
                  joinMode === "scan"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                Scan QR
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {joinMode === "code" ? (
                <div key="code-input" className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="Enter room code"
                      className="font-mono text-center tracking-widest uppercase"
                      maxLength={6}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    />
                    <Button onClick={handleJoin} variant="default" size="icon" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Ask your friend for the 6-character room code
                  </p>
                </div>
              ) : (
                <QrScanner
                  key="qr-scanner"
                  onScanSuccess={handleScanSuccess}
                  onClose={() => setJoinMode("code")}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateRoomDialog;

