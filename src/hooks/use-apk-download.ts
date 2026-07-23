import { useState, useCallback, useRef } from "react";

export interface ApkInfo {
  version: string;
  size: string;
  sizeBytes: number;
  lastUpdated: string;
  url: string;
  isNew?: boolean;
}

export const GITHUB_RELEASE_APK_URL =
  "https://livetalkbylikki.netlify.app/livetalk.apk";

// APK is hosted directly on Netlify
export const APK_INFO: ApkInfo = {
  version: "1.5.0",
  size: "7.2 MB",
  sizeBytes: 7243451,
  lastUpdated: "July 24, 2026",
  url: GITHUB_RELEASE_APK_URL,
  isNew: true,
};

export type DownloadState = "idle" | "downloading" | "done" | "error";

export function useApkDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const download = useCallback(() => {
    setDownloadState("downloading");
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("GET", APK_INFO.url, true);
    xhr.responseType = "blob";

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.min(Math.round((e.loaded / e.total) * 100), 99));
      } else {
        setProgress(Math.min(Math.round((e.loaded / APK_INFO.sizeBytes) * 100), 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = new Blob([xhr.response], {
          type: "application/vnd.android.package-archive",
        });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `LiveTalk-v${APK_INFO.version}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        setProgress(100);
        setDownloadState("done");
        setShowGuide(true);
      } else {
        handleError();
      }
    };

    xhr.onerror = handleError;
    xhr.onabort = () => setDownloadState("idle");

    xhr.send();

    function handleError() {
      console.log("[APK] XHR fallback to direct link:", APK_INFO.url);
      window.open(APK_INFO.url, "_blank");
      setDownloadState("done");
      setShowGuide(true);
    }
  }, []);

  const resetDownload = useCallback(() => {
    xhrRef.current?.abort();
    setDownloadState("idle");
    setProgress(0);
  }, []);

  const closeGuide = useCallback(() => {
    setShowGuide(false);
    setTimeout(resetDownload, 400);
  }, [resetDownload]);

  return {
    apkInfo: APK_INFO,
    downloadState,
    progress,
    showGuide,
    download,
    resetDownload,
    closeGuide,
  };
}
