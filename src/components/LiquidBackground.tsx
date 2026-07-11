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
    <>
      <style>{`
        @keyframes lg-float-1 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          33%       { transform: translate3d(16vw,12vh,0) scale(1.1); }
          66%       { transform: translate3d(-8vw,24vh,0) scale(0.9); }
        }
        @keyframes lg-float-2 {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50%       { transform: translate3d(-18vw,-8vh,0) scale(1.15); }
        }
        @keyframes lg-float-3 {
          0%, 100% { transform: translate3d(0,0,0) scale(0.93); }
          40%       { transform: translate3d(12vw,-18vh,0) scale(1.07); }
        }
        @keyframes lg-float-4 {
          0%, 100% { transform: translate3d(0,0,0) scale(1.1); }
          60%       { transform: translate3d(-12vw,16vh,0) scale(0.93); }
        }
        .lg-orb-1 { animation: lg-float-1 ${duration1}s ease-in-out infinite; }
        .lg-orb-2 { animation: lg-float-2 ${duration2}s ease-in-out infinite; }
        .lg-orb-3 { animation: lg-float-3 ${duration3}s ease-in-out infinite; }
        .lg-orb-4 { animation: lg-float-4 ${duration4}s ease-in-out infinite; }

        /* Mobile: hide all orbs to prevent heavy rendering/scrolling lag */
        @media (max-width: 768px) {
          .lg-orb-1, .lg-orb-2, .lg-orb-3, .lg-orb-4 { display: none !important; }
        }
      `}</style>

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
            willChange: isAnimated ? "transform" : "auto",
          }}
        />
        {/* Orb 3 — desktop only (hidden on mobile via CSS) */}
        <div
          className={cn("absolute rounded-full transform-gpu lg-orb-3-el", isAnimated && "lg-orb-3")}
          style={{
            width: "45vw", height: "45vw",
            left: "20%", bottom: "10%",
            background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 70%)`,
            filter: "blur(65px)",
            opacity: settings.darkMode ? 0.22 : 0.32,
            willChange: isAnimated ? "transform" : "auto",
          }}
        />
        {/* Orb 4 — desktop only (hidden on mobile via CSS) */}
        <div
          className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-4")}
          style={{
            width: "50vw", height: "50vw",
            right: "20%", bottom: "15%",
            background: `radial-gradient(circle, ${colors[3] || colors[1] || colors[0]} 0%, transparent 70%)`,
            filter: "blur(65px)",
            opacity: settings.darkMode ? 0.20 : 0.30,
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
    </>
  );
};

export default LiquidBackground;
