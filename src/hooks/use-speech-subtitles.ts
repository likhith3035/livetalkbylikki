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

async function translateText(text: string, fromCode: string, toCode: string, signal?: AbortSignal): Promise<string> {
  if (!text.trim()) return text;
  const src = fromCode.split("-")[0];
  const tgt = toCode.split("-")[0];

  if (src === tgt) return text;

  // Primary: Google Translate Free Endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translated = data[0].map((item: any) => item[0]).join("");
      if (translated) {
        return `${text} ➔ ${translated}`;
      }
    }
  } catch (e) {
    if (signal?.aborted) return text;
    // Fallthrough to Secondary
  }

  // Secondary: MyMemory Translate API
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`, { signal });
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return `${text} ➔ ${data.responseData.translatedText}`;
    }
  } catch (e) {
    // Fallthrough to raw text
  }

  return text;
}

interface UseSpeechSubtitlesOptions {
  defaultFromLang?: string;
  defaultToLang?: string;
}

export function useSpeechSubtitles({
  defaultFromLang = "en-US",
  defaultToLang = "en",
}: UseSpeechSubtitlesOptions = {}) {
  const [subtitle, setSubtitle] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [fromLang, setFromLang] = useState<string>(defaultFromLang);
  const [toLang, setToLang] = useState<string>(defaultToLang);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const hideTimeoutRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const translateDebounceRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldRunRef = useRef<boolean>(false);

  const stopSubtitles = useCallback(() => {
    shouldRunRef.current = false;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsActive(false);
    setSubtitle("");
  }, []);

  const startSubtitles = useCallback((overrideFrom?: string) => {
    const activeFrom = overrideFrom || fromLang;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Subtitles Not Supported",
        description: "Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      stopSubtitles();
      shouldRunRef.current = true;

      const initRecognition = () => {
        if (!shouldRunRef.current) return;
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = activeFrom;

          recognition.onstart = () => {
            setIsActive(true);
            const fromObj = SPOKEN_LANGUAGES.find((l) => l.code === activeFrom);
            setSubtitle(`🎙️ Subtitles Active (${fromObj ? fromObj.name : activeFrom}) - Listening...`);
          };

          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            let isFinalChunk = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
              if (event.results[i].isFinal) isFinalChunk = true;
            }

            if (currentTranscript.trim()) {
              setSubtitle(currentTranscript);

              const srcCode = activeFrom.split("-")[0];
              const tgtCode = toLang.split("-")[0];

              if (srcCode !== tgtCode) {
                if (translateDebounceRef.current) clearTimeout(translateDebounceRef.current);
                translateDebounceRef.current = setTimeout(async () => {
                  if (!shouldRunRef.current) return;
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                  abortControllerRef.current = new AbortController();

                  const translated = await translateText(
                    currentTranscript,
                    activeFrom,
                    toLang,
                    abortControllerRef.current.signal
                  );
                  if (shouldRunRef.current && translated) {
                    setSubtitle(translated);
                  }
                }, isFinalChunk ? 100 : 350);
              }

              if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = setTimeout(() => {
                if (shouldRunRef.current) {
                  setSubtitle("");
                }
              }, 6000);
            }
          };

          recognition.onerror = (err: any) => {
            if (err.error === "not-allowed") {
              toast({
                title: "Microphone Access Required",
                description: "Please allow microphone access in your browser settings to enable live subtitles.",
                variant: "destructive",
              });
              shouldRunRef.current = false;
              setIsActive(false);
            } else if (err.error !== "no-speech") {
              console.warn("[Subtitles] Speech recognition error:", err.error);
            }
          };

          recognition.onend = () => {
            if (shouldRunRef.current) {
              if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
              restartTimeoutRef.current = setTimeout(() => {
                if (shouldRunRef.current) {
                  initRecognition();
                }
              }, 300);
            } else {
              setIsActive(false);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
          setIsActive(true);
        } catch (e) {
          console.warn("[Subtitles] Failed to initialize speech recognition:", e);
          if (shouldRunRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              if (shouldRunRef.current) initRecognition();
            }, 1000);
          } else {
            setIsActive(false);
          }
        }
      };

      initRecognition();
    } catch (e) {
      console.warn("[Subtitles] Failed to initialize speech recognition:", e);
      setIsActive(false);
    }
  }, [fromLang, toLang, stopSubtitles, toast]);

  const toggleSubtitles = useCallback(() => {
    if (isActive || shouldRunRef.current) {
      stopSubtitles();
      toast({
        title: "Subtitles Disabled",
        description: "Live video captions turned off.",
      });
    } else {
      startSubtitles();
      toast({
        title: "Subtitles Enabled",
        description: `Listening in ${fromLang.split("-")[0].toUpperCase()} and translating to ${toLang.toUpperCase()}`,
      });
    }
  }, [isActive, startSubtitles, stopSubtitles, fromLang, toLang, toast]);

  const updateFromLanguage = useCallback((code: string) => {
    setFromLang(code);
    if (shouldRunRef.current) {
      startSubtitles(code);
    }
  }, [startSubtitles]);

  const updateToLanguage = useCallback((code: string) => {
    setToLang(code);
  }, []);

  useEffect(() => {
    return () => {
      stopSubtitles();
    };
  }, [stopSubtitles]);

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
