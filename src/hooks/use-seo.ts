import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
}

const BASE_TITLE = "LiveTalk";

/**
 * Sets the document title and meta description for each page.
 * Google uses these for search result snippets.
 */
export const useSEO = ({ title, description }: SEOProps) => {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} – Talk to Anyone Instantly`;
        const fullDesc = description || "Connect instantly with people worldwide. Anonymous text and video chat with zero registration required.";
        const currentUrl = window.location.href;

        // Set title
        document.title = fullTitle;

        // Helper to set/update meta/link tags
        const setTag = (selector: string, attr: string, value: string, isLink = false) => {
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement(isLink ? "link" : "meta");
                if (isLink) {
                    el.setAttribute("rel", selector.match(/rel="([^"]+)"/)?.[1] || "");
                } else {
                    el.setAttribute(selector.includes("property") ? "property" : "name", selector.match(/="(.*)"/)?.[1] || "");
                }
                document.head.appendChild(el);
            }
            el.setAttribute(attr, value);
        };

        // Standard Meta
        setTag('meta[name="description"]', "content", fullDesc);

        // Canonical
        setTag('link[rel="canonical"]', "href", currentUrl, true);

        // OpenGraph
        setTag('meta[property="og:title"]', "content", fullTitle);
        setTag('meta[property="og:description"]', "content", fullDesc);
        setTag('meta[property="og:url"]', "content", currentUrl);

        // Twitter
        setTag('meta[name="twitter:title"]', "content", fullTitle);
        setTag('meta[name="twitter:description"]', "content", fullDesc);

        return () => {
            // Optional: reset to defaults if needed, but usually fine to leave for the next page
        };
    }, [title, description]);
};
