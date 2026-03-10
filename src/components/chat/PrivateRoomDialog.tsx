import { useState } from "react";
import { Link2, Copy, Check, Hash, ArrowRight } from "lucide-react";
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

interface PrivateRoomDialogProps {
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => void;
  disabled?: boolean;
}

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const PrivateRoomDialog = ({ onCreateRoom, onJoinRoom, disabled }: PrivateRoomDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    const code = onCreateRoom();
    setCreatedCode(code);
  };

  const handleCopyLink = async () => {
    if (!createdCode) return;
    const url = `https://LiveTalkbylikki.netlify.app/room/${createdCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friend." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    toast({ title: "Code copied!" });
    setTimeout(() => setCopied(false), 2000);
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCreatedCode(null);
      setJoinCode("");
      setCopied(false);
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
            {!createdCode ? (
              <Button onClick={handleCreate} variant="glow" className="w-full gap-2">
                <Link2 className="h-4 w-4" />
                Generate Room Link
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-secondary border border-border p-3">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">
                    {createdCode}
                  </span>
                  <Button size="sm" variant="ghost" onClick={handleCopyCode} className="h-8 px-2">
                    {copied ? <Check className="h-4 w-4 text-online" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleCopyLink} variant="secondary" className="w-full gap-2 text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  Copy Full Link
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Share the link or code with your friend. You'll be connected when they join!
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Join room */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Join with code</p>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter code"
                className="font-mono text-center tracking-widest uppercase"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button onClick={handleJoin} variant="default" size="icon" className="shrink-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { generateCode };
export default PrivateRoomDialog;
