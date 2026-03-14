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
        title: "Safety Center & Privacy Guide",
        description: "Your comprehensive guide to staying safe on LiveTalk by Likki. Learn about anonymous chat safety, data privacy, and community protection."
    });

    const fadeUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-[130px] float-slow" />
        <div className="absolute bottom-[20%] left-[-15%] w-80 h-80 rounded-full bg-accent/8 blur-[110px] float-medium" />
      </div>

      <Header onlineCount={onlineCount} />
      
      <main className="flex-1 px-6 pb-28 pt-8 max-w-3xl mx-auto w-full relative z-10 space-y-12">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <div className="p-2 rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </div>
          Back to Home
        </motion.button>

        <motion.section {...fadeUp} className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest">
              <Shield className="h-3.5 w-3.5" /> Safety & Trust
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/20 px-4 py-1.5 text-xs font-bold text-destructive uppercase tracking-widest">
              18+ Only
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold font-display text-foreground leading-[1.1]">
            Safety Center <br />
            <span className="text-gradient">& Privacy Guide</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-2xl font-medium">
            At LiveTalk by Likki, your security is our foundation. This center provides the tools and knowledge you need to chat anonymously while staying 100% protected.
          </p>
        </motion.section>

        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="rounded-[2.5rem] border border-border/50 bg-card/30 backdrop-blur-sm p-8 space-y-4 hover:bg-card/50 transition-all duration-500"
          >
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-xl">Zero Logs</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              We never store chat history, IP addresses, or personal data. Once the chat ends, the data is permanently erased.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2.5rem] border border-border/50 bg-card/30 backdrop-blur-sm p-8 space-y-4 hover:bg-card/50 transition-all duration-500"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <EyeOff className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-xl">Total Anonymity</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              No accounts, no phone numbers, no social logins. You are truly anonymous from the second you open the app.
            </p>
          </motion.div>
        </div>

        <motion.section {...fadeUp} transition={{ delay: 0.2 }} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-primary" />
              Safe Chatting Checklist
            </h2>
          </div>
          <div className="grid gap-4">
            <TipItem
              title="Don't share personal info"
              desc="Never give out your full name, home address, school, phone number, or social media handles. Scammers often start with small talk to gain trust."
            />
            <TipItem
              title="Be careful with images"
              desc="Images can contain GPS location data or background details that reveal your identity. Only share images if you trust the context."
            />
            <TipItem
              title="Trust your instincts"
              desc="If someone makes you feel uncomfortable, press 'Next' immediately. You don't owe anyone an explanation or a goodbye."
            />
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="rounded-[3rem] bg-gradient-to-br from-secondary/50 via-card/30 to-secondary/20 p-8 sm:p-12 space-y-8 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users className="h-32 w-32" />
            </div>
            <div className="space-y-3 relative z-10">
              <h2 className="text-3xl font-bold text-foreground">Guide for Parents</h2>
              <p className="text-sm font-bold text-primary italic uppercase tracking-widest">Important information for safeguarding young users.</p>
            </div>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed relative z-10 font-medium">
              <p>
                LiveTalk is a platform for <strong>users 18 years and older</strong>. We encourage parents to talk openly with their teenagers about online risks.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-background/50 border border-border/30">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p><strong>Education is key:</strong> Remind your teen that people online may not be who they say they are.</p>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-background/50 border border-border/30">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p><strong>Report abuse:</strong> Teach them how to use our "Report" and "Block" features immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ delay: 0.4 }} className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <LifeBuoy className="h-7 w-7 text-primary" />
            Reporting & Resources
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "NCMEC", url: "https://www.missingkids.org", desc: "Missing & Exploited Children" },
              { name: "CCRI", url: "https://www.cybercivilrights.org", desc: "Cyber Civil Rights" },
              { name: "StopBullying", url: "https://www.stopbullying.gov", desc: "Anti-bullying resources" },
              { name: "CyberTip", url: "https://www.cybertip.org", desc: "Report online exploitation" },
            ].map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 rounded-[2rem] border border-border/50 bg-card/30 p-6 hover:border-primary/40 transition-all hover:bg-card/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{r.name}</span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{r.desc}</span>
              </a>
            ))}
          </div>
        </motion.section>

        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="text-center space-y-6 pt-12 pb-16 border-t border-border/50">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-bounce">
            <HandMetal className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Stay Safe, Have Fun</h2>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              LiveTalk is a global community. Let's keep it respectful, secure, and fun for everyone.
            </p>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex h-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-r from-primary to-accent px-10 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            Start Chatting Safely
          </button>
          
          <div className="flex justify-center gap-6 mt-12 text-xs font-bold text-muted-foreground/40 tracking-widest uppercase">
            <a href="/info" className="hover:text-primary transition-colors">About</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          </div>
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
