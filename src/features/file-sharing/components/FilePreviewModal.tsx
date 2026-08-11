import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedFileItem } from "../types";
import { formatBytes } from "../utils/cryptoCode";
import { Download, FileText, Eye, AlertCircle, ExternalLink } from "lucide-react";
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
  if (!file) return null;

  const { name, size, category, mimeType, url } = file;

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
      <DialogContent className="max-w-3xl w-[95vw] p-5 sm:p-6 rounded-2xl bg-card border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
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
        <div className="flex-1 min-h-[250px] max-h-[60vh] overflow-auto flex items-center justify-center p-2 bg-background/60 rounded-xl border border-border/60 my-3">
          {category === "images" && (
            <img src={url} alt={name} className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-md" />
          )}

          {category === "videos" && (
            <video controls className="max-h-[55vh] max-w-full rounded-lg shadow-md">
              <source src={url} type={mimeType} />
              Your browser does not support video playback.
            </video>
          )}

          {category === "audio" && (
            <div className="w-full max-w-md p-6 bg-card rounded-2xl border border-border text-center space-y-4 shadow-lg">
              <div className="text-4xl">🎵</div>
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <audio controls src={url} className="w-full" />
            </div>
          )}

          {mimeType.includes("pdf") && (
            <iframe src={url} className="w-full h-[55vh] rounded-lg border border-border" title={name} />
          )}

          {category === "documents" && !mimeType.includes("pdf") && (
            <div className="w-full p-4 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto bg-card rounded-xl border border-border/60">
              <p className="text-muted-foreground italic pb-2">Document Preview:</p>
              <iframe src={url} className="w-full h-[40vh] border-none" title={name} />
            </div>
          )}

          {category === "archives" && (
            <div className="text-center space-y-3 p-6">
              <div className="text-5xl">📦</div>
              <p className="text-sm font-bold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">ZIP Archive ({formatBytes(size)})</p>
              <Button onClick={handleDownloadClick} className="text-xs gap-1.5 rounded-xl">
                <Download className="h-3.5 w-3.5" /> Download ZIP Contents
              </Button>
            </div>
          )}

          {category === "other" && (
            <div className="text-center space-y-3 p-6">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Preview Unavailable</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                This file format ({file.name.split(".").pop()}) cannot be previewed in browser.
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
