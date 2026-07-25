import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseSpeechSubtitlesOptions {
  targetLang?: string;
  enabled?: boolean;
}

export function useSpeechSubtitles({ targetLang = "en", enabled = false }: UseSpeechSubtitlesOptions = {}) {
  const [subtitle, setSubtitle] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const hideTimeoutRef = useRef<any>(null);

  const startSubtitles = useCallback(() => {
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
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsActive(true);
        setSubtitle("🎙️ Subtitles active - speak into mic...");
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setSubtitle(currentTranscript);

          // Clear hide timer
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setSubtitle("");
          }, 4500);
        }
      };

      recognition.onerror = (err: any) => {
        if (err.error !== "no-speech") {
          console.warn("[Subtitles] Speech recognition error:", err.error);
        }
      };

      recognition.onend = () => {
        // Auto restart if still enabled
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
  }, [enabled, toast]);

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
    startSubtitles,
    stopSubtitles,
    toggleSubtitles,
  };
}
