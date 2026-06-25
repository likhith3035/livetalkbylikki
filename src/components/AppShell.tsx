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
        "min-h-svh w-full",
        settings.liquidGlassEnabled && "lg:p-4"
      )}
    >
      <div
        className={cn(
          "flex w-full min-h-svh lg:min-h-[calc(100svh-2rem)]",
          settings.liquidGlassEnabled && "lg:gap-4"
        )}
      >
        <DesktopSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
