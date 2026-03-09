import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Copy, PhoneOff, Mic, MicOff, Video, VideoOff, MessageSquare, Lock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/chat-export";
import { useGroupCall } from "@/hooks/use-group-call";

// Helper component to render a stream to a <video> tag
const VideoTrack = ({ stream, isLocal, label }: { stream: MediaStream | null; isLocal?: boolean; label: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className="w-full h-full bg-secondary border border-border/50 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-lg border border-border/20 group">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Always mute local video to prevent echo!
                className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
            />
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium text-foreground border border-border/50 transition-opacity">
                {label}
            </div>
        </div>
    );
};

const GroupRoomPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const roomName = searchParams.get("n") || "Group Room";
    const maxMembers = parseInt(searchParams.get("m") || "4", 10);
    const encodedPassword = searchParams.get("p");

    const [isAuthenticated, setIsAuthenticated] = useState(!encodedPassword);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [userId] = useState(() => Math.random().toString(36).substring(2, 10)); // Persistent random ID

    const handleJoin = () => {
        if (encodedPassword && btoa(passwordInput) !== encodedPassword) {
            setPasswordError(true);
            return;
        }
        setPasswordError(false);
        setIsAuthenticated(true);
    };

    const handleCopyLink = async () => {
        const ok = await copyToClipboard(window.location.href);
        toast({ title: ok ? "📋 Link copied!" : "Failed to copy", description: ok ? "Share this with your friends" : "" });
    };

    const handleLeave = () => {
        navigate("/");
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-background">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-card border border-border/50 p-6 rounded-3xl shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold font-display">{roomName}</h2>
                        <p className="text-sm text-muted-foreground">This group room is password protected.</p>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="password"
                            placeholder="Enter password to join"
                            value={passwordInput}
                            onChange={(e) => {
                                setPasswordInput(e.target.value);
                                setPasswordError(false);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                            className={`w-full bg-secondary/50 border ${passwordError ? 'border-destructive' : 'border-border/50'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground`}
                            autoFocus
                        />
                        {passwordError && <p className="text-xs text-destructive text-center animate-pulse">Incorrect password</p>}
                        <Button onClick={handleJoin} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold">Join Group</Button>
                        <Button onClick={handleLeave} variant="ghost" className="w-full h-11 rounded-xl">Go Back</Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <ActiveGroupRoom roomId={id!} userId={userId} maxMembers={maxMembers} roomName={roomName} onLeave={handleLeave} onCopyLink={handleCopyLink} />;
};

interface ActiveGroupRoomProps {
    roomId: string;
    userId: string;
    maxMembers: number;
    roomName: string;
    onLeave: () => void;
    onCopyLink: () => void;
}

const ActiveGroupRoom = ({ roomId, userId, maxMembers, roomName, onLeave, onCopyLink }: ActiveGroupRoomProps) => {
    const { toast } = useToast();
    const { localStream, remoteStreams, participants, isMuted, isCameraOff, error, toggleMute, toggleCamera } = useGroupCall({
        roomId,
        userId,
        maxMembers,
    });

    const participantCount = Object.keys(remoteStreams).length + 1;

    useEffect(() => {
        if (error) {
            toast({ title: "Error joining room", description: error, variant: "destructive" });
            onLeave();
        }
    }, [error, onLeave, toast]);

    // Determine dynamic grid class (similar to WhatsApp)
    const getGridClass = () => {
        const total = Object.keys(remoteStreams).length + 1; // +1 for local
        if (total === 1) return "grid-cols-1 md:grid-cols-1";
        if (total === 2) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-2";
        if (total <= 4) return "grid-cols-2 lg:grid-cols-2";
        return "grid-cols-2 lg:grid-cols-3"; // Up to 5-6
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 glass z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <span className="font-bold text-primary font-display">{roomName.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-sm text-foreground leading-tight">{roomName}</h1>
                        <p className="text-[10px] text-muted-foreground">{participantCount} / {maxMembers} participants</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCopyLink} className="h-9 px-3 gap-2 text-xs rounded-xl border-dashed">
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Invite Link</span>
                    </Button>
                    <Button variant="danger" size="sm" onClick={onLeave} className="h-9 w-9 p-0 sm:w-auto sm:px-3 sm:gap-2 rounded-xl">
                        <PhoneOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Video Grid Area */}
                <div className="flex-1 flex flex-col p-2 sm:p-4 pb-24 sm:pb-28 overflow-y-auto">
                    <div className={`flex-1 grid gap-2 sm:gap-4 auto-rows-fr ${getGridClass()}`}>

                        <VideoTrack stream={localStream} isLocal={true} label={`You (${isMuted ? 'Muted' : 'Mic On'})`} />

                        {Object.entries(remoteStreams).map(([peerId, stream]) => (
                            <VideoTrack key={peerId} stream={stream} label={`Participant`} />
                        ))}

                        {/* Waiting Placeholders (fill up to max capacity visual if 1 person) */}
                        {participantCount === 1 && (
                            <div className="relative rounded-2xl overflow-hidden bg-muted/40 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 opacity-70">
                                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center animate-pulse">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium text-center px-4">
                                    Waiting for others to join...<br />
                                    <span className="opacity-75">Share the invite link!</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar (Pinned Bottom Center) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/90 backdrop-blur-lg border border-border/50 shadow-2xl px-4 py-2.5 rounded-full z-20">
                    <Button
                        onClick={toggleMute}
                        variant={isMuted ? "danger" : "outline"}
                        size="icon"
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${isMuted ? '' : 'border-border/50 bg-background hover:bg-muted'}`}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button
                        onClick={toggleCamera}
                        variant={isCameraOff ? "danger" : "outline"}
                        size="icon"
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${isCameraOff ? '' : 'border-border/50 bg-background hover:bg-muted'}`}
                    >
                        {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <Button variant="danger" size="icon" onClick={onLeave} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md">
                        <PhoneOff className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GroupRoomPage;
