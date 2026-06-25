import { useSettings, LIQUID_GLASS_PRESETS } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

const LiquidBackground = () => {
  const { settings } = useSettings();

  if (!settings.liquidGlassEnabled) return null;

  // Retrieve current preset configurations
  const preset = LIQUID_GLASS_PRESETS[settings.glassPreset] || LIQUID_GLASS_PRESETS.ios;
  const colors = preset.colors;

  // Calculate dynamic animation durations based on settings.liquidBgSpeed
  const speed = settings.liquidBgSpeed;
  const duration1 = speed === 0 ? 0 : Math.max(8, 48 - speed * 4);
  const duration2 = speed === 0 ? 0 : Math.max(10, 58 - speed * 4.8);
  const duration3 = speed === 0 ? 0 : Math.max(6, 38 - speed * 3);
  const duration4 = speed === 0 ? 0 : Math.max(12, 68 - speed * 5.6);

  const isAnimated = speed > 0;

  return (
    <>
      {/* Inline styles for dynamically generated GPU-accelerated float keyframes */}
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0vw, 0vh) scale(1); }
          33% { transform: translate(20vw, 15vh) scale(1.15); }
          66% { transform: translate(-10vw, 30vh) scale(0.85); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0vw, 0vh) scale(1); }
          50% { transform: translate(-25vw, -10vh) scale(1.2); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0vw, 0vh) scale(0.9); }
          40% { transform: translate(15vw, -25vh) scale(1.1); }
        }
        @keyframes float-orb-4 {
          0%, 100% { transform: translate(0vw, 0vh) scale(1.15); }
          60% { transform: translate(-15vw, 20vh) scale(0.9); }
        }

        .orb-animated-1 { animation: float-orb-1 ${duration1}s ease-in-out infinite; }
        .orb-animated-2 { animation: float-orb-2 ${duration2}s ease-in-out infinite; }
        .orb-animated-3 { animation: float-orb-3 ${duration3}s ease-in-out infinite; }
        .orb-animated-4 { animation: float-orb-4 ${duration4}s ease-in-out infinite; }
      `}</style>

      <div 
        className={cn(
          "fixed inset-0 -z-50 overflow-hidden pointer-events-none transition-colors duration-700",
          settings.darkMode 
            ? "bg-[#09090b] bg-gradient-to-tr from-[#0a0a0c] via-[#0d0c11] to-[#08070b]" 
            : "bg-[#f8f9fa] bg-gradient-to-tr from-[#f3f4f6] via-[#eff1f5] to-[#f5f3f7]"
        )}
      >
        {/* Dynamic Fluid Blobs */}
        <div className="absolute inset-0 opacity-[0.22] dark:opacity-[0.26] filter blur-[90px] md:blur-[130px] transform-gpu">
          {/* Orb 1 */}
          <div 
            className={cn(
              "absolute rounded-full w-[55vw] h-[55vw] md:w-[35vw] md:h-[35vw] left-[10%] top-[10%] mix-blend-screen opacity-80 filter saturate-150 transform-gpu",
              isAnimated && "orb-animated-1"
            )}
            style={{ 
              background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
              transition: "background 1s ease" 
            }}
          />
          {/* Orb 2 */}
          <div 
            className={cn(
              "absolute rounded-full w-[65vw] h-[65vw] md:w-[40vw] md:h-[40vw] right-[5%] top-[25%] mix-blend-screen opacity-80 filter saturate-150 transform-gpu",
              isAnimated && "orb-animated-2"
            )}
            style={{ 
              background: `radial-gradient(circle, ${colors[1] || colors[0]} 0%, transparent 70%)`,
              transition: "background 1s ease" 
            }}
          />
          {/* Orb 3 */}
          <div 
            className={cn(
              "absolute rounded-full w-[45vw] h-[45vw] md:w-[30vw] md:h-[30vw] left-[20%] bottom-[10%] mix-blend-screen opacity-80 filter saturate-150 transform-gpu",
              isAnimated && "orb-animated-3"
            )}
            style={{ 
              background: `radial-gradient(circle, ${colors[2] || colors[0]} 0%, transparent 70%)`,
              transition: "background 1s ease" 
            }}
          />
          {/* Orb 4 */}
          <div 
            className={cn(
              "absolute rounded-full w-[50vw] h-[50vw] md:w-[32vw] md:h-[32vw] right-[25%] bottom-[20%] mix-blend-screen opacity-70 filter saturate-150 transform-gpu",
              isAnimated && "orb-animated-4"
            )}
            style={{ 
              background: `radial-gradient(circle, ${colors[3] || colors[1] || colors[0]} 0%, transparent 70%)`,
              transition: "background 1s ease" 
            }}
          />
        </div>

        {/* Global ambient lighting vignette */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" 
             style={{
               background: settings.darkMode
                 ? "radial-gradient(circle at 50% 50%, transparent 20%, rgba(9, 9, 11, 0.45) 100%)"
                 : "radial-gradient(circle at 50% 50%, transparent 20%, rgba(243, 244, 246, 0.35) 100%)"
             }}
        />
      </div>
    </>
  );
};

export default LiquidBackground;
