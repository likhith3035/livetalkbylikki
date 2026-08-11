import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedFileItem } from "../types";
import { formatBytes } from "../utils/cryptoCode";
import { Download, AlertCircle, FileCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: SharedFileItem | null;
  onDownload?: (file: SharedFileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onDownload,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isTextLoading, setIsTextLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setTextContent(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isTextFile =
      ["txt", "md", "json", "js", "ts", "tsx", "jsx", "py", "css", "html", "sql", "xml", "csv", "sh", "env", "yml", "yaml"].includes(ext) ||
      file.mimeType.includes("text") ||
      file.mimeType.includes("json");

    if (isTextFile && file.url) {
      setIsTextLoading(true);
      fetch(file.url)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text.slice(0, 150000)); // limit 150k chars for performance
          setIsTextLoading(false);
        })
        .catch(() => {
          setTextContent(null);
          setIsTextLoading(false);
        });
    } else {
      setTextContent(null);
      setIsTextLoading(false);
    }
  }, [file]);

  if (!file) return null;

  const { name, size, category, mimeType, url } = file;
  const ext = name.split(".").pop()?.toLowerCase() || "";

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(file);
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.click();
      toast.success(`Downloading ${name}...`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-5 sm:p-6 rounded-2xl bg-card border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="space-y-1 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs uppercase font-mono border-primary/30 text-primary">
              {category} • {formatBytes(size)}
            </Badge>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadClick}
              className="text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>

          <DialogTitle className="text-base sm:text-lg font-display font-bold text-foreground truncate pt-1">
            {name}
          </DialogTitle>
        </DialogHeader>

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-[300px] max-h-[65vh] overflow-auto flex items-center justify-center p-2 bg-background/60 rounded-xl border border-border/60 my-3">
          {category === "images" && (
            <img src={url} alt={name} className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md" />
          )}

          {category === "videos" && (
            <video controls className="max-h-[60vh] max-w-full rounded-lg shadow-md">
              <source src={url} type={mimeType} />
              Your browser does not support video playback.
            </video>
          )}

          {category === "audio" && (
            <div className="w-full max-w-md p-6 bg-card rounded-2xl border border-border text-center space-y-4 shadow-lg">
              <div className="text-5xl">🎵</div>
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <audio controls src={url} className="w-full" />
            </div>
          )}

          {mimeType.includes("pdf") && (
            <iframe src={url} className="w-full h-[60vh] rounded-lg border border-border" title={name} />
          )}

          {/* Text/Code Live Preview */}
          {isTextLoading && (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">Loading code preview...</p>
            </div>
          )}

          {!isTextLoading && textContent !== null && (
            <div className="w-full h-[60vh] overflow-auto p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-primary">
                  <FileCode className="h-3.5 w-3.5" /> .{ext.toUpperCase()} Source File
                </span>
                <span>{textContent.length.toLocaleString()} chars</span>
              </div>
              <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
            </div>
          )}

          {!isTextLoading && textContent === null && category === "documents" && !mimeType.includes("pdf") && (
            <iframe src={url} className="w-full h-[55vh] border-none rounded-xl" title={name} />
          )}

          {!isTextLoading && textContent === null && category === "archives" && (
            <div className="text-center space-y-3 p-6">
              <div className="text-5xl">📦</div>
              <p className="text-sm font-bold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">ZIP Archive ({formatBytes(size)})</p>
              <Button onClick={handleDownloadClick} className="text-xs gap-1.5 rounded-xl">
                <Download className="h-3.5 w-3.5" /> Download ZIP Contents
              </Button>
            </div>
          )}

          {!isTextLoading && textContent === null && category === "other" && (
            <div className="text-center space-y-3 p-6">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Preview Unavailable</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                This file format (.{ext}) cannot be previewed in browser.
              </p>
              <Button onClick={handleDownloadClick} className="text-xs gap-1.5 rounded-xl">
                <Download className="h-3.5 w-3.5" /> Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
