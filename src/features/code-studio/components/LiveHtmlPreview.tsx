import React, { useState, useMemo } from "react";
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildHtmlPreviewDocument } from "../services/codeExecutionService";

interface LiveHtmlPreviewProps {
  htmlContent: string;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export const LiveHtmlPreview: React.FC<LiveHtmlPreviewProps> = ({ htmlContent }) => {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const srcDoc = useMemo(() => {
    return buildHtmlPreviewDocument(htmlContent);
  }, [htmlContent, refreshKey]);

  const handleOpenNewTab = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background border border-border/50 rounded-xl overflow-hidden shadow-inner">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/40 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Interactive Preview</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Device viewport selectors */}
          <div className="flex items-center bg-background/80 border border-border/60 rounded-lg p-0.5 mr-2">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1 rounded-md transition-colors ${
                device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Desktop View"
              aria-label="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1 rounded-md transition-colors ${
                device === "tablet" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tablet View (768px)"
              aria-label="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1 rounded-md transition-colors ${
                device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Mobile View (375px)"
              aria-label="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="h-7 px-2 text-xs gap-1 hover:bg-muted cursor-pointer"
            title="Reload Preview"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNewTab}
            className="h-7 px-2 text-xs gap-1 hover:bg-muted cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Pop Out</span>
          </Button>
        </div>
      </div>

      {/* Iframe stage */}
      <div className="flex-1 bg-zinc-950/70 p-2 sm:p-4 flex items-center justify-center overflow-auto">
        <div
          className={`h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${getDeviceWidth()} border border-border/40`}
          style={{ minHeight: "260px" }}
        >
          <iframe
            key={refreshKey}
            srcDoc={srcDoc}
            title="Live Code Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0 block"
          />
        </div>
      </div>
    </div>
  );
};
