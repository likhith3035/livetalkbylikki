import { useState, useCallback, useRef } from "react";

export type TargetLanguage = "off" | "en" | "es" | "fr" | "de" | "hi" | "te" | "ta" | "ja" | "pt" | "ar" | "ko";

export const SUPPORTED_LANGUAGES: { code: TargetLanguage; name: string; flag: string }[] = [
  { code: "off", name: "Original", flag: "🌐" },
  { code: "te",  name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ta",  name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "hi",  name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "en",  name: "English",  flag: "🇺🇸" },
  { code: "es",  name: "Spanish",  flag: "🇪🇸" },
  { code: "fr",  name: "French",   flag: "🇫🇷" },
  { code: "de",  name: "German",   flag: "🇩🇪" },
  { code: "ja",  name: "Japanese", flag: "🇯🇵" },
  { code: "pt",  name: "Portuguese", flag: "🇧🇷" },
  { code: "ar",  name: "Arabic",   flag: "🇸🇦" },
  { code: "ko",  name: "Korean",   flag: "🇰🇷" },
];

export function useChatTranslator() {
  const [targetLang, setTargetLang] = useState<TargetLanguage>("off");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const cacheRef = useRef<Map<string, string>>(new Map());

  const translateMessage = useCallback(async (msgId: string, text: string) => {
    if (targetLang === "off" || !text.trim()) return;

    const cacheKey = `${msgId}_${targetLang}`;
    if (cacheRef.current.has(cacheKey)) {
      setTranslations((prev) => ({ ...prev, [msgId]: cacheRef.current.get(cacheKey)! }));
      return;
    }

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
      );
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        cacheRef.current.set(cacheKey, translated);
        setTranslations((prev) => ({ ...prev, [msgId]: translated }));
      }
    } catch (err) {
      console.warn("[Translator] Failed to translate:", err);
    }
  }, [targetLang]);

  return {
    targetLang,
    setTargetLang,
    translations,
    translateMessage,
  };
}

export default useChatTranslator;
