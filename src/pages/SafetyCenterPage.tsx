import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Shield, Lock, EyeOff, AlertTriangle,
    Users, CheckCircle2, MessageSquare, Heart,
    Zap, Info, LifeBuoy, HandMetal
} from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";

const SafetyCenterPage = () => {
    const navigate = useNavigate();
    const onlineCount = useOnlineCount();

    useSEO({
        title: "Safety Center – LiveTalk",
        description: "Your guide to staying safe on LiveTalk and across the internet. Learn about anonymous chat safety, privacy tips, and how we protect our community."
    });

    const fadeUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header onlineCount={onlineCount} />

            <main className="flex-1 px-5 pb-28 pt-8 max-w-2xl mx-auto w-full space-y-12">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </button>

                {/* Hero Section */}
                <motion.section {...fadeUp} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                            <Shield className="h-3.5 w-3.5" /> Safety & Trust
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-semibold text-destructive uppercase tracking-wider">
                            18+ Only
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground leading-[1.1]">
                        Safety Center <br />
                        <span className="text-primary">& Privacy Guide</span>
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        At LiveTalk by Likki, your security is our foundation. This center provides the tools and knowledge you need to chat anonymously while staying 100% protected.
                    </p>
                </motion.section>

                {/* Core Pillars */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <Lock className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg">Zero Logs</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We never store chat history, IP addresses, or personal data. Once the chat ends, the data is permanently erased from the planet.
                        </p>
                    </motion.div>
                    <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <EyeOff className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg">Total Anonymity</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            No accounts, no phone numbers, no social logins. You are truly anonymous from the second you open the app.
                        </p>
                    </motion.div>
                </div>

                {/* Essential Safety Tips (Articles) */}
                <motion.section {...fadeUp} transition={{ delay: 0.3 }} className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        Safe Chatting Checklist
                    </h2>
                    <div className="space-y-4">
                        <TipItem
                            title="Don't share personal info"
                            desc="Never give out your full name, home address, school, phone number, or social media handles. Professional scammers often start with friendly small talk to gain your trust."
                        />
                        <TipItem
                            title="Be careful with images"
                            desc="Images can contain 'metadata' (like GPS location) or background details that reveal where you are. Only share images if you trust the context of the conversation."
                        />
                        <TipItem
                            title="Trust your instincts"
                            desc="If someone makes you feel uncomfortable, press 'Next' immediately. You don't owe anyone an explanation or a goodbye."
                        />
                        <TipItem
                            title="Beware of 'fishing' links"
                            desc="If a stranger sends you a link to a website asking for a login or download, disconnect. LiveTalk will never ask you to download software from a link in chat."
                        />
                    </div>
                </motion.section>

                {/* Parental Guide (SEO Gold) */}
                <motion.section {...fadeUp} transition={{ delay: 0.4 }} className="space-y-6 pt-6">
                    <div className="rounded-3xl bg-secondary/30 p-8 space-y-6 border border-border/50">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Guide for Parents</h2>
                            <p className="text-sm text-muted-foreground italic">Important information for safeguarding young users.</p>
                        </div>
                        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                            <p>
                                LiveTalk is a platform for <strong>users 18 years and older</strong>. We encourage parents to talk openly with their teenagers about the risks of anonymous online platforms and to monitor their digital activity.
                            </p>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <p><strong>Education is key:</strong> Remind your teen that people online may not be who they say they are.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <p><strong>Report abuse:</strong> Teach them how to use our "Report" and "Block" features immediately if they witness inappropriate behavior.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <p><strong>Private settings:</strong> Ensure your home internet features safe-browsing filters to manage access to unmoderated content.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Resources Section */}
                <motion.section {...fadeUp} transition={{ delay: 0.5 }} className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LifeBuoy className="h-6 w-6 text-primary" />
                        Reporting & Resources
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        We are committed to a safe community. If you encounter illegal activity, please use these official resources:
                    </p>
                    <div className="grid gap-3">
                        {[
                            { name: "NCMEC (Missing & Exploited Children)", url: "https://www.missingkids.org" },
                            { name: "Cyber Civil Rights (Revenge Porn)", url: "https://www.cybercivilrights.org" },
                            { name: "StopBullying.gov", url: "https://www.stopbullying.gov" },
                        ].map((r) => (
                            <a
                                key={r.name}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between rounded-2xl bg-card border border-border p-4 hover:border-primary/40 transition-all hover:bg-secondary/40"
                            >
                                <span className="text-sm font-semibold">{r.name}</span>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                </motion.section>

                {/* Final Statement */}
                <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="text-center space-y-4 pt-10">
                    <HandMetal className="h-10 w-10 text-primary mx-auto animate-bounce" />
                    <h2 className="text-xl font-bold">Stay Safe, Have Fun</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        LiveTalk is more than an app — it's a global community. Let's keep it respectful, secure, and fun for everyone.
                    </p>
                    <button
                        onClick={() => navigate("/chat")}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                        Start Chatting Safely
                    </button>
                </motion.div>

            </main>

            <BottomNav />
        </div>
    );
};

const TipItem = ({ title, desc }: { title: string; desc: string }) => (
    <div className="flex gap-4 items-start p-4 rounded-2xl bg-secondary/20 border border-border/30">
        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
            !
        </div>
        <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    </div>
)

export default SafetyCenterPage;
