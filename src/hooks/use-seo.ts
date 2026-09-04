import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  schema?: Record<string, any> | Record<string, any>[];
  breadcrumbTitle?: string;
}

const DEFAULT_DESC = "Free anonymous chat & WebRTC video platform by Likhith Kami (Likki). Speak Freely. Stay Incognito. Connect instantly with strangers worldwide — no signup, no tracking. Features 1v1 arcade games, private rooms, AI chat & AES-256 encrypted file sharing.";
const DEFAULT_KEYWORDS = "incogtalk, incogtalkk, incog talk, incog talkk, incogtalkk netlify, incogtalk netlify, incogchat, speak freely stay incognito, omegle alternative, anonymous chat, video chat strangers, random chat, talk to strangers online, free chat app, 1v1 arcade games, encrypted file sharing, likhith kami, likki";
const DEFAULT_IMAGE = "https://incogtalkk.netlify.app/og-image.jpg";

export const useSEO = ({ title, description, keywords, image, schema, breadcrumbTitle }: SEOProps) => {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes("IncogTalk") ? title : `${title} | IncogTalk`)
      : `IncogTalk (IncogTalkk) – Speak Freely. Stay Incognito | #1 Omegle Alternative & Anonymous Video Chat`;
    const fullDesc = description || DEFAULT_DESC;
    const fullKeywords = keywords
      ? `${keywords}, incogtalk, incogtalkk, incog talk, incog talkk, speak freely stay incognito, likhith kami, likki, omegle alternative`
      : DEFAULT_KEYWORDS;
    const fullImage = image || DEFAULT_IMAGE;

    // Prefer official production domain for canonical and breadcrumb schemas
    const origin = (typeof window !== "undefined" && (window.location.hostname.includes("netlify.app") || window.location.hostname.includes("incogtalk")))
      ? window.location.origin
      : "https://incogtalkk.netlify.app";
    const cleanUrl = origin + (typeof window !== "undefined" ? window.location.pathname : "");

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
    setTag('meta[property="og:site_name"]', "content", "IncogTalk (IncogTalkk) by Likhith Kami");

    setTag('meta[name="twitter:title"]', "content", fullTitle);
    setTag('meta[name="twitter:description"]', "content", fullDesc);
    setTag('meta[name="twitter:image"]', "content", fullImage);
    setTag('meta[name="twitter:creator"]', "content", "@likhith_kami");

    // Dynamic Page-Level Structured Data (JSON-LD)
    const existingSchemaScript = document.getElementById("page-dynamic-schema-ld");
    if (existingSchemaScript) {
      existingSchemaScript.remove();
    }

    const schemasToInject: any[] = [];

    // Auto-generate breadcrumb schema for subpages
    if (window.location.pathname !== "/" && window.location.pathname !== "") {
      const pageName = breadcrumbTitle || title?.split("–")[0]?.split("|")[0]?.trim() || "Page";
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://incogtalkk.netlify.app/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": pageName,
            "item": cleanUrl
          }
        ]
      });
    }

    if (schema) {
      if (Array.isArray(schema)) {
        schemasToInject.push(...schema);
      } else {
        schemasToInject.push(schema);
      }
    }

    if (schemasToInject.length > 0) {
      const script = document.createElement("script");
      script.id = "page-dynamic-schema-ld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(schemasToInject.length === 1 ? schemasToInject[0] : {
        "@context": "https://schema.org",
        "@graph": schemasToInject
      });
      document.head.appendChild(script);
    }

    return () => {
      const cleanupScript = document.getElementById("page-dynamic-schema-ld");
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [title, description, keywords, image, schema, breadcrumbTitle]);
};
