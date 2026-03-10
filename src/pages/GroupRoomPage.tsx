import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Copy, Users, Lock, LogOut, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/chat-export";
import { useGroupChat } from "@/hooks/use-group-chat";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import type { Message } from "@/hooks/use-chat";

const GroupRoomPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const roomName = searchParams.get("n") || "Group Room";
    const maxMembers = parseInt(searchParams.get("m") || "5", 10);
    const encodedPassword = searchParams.get("p");

    const [isAuthenticated, setIsAuthenticated] = useState(!encodedPassword);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    // Store user info in a ref or state
    const [userId] = useState(() => Math.random().toString(36).substring(2, 12));
    const [userNickname, setUserNickname] = useState("");
    const [isNamed, setIsNamed] = useState(false);

    const handleJoinWithPassword = () => {
        if (encodedPassword && btoa(passwordInput) !== encodedPassword) {
            setPasswordError(true);
            return;
        }
        setPasswordError(false);
        setIsAuthenticated(true);
    };

    const handleSetName = (e: React.FormEvent) => {
        e.preventDefault();
        if (userNickname.trim()) {
            setIsNamed(true);
        }
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
                            onKeyDown={(e) => e.key === "Enter" && handleJoinWithPassword()}
                            className={`w-full bg-white/5 border ${passwordError ? 'border-destructive' : 'border-white/10'} rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                            autoFocus
                        />
                        {passwordError && <p className="text-xs text-destructive text-center font-bold uppercase tracking-widest animate-pulse">Wrong Password</p>}
                        <Button onClick={handleJoinWithPassword} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">Join Securely</Button>
                        <Button onClick={handleLeave} variant="ghost" className="w-full h-11 text-white/40 hover:text-white hover:bg-transparent">Cancel</Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!isNamed) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-[#0a0a0a]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#161618] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold font-display text-white">Choose a Nickname</h2>
                            <p className="text-sm text-muted-foreground/60">Join {roomName}</p>
                        </div>
                    </div>
                    <form onSubmit={handleSetName} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Your Nickname"
                            value={userNickname}
                            onChange={(e) => setUserNickname(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            autoFocus
                            maxLength={20}
                        />
                        <Button disabled={!userNickname.trim()} type="submit" className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">Enter Room</Button>
                        <Button type="button" onClick={handleLeave} variant="ghost" className="w-full h-11 text-white/40 hover:text-white hover:bg-transparent">Cancel</Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return <ActiveGroupRoom roomId={id!} userId={userId} userNickname={userNickname.trim()} maxMembers={maxMembers} roomName={roomName} onLeave={handleLeave} />;
};

const ActiveGroupRoom = ({ roomId, userId, userNickname, maxMembers, roomName, onLeave }: { roomId: string, userId: string, userNickname: string, maxMembers: number, roomName: string, onLeave: () => void }) => {
    const { toast } = useToast();
    const { messages, participants, error, sendMessage } = useGroupChat({
        roomId,
        userId,
        userNickname,
        maxMembers,
    });

    const [showInfo, setShowInfo] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const totalCount = Object.keys(participants).length + 1; // Others + You

    const handleCopy = async () => {
        await copyToClipboard(window.location.href);
        toast({ title: "Link Copied", description: "Share it with your friends to join!" });
    };

    // Convert GroupMessage to standard Message format for UI components
    const uiMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        senderId: msg.senderId,
        senderNickname: msg.senderNickname,
        read: true,
        reactions: {}
    }));

    // Adding instructions
    const HOW_TO_USE = [
        "1. Share the URL with friends (up to 5 people)",
        "2. Wait for friends to join the chat",
        "3. Type messages securely",
        "4. You can also send images and gifs",
        "5. Leave the room safely anytime"
    ];

    return (
        <div className="flex flex-col h-[100dvh] bg-background relative z-0">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onLeave} className="text-muted-foreground mr-1">
                        <LogOut className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-sm font-bold text-foreground leading-tight">{roomName}</h1>
                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            {totalCount} / {maxMembers} Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Info className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors">
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* How to use info box */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 bg-muted/50 border-b border-border overflow-hidden"
                    >
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">How to Use Group Chat</h3>
                        <ul className="space-y-1">
                            {HOW_TO_USE.map((step, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state embedded instructions if no messages yet */}
            {uiMessages.length === 0 && !showInfo && (
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none text-center">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xs space-y-4">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold font-display text-foreground">{roomName}</h2>

                        <div
                            className="bg-card/50 backdrop-blur-sm border border-border p-4 rounded-2xl text-left pointer-events-auto relative cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={(e) => {
                                const el = e.currentTarget;
                                el.style.opacity = '0';
                                setTimeout(() => el.style.display = 'none', 300);
                            }}
                        >
                            <button className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full text-primary-foreground flex items-center justify-center shadow-md">
                                <span className="text-xs font-bold">×</span>
                            </button>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">New</span>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">LiveTalk Groups</h3>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Share the link to start chatting instantly with up to 4 other friends! No sign-ups required.
                            </p>
                            <Button onClick={(e) => { e.stopPropagation(); handleCopy(); }} variant="outline" size="sm" className="w-full mt-4 h-9 text-xs">
                                <Copy className="w-3 h-3 mr-2" /> Share Link Now
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Chat Messages */}
            <ChatMessageList
                messages={uiMessages}
                strangerTyping={false}
                onReact={() => { /* Reaction handling for groups can be added later */ }}
                onReply={(msg) => setReplyingTo(msg)}
            />

            {/* Chat Input */}
            <ChatInput
                status="connected"
                hideGames={true}
                onSend={(text, imageUrl) => {
                    // Handing messages logic securely
                    if (text) sendMessage(text);
                }}
                onImageUpload={() => {
                    toast({ description: "Image sharing is coming soon to group chats!" });
                }}
                onTyping={() => { }}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
        </div>
    );
};

export default GroupRoomPage;
