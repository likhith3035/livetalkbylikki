import { Shield, User } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";

const ProfilePage = () => {
  const onlineCount = useOnlineCount();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onlineCount={onlineCount} />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary border border-border">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-display text-foreground">Anonymous User</h1>
          <p className="text-sm text-muted-foreground">No profile needed. That's the point.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
          <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
            <p className="text-2xl font-bold font-display text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">Chats today</p>
          </div>
          <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary">100%</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Private</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
