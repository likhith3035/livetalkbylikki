import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, EyeOff, UserCheck, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";

const PrivacyPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  useSEO({ 
    title: "Privacy Policy", 
    description: "Learn how LiveTalk by Likki protects your privacy. We store zero data, use no tracking, and ensure 100% anonymous conversations.",
    keywords: "privacy policy, data privacy, anonymous chat privacy, zero data collection, encrypted chat policy"
  });

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />
      <main className="flex-1 px-5 pb-28 pt-8 max-w-2xl mx-auto w-full space-y-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>

        <motion.section {...fadeUp} className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Shield className="h-3.5 w-3.5" /> Privacy First
          </div>
          <h1 className="text-4xl font-bold font-display text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            At LiveTalk by Likki, privacy isn't just a feature—it's our entire foundation. Here is how we protect you.
          </p>
        </motion.section>

        <section className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" /> 1. No Data Collection
            </h2>
            <p>
              We do not collect or store any personal information. This includes your name, email address, phone number, or IP address. There are no user accounts, and no registration is ever required.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" /> 2. Zero Retention
            </h2>
            <p>
              Your chat messages and shared media exist only in the temporary memory of your browser and the stranger's browser. Once a session ends or the window is closed, all data is permanently and irreversibly deleted.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> 3. Peer-to-Peer Encryption
            </h2>
            <p>
              Video and audio calls are direct (peer-to-peer) between users. We use industry-standard encryption to ensure that your communication remains private and inaccessible to any third party, including us.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> 4. Third-Party Services
            </h2>
            <p>
              We use trusted providers for infrastructure (Supabase for real-time signaling, Tenor for GIFs). These services are only used to facilitate the chat experience and do not have access to your private conversations.
            </p>
          </div>
        </section>

        <div className="text-center pt-10">
          <p className="text-xs text-muted-foreground/50">
            Last updated: March 12, 2026 · LiveTalk by Likki
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default PrivacyPage;
