import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Copy, PhoneOff, Mic, MicOff, Video, VideoOff, Lock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/chat-export";
import { useGroupCall } from "@/hooks/use-group-call";

const VideoTrack = ({ stream, isLocal, label, totalCount }: { stream: MediaStream | null; isLocal?: boolean; label: string; totalCount: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className="w-full h-full bg-[#1a1c1e] rounded-3xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div className="z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Connecting...</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl group border border-white/10">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
            />

            {/* Name Tag */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/10 group-hover:scale-105 transition-transform duration-300">
                <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-primary' : 'bg-green-500'} animate-pulse`} />
                <span className="text-[11px] font-bold text-white uppercase tracking-tighter">{label}</span>
            </div>

            {/* Decorative Glow */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-500 rounded-3xl pointer-events-none" />
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
    const [userId] = useState(() => Math.random().toString(36).substring(2, 12));

    const handleJoin = () => {
        if (encodedPassword && btoa(passwordInput) !== encodedPassword) {
            setPasswordError(true);
            return;
        }
        setPasswordError(false);
        setIsAuthenticated(true);
    };

    const handleLeave = () => navigate("/");

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-[#0a0a0a]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#161618] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold font-display text-white">{roomName}</h2>
                            <p className="text-sm text-muted-foreground/60">Invite Only Group Chat</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Room Password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                            className={`w-full bg-white/5 border ${passwordError ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                            autoFocus
                        />
                        {passwordError && <p className="text-xs text-destructive text-center font-bold uppercase tracking-widest animate-pulse">Wrong Password</p>}
                        <Button onClick={handleJoin} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">Join Securely</Button>
                        <Button onClick={handleLeave} variant="ghost" className="w-full h-11 text-white/40 hover:text-white hover:bg-transparent">Cancel</Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <ActiveGroupRoom roomId={id!} userId={userId} maxMembers={maxMembers} roomName={roomName} onLeave={handleLeave} />;
};

const ActiveGroupRoom = ({ roomId, userId, maxMembers, roomName, onLeave }: { roomId: string, userId: string, maxMembers: number, roomName: string, onLeave: () => void }) => {
    const { toast } = useToast();
    const { localStream, remoteStreams, participants, isMuted, isCameraOff, error, toggleMute, toggleCamera } = useGroupCall({
        roomId,
        userId,
        maxMembers,
    });

    const remoteParticipants = Object.keys(remoteStreams);
    const totalCount = remoteParticipants.length + 1;

    useEffect(() => {
        if (error) {
            toast({ title: "Room Alert", description: error, variant: "destructive" });
            onLeave();
        }
    }, [error, onLeave, toast]);

    const handleCopy = async () => {
        await copyToClipboard(window.location.href);
        toast({ title: "Link Copied", description: "Share it with your friends!" });
    };

    // WhatsApp Inspired dynamic grid (no scroll)
    const getGridConfig = () => {
        if (totalCount === 1) return "flex p-4 items-center justify-center";
        if (totalCount === 2) return "flex flex-col sm:flex-row p-2 gap-2 h-full"; // Side by side
        if (totalCount === 3) return "grid grid-cols-2 grid-rows-2 p-2 gap-2 h-full"; // 1 top, 2 bottom
        if (totalCount === 4) return "grid grid-cols-2 grid-rows-2 p-2 gap-2 h-full"; // 2x2
        return "grid grid-cols-2 sm:grid-cols-3 p-2 gap-2 h-full"; // Grid
    };

    const getItemClass = (index: number) => {
        if (totalCount === 1) return "w-full max-w-[400px] aspect-[3/4] sm:aspect-[4/5] max-h-full";
        if (totalCount === 2) return "flex-1 h-full min-h-0";
        if (totalCount === 3 && index === 0) return "col-span-2 h-full min-h-0"; // First one is big
        return "h-full min-h-0";
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#080808] overflow-hidden">
            {/* Floating Meta Bar */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-2xl border border-white/10 px-6 py-2.5 rounded-full shadow-2xl">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary leading-none mb-1">{roomName}</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-white/80">{totalCount} Live</span>
                    </div>
                </div>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                    <Copy className="w-4 h-4 text-white/40 group-hover:text-white" />
                </button>
            </div>

            {/* Dynamic Non-Scrolling Grid */}
            <main className="flex-1 w-full relative pt-24 pb-32">
                <div className={getGridConfig()}>
                    {/* Local Participant */}
                    <div className={getItemClass(0)}>
                        <VideoTrack stream={localStream} isLocal={true} label="You" totalCount={totalCount} />
                    </div>

                    {/* Remote Participants */}
                    {remoteParticipants.map((peerId, idx) => (
                        <div key={peerId} className={getItemClass(idx + 1)}>
                            <VideoTrack stream={remoteStreams[peerId]} label="Partner" totalCount={totalCount} />
                        </div>
                    ))}

                    {/* Empty State Prompt */}
                    {totalCount === 1 && (
                        <div className="absolute inset-x-0 bottom-40 flex flex-col items-center pointer-events-none gap-4">
                            <div className="bg-primary/10 backdrop-blur-md px-6 py-3 rounded-full border border-primary/20 animate-bounce">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest text-center leading-none">
                                    Waiting for others...<br />
                                    <span className="text-[10px] text-primary/60 font-medium">Share the link to start!</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Control Strip */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-5 bg-white/5 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-[40px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)]">
                <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className={`w-14 h-14 rounded-full transition-all duration-500 ${isMuted ? 'bg-destructive/20 text-destructive border border-destructive/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                <Button
                    onClick={toggleCamera}
                    variant="ghost"
                    size="icon"
                    className={`w-14 h-14 rounded-full transition-all duration-500 ${isCameraOff ? 'bg-destructive/20 text-destructive border border-destructive/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
                <div className="w-px h-10 bg-white/10 mx-1" />
                <Button
                    onClick={onLeave}
                    className="w-16 h-16 rounded-full bg-destructive text-white shadow-2xl hover:bg-destructive/90 hover:scale-110 active:scale-95 transition-all border-none"
                >
                    <PhoneOff className="w-7 h-7" />
                </Button>
            </div>

            {/* Screen Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent)] pointer-events-none" />
        </div>
    );
};

export default GroupRoomPage;
