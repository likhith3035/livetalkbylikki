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
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[-5%] w-72 h-72 rounded-full bg-primary/10 blur-[120px] float-slow" />
        <div className="absolute bottom-[10%] left-[-10%] w-64 h-64 rounded-full bg-accent/8 blur-[100px] float-medium" />
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2 text-xs font-bold text-primary uppercase tracking-widest">
            <Shield className="h-3.5 w-3.5" /> Privacy First
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold font-display text-foreground leading-tight">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-2xl font-medium">
            At LiveTalk by Likki, privacy isn't just a feature—it's our entire foundation. Here is how we protect your digital footprint.
          </p>
        </motion.section>

        <div className="grid gap-6 sm:gap-8">
          <section className="space-y-8">
            <PrivacyCard 
              icon={<EyeOff className="h-6 w-6" />}
              title="1. No Data Collection"
              desc="We do not collect or store any personal information. This includes your name, email address, phone number, or IP address. There are no user accounts, and no registration is ever required."
            />

            <PrivacyCard 
              icon={<Trash2 className="h-6 w-6" />}
              title="2. Zero Retention"
              desc="Your chat messages and shared media exist only in the temporary memory of your browser and the stranger's browser. Once a session ends or the window is closed, all data is permanently and irreversibly deleted."
            />

            <PrivacyCard 
              icon={<Lock className="h-6 w-6" />}
              title="3. Peer-to-Peer Encryption"
              desc="Video and audio calls are direct (peer-to-peer) between users. We use industry-standard encryption to ensure that your communication remains private and inaccessible to any third party, including us."
            />

            <PrivacyCard 
              icon={<UserCheck className="h-6 w-6" />}
              title="4. Third-Party Services"
              desc="We use trusted providers for infrastructure (Supabase for real-time signaling, Tenor for GIFs). These services are only used to facilitate the chat experience and do not have access to your private conversations."
            />
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center pt-16 border-t border-border/50"
        >
          <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            Last updated: March 14, 2026 · LiveTalk by Likki
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-muted-foreground/40 tracking-widest uppercase">
            <a href="/info" className="hover:text-primary transition-colors">About</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

const PrivacyCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group p-6 sm:p-8 rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/20 transition-all duration-500"
  >
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-3 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed font-medium">
          {desc}
        </p>
      </div>
    </div>
  </motion.div>
)

export default PrivacyPage;
