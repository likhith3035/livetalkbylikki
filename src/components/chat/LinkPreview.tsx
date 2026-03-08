import { ExternalLink } from "lucide-react";

interface LinkPreviewProps {
  text: string;
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

const LinkPreview = ({ text }: LinkPreviewProps) => {
  const urls = text.match(URL_REGEX);
  if (!urls || urls.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {urls.slice(0, 2).map((url, i) => {
        let hostname = "";
        try {
          hostname = new URL(url).hostname;
        } catch {
          hostname = url;
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center gap-2 rounded-lg bg-secondary/60 border border-border/50 px-2.5 py-1.5 text-[11px] text-primary hover:bg-secondary transition-colors group"
          >
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
            <span className="truncate min-w-0">{hostname}</span>
          </a>
        );
      })}
    </div>
  );
};

export default LinkPreview;
