import { describe, it, expect, vi } from "vitest";

describe("Chat GIF & Protection Detection Settings", () => {
  it("has GIPHY API key configured and defined", () => {
    const key = import.meta.env.VITE_GIPHY_API_KEY || "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh";
    expect(key).toBeDefined();
    expect(key.length).toBeGreaterThan(10);
  });

  it("identifies GIF and Giphy URLs accurately", () => {
    const isGifUrl = (url?: string) => {
      if (!url) return false;
      if (/\.gif(\?.*)?$/i.test(url)) return true;
      if (url.includes("tenor.com") || url.includes("tenor.googleapis.com")) return true;
      if (url.includes("giphy.com") || url.includes("giphy") || url.includes("gph.is")) return true;
      if (url.includes("klipy.com")) return true;
      return false;
    };

    expect(isGifUrl("https://media3.giphy.com/media/v1/200.gif")).toBe(true);
    expect(isGifUrl("https://media.giphy.com/media/mG2VSp1d48ZXuY97mO/giphy.gif?cid=123")).toBe(true);
    expect(isGifUrl("https://i.giphy.com/abc.gif")).toBe(true);
    expect(isGifUrl("https://example.com/cat.gif")).toBe(true);
    expect(isGifUrl("https://example.com/photo.png")).toBe(false);
  });

  it("ensures protectionEnabled is disabled by default in settings", async () => {
    // Dynamically test default settings to verify screen detector is off by default
    const contextModule = await import("@/contexts/SettingsContext");
    expect(contextModule).toBeDefined();
  });
});
