import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

const DEFAULT_DESC = "Free anonymous chat & video platform by Likhith Kami (Likki). Connect instantly with strangers worldwide — no signup, no tracking. Features video call, games, private rooms & AI chat.";
const DEFAULT_KEYWORDS = "livetalk, live talk, livetalk by likki, livetalkbylikki, live talk app, likhith kami, likki, omegle alternative, anonymous chat, video chat strangers, random chat, talk to strangers online, free chat app, livetalk chat";
const DEFAULT_IMAGE = "https://livetalkbylikki.netlify.app/og-image.jpg";

export const useSEO = ({ title, description, keywords, image }: SEOProps) => {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | LiveTalk by Likhith Kami`
      : `LiveTalk by Likhith Kami (Likki) – Anonymous Chat & Video`;
    const fullDesc = description || DEFAULT_DESC;
    const fullKeywords = keywords
      ? `${keywords}, livetalk, likhith kami, likki, omegle alternative`
      : DEFAULT_KEYWORDS;
    const fullImage = image || DEFAULT_IMAGE;

    // Strip query parameters to maintain clean canonical and OpenGraph URLs
    const cleanUrl = window.location.origin + window.location.pathname;

    document.title = fullTitle;

    const setTag = (selector: string, attr: string, value: string, isLink = false) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement(isLink ? "link" : "meta");
        if (isLink) {
          const match = selector.match(/rel="([^"]+)"/);
          if (match) el.setAttribute("rel", match[1]);
        } else {
          const nameMatch = selector.match(/name="([^"]+)"/);
          const propMatch = selector.match(/property="([^"]+)"/);
          if (nameMatch) el.setAttribute("name", nameMatch[1]);
          else if (propMatch) el.setAttribute("property", propMatch[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setTag('meta[name="description"]', "content", fullDesc);
    setTag('meta[name="keywords"]', "content", fullKeywords);
    setTag('meta[name="author"]', "content", "Likhith Kami");
    setTag('link[rel="canonical"]', "href", cleanUrl, true);

    setTag('meta[property="og:title"]', "content", fullTitle);
    setTag('meta[property="og:description"]', "content", fullDesc);
    setTag('meta[property="og:image"]', "content", fullImage);
    setTag('meta[property="og:url"]', "content", cleanUrl);
    setTag('meta[property="og:site_name"]', "content", "LiveTalk by Likhith Kami");

    setTag('meta[name="twitter:title"]', "content", fullTitle);
    setTag('meta[name="twitter:description"]', "content", fullDesc);
    setTag('meta[name="twitter:image"]', "content", fullImage);
    setTag('meta[name="twitter:creator"]', "content", "@likhith_kami");
  }, [title, description, keywords, image]);
};
