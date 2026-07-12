import { ReactNode } from "react";
import DesktopSidebar from "@/components/DesktopSidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="w-full min-h-svh">
      <div className="flex w-full min-h-svh">
        <DesktopSidebar />

        {/* Content area — this scrolls independently, sidebar stays fixed */}
        <div className="flex min-w-0 flex-1 flex-col min-h-svh overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
