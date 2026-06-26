import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import DesktopSidebar from "@/components/DesktopSidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { settings } = useSettings();

  return (
    <div
      className={cn(
        "w-full",
        settings.liquidGlassEnabled ? "lg:p-4 h-svh overflow-hidden" : "min-h-svh"
      )}
    >
      <div
        className={cn(
          "flex w-full",
          settings.liquidGlassEnabled
            ? "lg:gap-4 h-full"
            : "min-h-svh"
        )}
      >
        <DesktopSidebar />

        {/* Content area — this scrolls independently, sidebar stays fixed */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            settings.liquidGlassEnabled
              ? "overflow-y-auto overflow-x-hidden"
              : "min-h-svh overflow-x-hidden"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
