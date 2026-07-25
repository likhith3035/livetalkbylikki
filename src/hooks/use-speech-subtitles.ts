import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SubtitleLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUBTITLE_LANGUAGES: SubtitleLanguage[] = [
  { code: "te-IN", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "hi-IN", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "es-ES", name: "Spanish (Español)", flag: "🇲🇽" },
  { code: "fr-FR", name: "French (Français)", flag: "🇫🇷" },
  { code: "de-DE", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ja-JP", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "pt-BR", name: "Portuguese (Português)", flag: "🇵🇹" },
  { code: "it-IT", name: "Italian (Italiano)", flag: "🇮🇹" },
  { code: "zh-CN", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ko-KR", name: "Korean (한국어)", flag: "🇰🇷" },
  { code: "ar-SA", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "ru-RU", name: "Russian (Русский)", flag: "🇷🇺" },
  { code: "tr-TR", name: "Turkish (Türkçe)", flag: "🇹🇷" },
];

async function translateToEnglish(text: string, fromLangCode: string): Promise<string> {
  if (!text.trim()) return text;
  const srcPair = fromLangCode.split("-")[0];
  if (srcPair === "en") return text;

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcPair}|en`);
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return `${text} ➔ English: "${data.responseData.translatedText}"`;
    }
  } catch (e) {
    // Return original transcript on network error
  }
  return text;
}

interface UseSpeechSubtitlesOptions {
  defaultLang?: string;
  enabled?: boolean;
}

export function useSpeechSubtitles({ defaultLang = "te-IN", enabled = false }: UseSpeechSubtitlesOptions = {}) {
  const [subtitle, setSubtitle] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [selectedLang, setSelectedLang] = useState<string>(defaultLang);
  const [autoTranslateToEnglish, setAutoTranslateToEnglish] = useState<boolean>(true);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const hideTimeoutRef = useRef<any>(null);

  const startSubtitles = useCallback((langCode?: string) => {
    const targetLangCode = langCode || selectedLang;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Subtitles Not Supported",
        description: "Web Speech API is not supported in this browser. Try Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = targetLangCode;

      recognition.onstart = () => {
        setIsActive(true);
        setSubtitle(`🎙️ Subtitles active (${targetLangCode}) - Speak in Telugu or your native language...`);
      };

      recognition.onresult = async (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setSubtitle(currentTranscript);

          // Auto-translate to English if enabled and source language is non-English
          if (autoTranslateToEnglish && !targetLangCode.startsWith("en")) {
            const translated = await translateToEnglish(currentTranscript, targetLangCode);
            setSubtitle(translated);
          }

          // Clear hide timer
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setSubtitle("");
          }, 5000);
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== "no-speech") {
          console.warn("[Subtitles] Speech recognition error:", err.error);
        }
      };

      recognition.onend = () => {
        if (enabled && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Ignored
          }
        } else {
          setIsActive(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("[Subtitles] Failed to initialize speech recognition:", e);
      setIsActive(false);
    }
  }, [selectedLang, autoTranslateToEnglish, enabled, toast]);

  const stopSubtitles = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignored
      }
      recognitionRef.current = null;
    }
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsActive(false);
    setSubtitle("");
  }, []);

  const toggleSubtitles = useCallback(() => {
    if (isActive) {
      stopSubtitles();
    } else {
      startSubtitles();
    }
  }, [isActive, startSubtitles, stopSubtitles]);

  const changeLanguage = useCallback((langCode: string) => {
    setSelectedLang(langCode);
    if (isActive) {
      startSubtitles(langCode);
    }
  }, [isActive, startSubtitles]);

  useEffect(() => {
    if (enabled) {
      startSubtitles();
    } else {
      stopSubtitles();
    }
    return () => {
      stopSubtitles();
    };
  }, [enabled, startSubtitles, stopSubtitles]);

  return {
    subtitle,
    isActive,
    isSupported,
    selectedLang,
    autoTranslateToEnglish,
    setAutoTranslateToEnglish,
    changeLanguage,
    startSubtitles,
    stopSubtitles,
    toggleSubtitles,
    SUBTITLE_LANGUAGES,
  };
}
