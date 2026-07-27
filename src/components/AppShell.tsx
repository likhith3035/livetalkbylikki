import { ReactNode } from "react";
import DesktopSidebar from "@/components/DesktopSidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="w-full h-dvh overflow-hidden bg-background">
      <div className="flex w-full h-dvh overflow-hidden">
        <DesktopSidebar />

        {/* Content area — exact viewport height, flex child manages scrolling */}
        <div className="flex min-w-0 flex-1 flex-col h-dvh overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
