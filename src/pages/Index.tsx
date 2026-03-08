import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import FeatureBadges from "@/components/FeatureBadges";
import BottomNav from "@/components/BottomNav";
import { useChat } from "@/hooks/use-chat";

const Index = () => {
  const navigate = useNavigate();
  const { onlineCount } = useChat();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-24">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold font-display leading-tight text-foreground">
            Connect
            <br />
            Anonymously
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            No registration. No tracking.
            <br />
            Just real talk with real people.
          </p>
        </div>

        <Button
          variant="glow"
          size="lg"
          className="w-full max-w-sm h-16 text-lg font-semibold rounded-2xl"
          onClick={() => navigate("/chat")}
        >
          <MessageSquare className="h-5 w-5" />
          Start Chatting
        </Button>

        <FeatureBadges />
      </main>

      <footer className="pb-20 text-center space-y-3">
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground transition-colors">About</span>
          <span className="cursor-pointer hover:text-foreground transition-colors">Safety</span>
          <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
        </div>
        <p className="text-xs text-muted-foreground/60">© 2026 Echo Labs. Speak freely.</p>
      </footer>

      <BottomNav />
    </div>
  );
};

export default Index;
