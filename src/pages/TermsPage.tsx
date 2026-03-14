import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale, Users, Ban, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { useSEO } from "@/hooks/use-seo";

const TermsPage = () => {
  const navigate = useNavigate();
  const onlineCount = useOnlineCount();
  useSEO({ 
    title: "Terms of Service", 
    description: "Read the Terms of Service for LiveTalk by Likki. User rules, age requirements, and community guidelines for anonymous chatting.",
    keywords: "terms of service, user agreement, community guidelines, chat rules, 18+ chat terms"
  });

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-5%] w-80 h-80 rounded-full bg-primary/10 blur-[130px] float-slow" />
        <div className="absolute bottom-[15%] right-[-10%] w-72 h-72 rounded-full bg-accent/8 blur-[110px] float-medium" />
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
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-5 py-2 text-xs font-bold text-accent uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5" /> Community Rules
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold font-display text-foreground leading-tight">
            Terms of <span className="text-gradient">Service</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-2xl font-medium">
            By using LiveTalk by Likki, you agree to these simple rules designed to keep our community safe, anonymous, and fun.
          </p>
        </motion.section>

        <section className="space-y-6 sm:space-y-8">
          <TermsCard 
            icon={<Scale className="h-6 w-6" />}
            title="1. Age Requirement"
            desc="You must be at least 18 years old to use LiveTalk. By accessing this service, you represent and warrant that you meet this age requirement."
          />

          <TermsCard 
            icon={<Ban className="h-6 w-6" />}
            title="2. Prohibited Conduct"
            desc="You agree not to use LiveTalk for any illegal activity, harassment, hate speech, or the distribution of explicit content without consent. We reserve the right to ban users who violate these guidelines."
          />

          <TermsCard 
            icon={<Users className="h-6 w-6" />}
            title="3. User Responsibility"
            desc="You are solely responsible for your interactions with other users. LiveTalk is an anonymous platform, and you should exercise caution when sharing any information with strangers."
          />

          <TermsCard 
            icon={<AlertTriangle className="h-6 w-6" />}
            title="4. Disclaimer of Liability"
            desc='LiveTalk by Likki is provided "as is" without any warranties. We are not responsible for the behavior of our users or for any consequences arising from your use of the platform.'
          />
        </section>

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
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

const TermsCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group p-6 sm:p-8 rounded-[2rem] border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-accent/30 transition-all duration-500"
  >
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-500">
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

export default TermsPage;
