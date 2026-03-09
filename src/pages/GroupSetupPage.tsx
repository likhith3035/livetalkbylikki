import { useState } from "react";
import { Users, Lock, Settings, Plus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { Button } from "@/components/ui/button";

const GroupSetupPage = () => {
    const navigate = useNavigate();
    const onlineCount = useOnlineCount();

    const [roomName, setRoomName] = useState("");
    const [maxMembers, setMaxMembers] = useState(4);
    const [password, setPassword] = useState("");

    const handleCreateGroup = () => {
        if (!roomName.trim()) return;

        // Generate a random room ID
        const roomId = Math.random().toString(36).substring(2, 9);

        // Encode settings into URL hash/params
        const params = new URLSearchParams();
        params.set("n", roomName.trim());
        params.set("m", maxMembers.toString());
        if (password.trim()) {
            // In a real app we'd hash, but simple Base64 encoding for basic obfuscation here
            params.set("p", btoa(password.trim()));
        }

        // Navigate to room with settings in the URL
        navigate(`/group/${roomId}?${params.toString()}`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header onlineCount={onlineCount} />

            <main className="flex-1 px-5 pb-28 pt-8 max-w-lg mx-auto w-full space-y-8">
                <div className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold font-display text-foreground">Create Group Chat</h1>
                    <p className="text-sm text-muted-foreground">Start a private group call with up to 5 people.</p>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 bg-card border border-border/50 p-5 rounded-2xl shadow-sm">

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Room Name</label>
                        <input
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="e.g. Squad Hangout"
                            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                            maxLength={30}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Maximum Members</label>
                        <div className="flex bg-secondary/50 rounded-xl p-1 border border-border/50">
                            {[2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setMaxMembers(num)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${maxMembers === num ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center justify-between">
                            <span>Password (Optional)</span>
                            <Lock className="w-3 h-3" />
                        </label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank for open invite"
                            type="password"
                            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!roomName.trim()}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent font-bold text-primary-foreground shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Room
                        </Button>
                    </div>
                </motion.div>
            </main>

            <BottomNav />
        </div>
    );
};

export default GroupSetupPage;
