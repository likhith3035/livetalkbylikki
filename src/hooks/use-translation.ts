import { useState, useCallback } from "react";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLang: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = useCallback(
    async (text: string, targetLang = "en"): Promise<TranslationResult | null> => {
      if (!text || text.trim().length === 0) return null;

      setIsTranslating(true);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          text
        )}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Translation request failed");

        const data = await res.json();
        // Google translate GTX endpoint format: [[["translated_text", "source_text"]], null, "detected_lang"]
        const translatedText = data[0]?.map((item: any[]) => item[0]).join("") || text;
        const detectedSourceLang = data[2] || "auto";

        return {
          translatedText,
          detectedSourceLang,
        };
      } catch (err) {
        console.warn("[Translation] Failed to translate:", err);
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  return {
    isTranslating,
    translateText,
  };
}
