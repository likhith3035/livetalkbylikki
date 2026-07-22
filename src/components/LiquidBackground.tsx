import { useSettings, LIQUID_GLASS_PRESETS } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const LiquidBackground = () => {
  const { settings } = useSettings();

  if (!settings.liquidGlassEnabled) return null;

  const preset = LIQUID_GLASS_PRESETS[settings.glassPreset] || LIQUID_GLASS_PRESETS.ios;
  const colors = preset.colors;

  const speed = settings.liquidBgSpeed;
  const duration1 = speed === 0 ? 0 : Math.max(14, 52 - speed * 4);
  const duration2 = speed === 0 ? 0 : Math.max(18, 64 - speed * 4.8);
  const duration3 = speed === 0 ? 0 : Math.max(12, 44 - speed * 3.2);
  const duration4 = speed === 0 ? 0 : Math.max(20, 72 - speed * 5.2);
  const isAnimated = speed > 0;

  return (
    <div
      className={cn(
        "fixed inset-0 -z-50 overflow-hidden pointer-events-none",
        settings.darkMode ? "bg-[#09090b]" : "bg-[#f8f9fa]"
      )}
    >
      {/* Orb 1 */}
      <div
        className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-1")}
        style={{
          width: "60vw", height: "60vw",
          left: "5%", top: "5%",
          background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
          filter: "blur(70px)",
          opacity: settings.darkMode ? 0.28 : 0.38,
          animationDuration: isAnimated ? `${duration1}s` : "0s",
          willChange: isAnimated ? "transform" : "auto",
        }}
      />
      {/* Orb 2 */}
      <div
        className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-2")}
        style={{
          width: "55vw", height: "55vw",
          right: "5%", top: "30%",
          background: `radial-gradient(circle, ${colors[1] || colors[0]} 0%, transparent 70%)`,
          filter: "blur(70px)",
          opacity: settings.darkMode ? 0.25 : 0.35,
          animationDuration: isAnimated ? `${duration2}s` : "0s",
          willChange: isAnimated ? "transform" : "auto",
        }}
      />
      {/* Orb 3 — desktop only */}
      <div
        className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-3")}
        style={{
          width: "45vw", height: "45vw",
          left: "20%", bottom: "10%",
          background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 70%)`,
          filter: "blur(65px)",
          opacity: settings.darkMode ? 0.22 : 0.32,
          animationDuration: isAnimated ? `${duration3}s` : "0s",
          willChange: isAnimated ? "transform" : "auto",
        }}
      />
      {/* Orb 4 — desktop only */}
      <div
        className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-4")}
        style={{
          width: "50vw", height: "50vw",
          right: "20%", bottom: "15%",
          background: `radial-gradient(circle, ${colors[3] || colors[1] || colors[0]} 0%, transparent 70%)`,
          filter: "blur(65px)",
          opacity: settings.darkMode ? 0.20 : 0.30,
          animationDuration: isAnimated ? `${duration4}s` : "0s",
          willChange: isAnimated ? "transform" : "auto",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: settings.darkMode
            ? "radial-gradient(circle at 50% 50%, transparent 20%, rgba(9,9,11,0.5) 100%)"
            : "radial-gradient(circle at 50% 50%, transparent 20%, rgba(243,244,246,0.4) 100%)",
        }}
      />
    </div>
  );
};

export default LiquidBackground;
