import { useSettings, LIQUID_GLASS_PRESETS } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const LiquidBackground = () => {
  const { settings } = useSettings();

  if (!settings.liquidGlassEnabled) return null;

  const preset = LIQUID_GLASS_PRESETS[settings.glassPreset] || LIQUID_GLASS_PRESETS.ios;
  const colors = preset.colors;

  const speed = settings.liquidBgSpeed;
  // Slower on mobile — detect via CSS, we use longer durations
  const duration1 = speed === 0 ? 0 : Math.max(12, 52 - speed * 4);
  const duration2 = speed === 0 ? 0 : Math.max(16, 64 - speed * 4.8);
  const duration3 = speed === 0 ? 0 : Math.max(10, 44 - speed * 3.2);
  const duration4 = speed === 0 ? 0 : Math.max(18, 72 - speed * 5.2);

  const isAnimated = speed > 0;

  return (
    <>
      {/*
        Keyframes injected once — use a stable id so the browser doesn't
        recreate the rule on every render when settings are unchanged.
        Using CSS custom properties for durations avoids a full style reinject.
      */}
      <style>{`
        @keyframes lg-float-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33%       { transform: translate3d(18vw, 14vh, 0) scale(1.12); }
          66%       { transform: translate3d(-9vw, 28vh, 0) scale(0.88); }
        }
        @keyframes lg-float-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%       { transform: translate3d(-22vw, -9vh, 0) scale(1.18); }
        }
        @keyframes lg-float-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.92); }
          40%       { transform: translate3d(13vw, -22vh, 0) scale(1.08); }
        }
        @keyframes lg-float-4 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.12); }
          60%       { transform: translate3d(-13vw, 18vh, 0) scale(0.92); }
        }

        /* Mobile: cap blur to 60px for the container to avoid GPU overload */
        @media (max-width: 768px) {
          .lg-orb-wrap { filter: blur(60px) !important; }
        }

        .lg-orb-1 { animation: lg-float-1 ${duration1}s ease-in-out infinite; }
        .lg-orb-2 { animation: lg-float-2 ${duration2}s ease-in-out infinite; }
        .lg-orb-3 { animation: lg-float-3 ${duration3}s ease-in-out infinite; }
        .lg-orb-4 { animation: lg-float-4 ${duration4}s ease-in-out infinite; }
      `}</style>

      <div
        className={cn(
          "fixed inset-0 -z-50 overflow-hidden pointer-events-none transition-colors duration-700",
          settings.darkMode
            ? "bg-[#09090b]"
            : "bg-[#f8f9fa]"
        )}
      >
        {/*
          Key performance change: each orb gets its OWN blur wrapper so the browser
          can composite each one independently on the GPU, rather than blurring one
          giant container (which forces a single massive texture each frame).
          contain: strict isolates paint/layout to each orb's box.
        */}
        <div
          className="absolute inset-0"
          style={{ isolation: "isolate" }}
        >
          {/* Orb 1 */}
          <div
            className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-1")}
            style={{
              width: "55vw", height: "55vw",
              left: "10%", top: "10%",
              background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
              filter: "blur(80px)",
              opacity: 0.22,
              mixBlendMode: "screen",
              contain: "strict",
              willChange: isAnimated ? "transform" : "auto",
            }}
          />
          {/* Orb 2 */}
          <div
            className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-2")}
            style={{
              width: "60vw", height: "60vw",
              right: "5%", top: "25%",
              background: `radial-gradient(circle, ${colors[1] || colors[0]} 0%, transparent 70%)`,
              filter: "blur(80px)",
              opacity: 0.2,
              mixBlendMode: "screen",
              contain: "strict",
              willChange: isAnimated ? "transform" : "auto",
            }}
          />
          {/* Orb 3 */}
          <div
            className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-3")}
            style={{
              width: "45vw", height: "45vw",
              left: "20%", bottom: "10%",
              background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 70%)`,
              filter: "blur(70px)",
              opacity: 0.18,
              mixBlendMode: "screen",
              contain: "strict",
              willChange: isAnimated ? "transform" : "auto",
            }}
          />
          {/* Orb 4 */}
          <div
            className={cn("absolute rounded-full transform-gpu", isAnimated && "lg-orb-4")}
            style={{
              width: "50vw", height: "50vw",
              right: "25%", bottom: "20%",
              background: `radial-gradient(circle, ${colors[3] || colors[1] || colors[0]} 0%, transparent 70%)`,
              filter: "blur(75px)",
              opacity: 0.16,
              mixBlendMode: "screen",
              contain: "strict",
              willChange: isAnimated ? "transform" : "auto",
            }}
          />
        </div>

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: settings.darkMode
              ? "radial-gradient(circle at 50% 50%, transparent 20%, rgba(9,9,11,0.45) 100%)"
              : "radial-gradient(circle at 50% 50%, transparent 20%, rgba(243,244,246,0.35) 100%)",
          }}
        />
      </div>
    </>
  );
};

export default LiquidBackground;
