import { useState } from "react";
import { Link2, ArrowRight } from "lucide-react";
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

const PrivateRoomDialog = ({ onCreateRoom, onJoinRoom, disabled }: PrivateRoomDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = () => {
    onCreateRoom(); // Calls createPrivateRoom which triggers joinPrivateRoom(code, true)
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setJoinCode("");
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

export default PrivateRoomDialog;
