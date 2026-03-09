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

    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [roomName, setRoomName] = useState("");
    const [maxMembers, setMaxMembers] = useState(4);
    const [password, setPassword] = useState("");

    const slugify = (text: string) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleCreateGroup = () => {
        if (!roomName.trim()) return;

        // Generate a random room ID for unique new rooms
        const roomId = Math.random().toString(36).substring(2, 9);

        // Encode settings into URL
        const params = new URLSearchParams();
        params.set("n", roomName.trim());
        params.set("m", maxMembers.toString());
        if (password.trim()) {
            // In a real app we'd hash, but simple Base64 encoding for basic obfuscation here
            params.set("p", btoa(password.trim()));
        }

        navigate(`/group/${roomId}?${params.toString()}`);
    };

    const handleJoinByDetails = () => {
        if (!roomName.trim()) return;

        // When joining by name, the ID is derived from the name
        // This allows people to join the "same" room by typing the same name
        const roomId = slugify(roomName);

        const params = new URLSearchParams();
        params.set("n", roomName.trim());
        params.set("m", "5"); // Default max for manual join as we don't know it
        if (password.trim()) {
            params.set("p", btoa(password.trim()));
        }

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

                <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/50 mb-8">
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === "create" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Create New
                    </button>
                    <button
                        onClick={() => setActiveTab("join")}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === "join" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Join Existing
                    </button>
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5 bg-card border border-border/50 p-6 rounded-3xl shadow-sm"
                >
                    {activeTab === "create" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Room Name</label>
                                <input
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="e.g. Squad Hangout"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
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
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleCreateGroup}
                                    disabled={!roomName.trim()}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent font-bold text-lg text-primary-foreground shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Room
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Group Name</label>
                                <input
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="Enter the exact group name"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center justify-between">
                                    <span>Group Password</span>
                                    <Lock className="w-3 h-3" />
                                </label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password if required"
                                    type="password"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleJoinByDetails}
                                    disabled={!roomName.trim()}
                                    className="w-full h-14 rounded-2xl bg-primary font-bold text-lg text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
                                >
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                    Join Group
                                </Button>
                                <p className="text-[10px] text-muted-foreground text-center mt-4">
                                    Note: Group names are case-insensitive and special characters are ignored.
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            </main>

            <BottomNav />
        </div>
    );
};

export default GroupSetupPage;
