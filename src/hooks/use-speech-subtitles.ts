import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const SPOKEN_LANGUAGES: LanguageOption[] = [
  { code: "en-US", name: "English (US/UK)", flag: "🇺🇸" },
  { code: "te-IN", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "es-ES", name: "Spanish (Español)", flag: "🇲🇽" },
  { code: "fr-FR", name: "French (Français)", flag: "🇫🇷" },
  { code: "de-DE", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ja-JP", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "zh-CN", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ko-KR", name: "Korean (한국어)", flag: "🇰🇷" },
  { code: "ar-SA", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "pt-BR", name: "Portuguese (Português)", flag: "🇵🇹" },
  { code: "it-IT", name: "Italian (Italiano)", flag: "🇮🇹" },
  { code: "ru-RU", name: "Russian (Русский)", flag: "🇷🇺" },
  { code: "tr-TR", name: "Turkish (Türkçe)", flag: "🇹🇷" },
];

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "hi", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "ta", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇲🇽" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
];

async function translateText(text: string, fromCode: string, toCode: string): Promise<string> {
  if (!text.trim()) return text;
  const src = fromCode.split("-")[0];
  const tgt = toCode.split("-")[0];

  if (src === tgt) return text;

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`);
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return `${text} ➔ ${data.responseData.translatedText}`;
    }
  } catch (e) {
    console.warn("[Subtitles] Translation fetch failed:", e);
  }
  return text;
}

interface UseSpeechSubtitlesOptions {
  defaultFromLang?: string;
  defaultToLang?: string;
  enabled?: boolean;
}

export function useSpeechSubtitles({
  defaultFromLang = "en-US",
  defaultToLang = "en",
  enabled = false,
}: UseSpeechSubtitlesOptions = {}) {
  const [subtitle, setSubtitle] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [fromLang, setFromLang] = useState<string>(defaultFromLang);
  const [toLang, setToLang] = useState<string>(defaultToLang);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const hideTimeoutRef = useRef<any>(null);

  const startSubtitles = useCallback((overrideFrom?: string) => {
    const activeFrom = overrideFrom || fromLang;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Subtitles Not Supported",
        description: "Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeFrom;

      recognition.onstart = () => {
        setIsActive(true);
        const fromObj = SPOKEN_LANGUAGES.find((l) => l.code === activeFrom);
        setSubtitle(`🎙️ Subtitles active (${fromObj ? fromObj.name : activeFrom}) - Speak into mic...`);
      };

      recognition.onresult = async (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setSubtitle(currentTranscript);

          const srcCode = activeFrom.split("-")[0];
          const tgtCode = toLang.split("-")[0];

          if (srcCode !== tgtCode) {
            const translated = await translateText(currentTranscript, activeFrom, toLang);
            setSubtitle(translated);
          }

          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setSubtitle("");
          }, 5000);
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error === "not-allowed") {
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access in your browser settings to enable live subtitles.",
            variant: "destructive",
          });
          setIsActive(false);
        } else if (err.error !== "no-speech") {
          console.warn("[Subtitles] Speech recognition error:", err.error);
        }
      };

      recognition.onend = () => {
        if (enabled && recognitionRef.current) {
          try { recognition.start(); } catch (e) {}
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
  }, [fromLang, toLang, enabled, toast]);

  const stopSubtitles = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
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

  const updateFromLanguage = useCallback((code: string) => {
    setFromLang(code);
    if (isActive) {
      startSubtitles(code);
    }
  }, [isActive, startSubtitles]);

  const updateToLanguage = useCallback((code: string) => {
    setToLang(code);
  }, []);

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
    fromLang,
    toLang,
    setFromLang: updateFromLanguage,
    setToLang: updateToLanguage,
    startSubtitles,
    stopSubtitles,
    toggleSubtitles,
    SPOKEN_LANGUAGES,
    TARGET_LANGUAGES,
  };
}
