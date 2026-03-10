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
        // Set title
        document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} – Talk to Anyone Instantly`;

        // Set meta description
        if (description) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement("meta");
                meta.setAttribute("name", "description");
                document.head.appendChild(meta);
            }
            meta.setAttribute("content", description);
        }

        return () => {
            document.title = `${BASE_TITLE} – Talk to Anyone Instantly`;
        };
    }, [title, description]);
};
