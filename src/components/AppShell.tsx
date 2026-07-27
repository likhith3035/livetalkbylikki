import { ReactNode } from "react";
import DesktopSidebar from "@/components/DesktopSidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="w-full h-svh h-screen overflow-hidden flex flex-col">
      <div className="flex w-full h-full overflow-hidden flex-1">
        <DesktopSidebar />

        {/* Content area — strictly locked to viewport height so chat list scrolls inside its container */}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
