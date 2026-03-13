import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
}

const BASE_TITLE = "LiveTalk by Likki";
const DEFAULT_DESC = "Connect instantly with people worldwide. Anonymous 18+ text and video chat with zero registration required. The #1 Omegle alternative.";
const DEFAULT_KEYWORDS = "likkitalk, likkichat, livetalk, live talk, livetalk chat, livetalk app, omegle alternative, omegle 2, anonymous chat, chat with strangers, random chat, video chat strangers, talk to strangers, likhith kami, likki";
const DEFAULT_IMAGE = "https://livetalkbylikki.netlify.app/logo.png";

/**
 * Sets the document title and meta tags for each page.
 * Google uses these for search result snippets.
 */
export const useSEO = ({ title, description, keywords, image }: SEOProps) => {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} – Talk to Anyone Instantly`;
        const fullDesc = description || DEFAULT_DESC;
        const fullKeywords = keywords || DEFAULT_KEYWORDS;
        const fullImage = image || DEFAULT_IMAGE;
        const currentUrl = window.location.href;

        // Set title
        document.title = fullTitle;

        // Helper to set/update meta/link tags
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

        // Standard Meta
        setTag('meta[name="description"]', "content", fullDesc);
        setTag('meta[name="keywords"]', "content", fullKeywords);

        // Canonical
        setTag('link[rel="canonical"]', "href", currentUrl, true);

        // OpenGraph
        setTag('meta[property="og:title"]', "content", fullTitle);
        setTag('meta[property="og:description"]', "content", fullDesc);
        setTag('meta[property="og:image"]', "content", fullImage);
        setTag('meta[property="og:url"]', "content", currentUrl);

        // Twitter
        setTag('meta[name="twitter:title"]', "content", fullTitle);
        setTag('meta[name="twitter:description"]', "content", fullDesc);
        setTag('meta[name="twitter:image"]', "content", fullImage);

        return () => {
            // Optional: cleanup or reset tags if needed
        };
    }, [title, description, keywords, image]);
};
