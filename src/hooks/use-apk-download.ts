import { useState, useCallback } from "react";

export interface ApkInfo {
  version: string;
  size: string;
  sizeBytes: number;
  lastUpdated: string;
  url: string;
  isNew?: boolean;
}

// Update this whenever you release a new APK
export const APK_INFO: ApkInfo = {
  version: "1.0.0",
  size: "7.2 MB",
  sizeBytes: 7521491,
  lastUpdated: "May 31, 2026",
  // Direct APK download URL — update this to your GitHub Release or CDN link
  url: "https://github.com/likhith3035/livetalkbylikki/releases/latest/download/app-debug.apk",
  isNew: false,
};

export type DownloadState = "idle" | "downloading" | "done" | "error";

export function useApkDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const download = useCallback(async () => {
    setDownloadState("downloading");
    setProgress(0);

    try {
      // Try fetch with progress tracking
      const response = await fetch(APK_INFO.url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : APK_INFO.sizeBytes;
      const reader = response.body?.getReader();

      if (!reader) throw new Error("No reader");

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setProgress(Math.min(Math.round((received / total) * 100), 99));
      }

      const blob = new Blob(chunks, { type: "application/vnd.android.package-archive" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveTalk-v${APK_INFO.version}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setDownloadState("done");
      setShowGuide(true);
    } catch (err) {
      console.error("[APK Download] failed:", err);
      // Fallback: direct link
      const a = document.createElement("a");
      a.href = APK_INFO.url;
      a.download = `LiveTalk-v${APK_INFO.version}.apk`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadState("done");
      setShowGuide(true);
    }
  }, []);

  const resetDownload = useCallback(() => {
    setDownloadState("idle");
    setProgress(0);
  }, []);

  const closeGuide = useCallback(() => {
    setShowGuide(false);
    setTimeout(resetDownload, 400);
  }, [resetDownload]);

  return {
    downloadState,
    progress,
    showGuide,
    download,
    closeGuide,
    apkInfo: APK_INFO,
  };
}
