import { ReactNode } from "react";
import DesktopSidebar from "@/components/DesktopSidebar";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import PwaInstallModal from "@/components/PwaInstallModal";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="w-full h-svh h-screen overflow-hidden flex flex-col">
      <div className="flex w-full h-full min-h-0 overflow-hidden flex-1">
        <DesktopSidebar />

        {/* Content area — scrollable for landing pages, fits 100% height for chat app */}
        <div className="flex min-w-0 flex-1 flex-col h-full min-h-0 overflow-y-auto relative">
          {children}
        </div>
      </div>
      <PwaInstallBanner />
      <PwaInstallModal />
    </div>
  );
};

export default AppShell;
