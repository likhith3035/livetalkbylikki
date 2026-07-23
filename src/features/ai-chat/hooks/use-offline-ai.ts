import { useState, useCallback } from "react";

export function useOfflineAi() {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("livetalk_offline_ai_enabled") === "true";
  });
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const toggleOfflineMode = useCallback((enabled: boolean) => {
    setIsOfflineMode(enabled);
    localStorage.setItem("livetalk_offline_ai_enabled", enabled ? "true" : "false");
  }, []);

  const loadOfflineModel = useCallback(async () => {
    setLoadingProgress(10);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsModelLoaded(true);
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  }, []);

  const generateOfflineResponse = useCallback(
    async (prompt: string, personality = "Luna"): Promise<string> => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return `[Offline Local Engine - ${personality}] That's very interesting! Since we are running completely offline directly on your device, I can process "${prompt}" instantly without any internet connection! ⚡`;
    },
    []
  );

  return {
    isOfflineMode,
    isModelLoaded,
    loadingProgress,
    toggleOfflineMode,
    loadOfflineModel,
    generateOfflineResponse,
  };
}
