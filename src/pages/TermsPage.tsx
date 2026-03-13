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
    description: "Read the Terms of Service for LiveTalk by Likki. User rules, age requirements, and community guidelines for anonymous chatting." 
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
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            <FileText className="h-3.5 w-3.5" /> Community Rules
          </div>
          <h1 className="text-4xl font-bold font-display text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            By using LiveTalk by Likki, you agree to these simple rules designed to keep our community safe and fun.
          </p>
        </motion.section>

        <section className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent" /> 1. Age Requirement
            </h2>
            <p>
              You must be at least 18 years old to use LiveTalk. By accessing this service, you represent and warrant that you meet this age requirement.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Ban className="h-5 w-5 text-accent" /> 2. Prohibited Conduct
            </h2>
            <p>
              You agree not to use LiveTalk for any illegal activity, harassment, hate speech, or the distribution of explicit content without consent. We reserve the right to ban users who violate these guidelines.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> 3. User Responsibility
            </h2>
            <p>
              You are solely responsible for your interactions with other users. LiveTalk is an anonymous platform, and you should exercise caution when sharing any information with strangers.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" /> 4. Disclaimer of Liability
            </h2>
            <p>
              LiveTalk by Likki is provided "as is" without any warranties. We are not responsible for the behavior of our users or for any consequences arising from your use of the platform.
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

export default TermsPage;
