import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
}

const BASE_TITLE = "LiveTalk by Likhith Kami (Likki)";
const DEFAULT_DESC = "Free anonymous chat app by Likhith Kami (Likki). Talk to strangers instantly — no signup, no tracking. Video calls, games, private rooms & more. The #1 Omegle alternative.";
const DEFAULT_KEYWORDS = "likhith livetalk, likki livetalk, likhith websites, kami likhith, kami likhith websites, likhith portfolio, kami likhith portfolio, likhith kami, likhith kami developer, likki developer, likhith kami chat app, likhith kami project, likkimeet, likkitalk, likkichat, livetalk, live talk, livetalkbylikki, livetalk by likki, livetalk chat, livetalk app, omegle alternative, omegle 2, anonymous chat, chat with strangers, random chat, video chat strangers, talk to strangers, free chat app";
const DEFAULT_IMAGE = "https://livetalkbylikki.netlify.app/og-image.jpg";

export const useSEO = ({ title, description, keywords, image }: SEOProps) => {
    useEffect(() => {
        const fullTitle = title
            ? `${title} | LiveTalk by Likhith Kami`
            : `LiveTalk by Likhith Kami (Likki) – Anonymous Chat & Video`;
        const fullDesc = description || DEFAULT_DESC;
        const fullKeywords = keywords
            ? `${keywords}, likhith kami, likki, kami likhith, likhith livetalk, likki livetalk`
            : DEFAULT_KEYWORDS;
        const fullImage = image || DEFAULT_IMAGE;
        const currentUrl = window.location.href;

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
        setTag('link[rel="canonical"]', "href", currentUrl, true);

        setTag('meta[property="og:title"]', "content", fullTitle);
        setTag('meta[property="og:description"]', "content", fullDesc);
        setTag('meta[property="og:image"]', "content", fullImage);
        setTag('meta[property="og:url"]', "content", currentUrl);
        setTag('meta[property="og:site_name"]', "content", "LiveTalk by Likhith Kami");

        setTag('meta[name="twitter:title"]', "content", fullTitle);
        setTag('meta[name="twitter:description"]', "content", fullDesc);
        setTag('meta[name="twitter:image"]', "content", fullImage);
        setTag('meta[name="twitter:creator"]', "content", "@likhith_kami");
    }, [title, description, keywords, image]);
};
