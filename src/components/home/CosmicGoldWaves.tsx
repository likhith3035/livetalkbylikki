import React from "react";
import { cn } from "@/lib/utils";

interface CosmicGoldWavesProps {
  className?: string;
}

export const CosmicGoldWaves: React.FC<CosmicGoldWavesProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-gradient-to-b from-[#faf7f2] via-[#f7f2e7] to-[#f5eedc] dark:from-[#08090d] dark:via-[#08090d] dark:to-[#08090d]",
        className
      )}
      aria-hidden="true"
    >
      {/* Scoped Keyframe Animations */}
      <style>{`
        @keyframes nebulaBreath1 {
          0%, 100% { opacity: 0.35; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.55; transform: scale(1.06) translate(10px, -8px); }
        }
        @keyframes nebulaBreath2 {
          0%, 100% { opacity: 0.25; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.4; transform: scale(1.04) translate(-12px, 6px); }
        }
        @keyframes nebulaBreath3 {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes waveDrift1 {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(18px) translateY(-8px); }
          50% { transform: translateX(0px) translateY(4px); }
          75% { transform: translateX(-16px) translateY(-4px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes waveDrift2 {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-14px) translateY(6px); }
          50% { transform: translateX(4px) translateY(-6px); }
          75% { transform: translateX(20px) translateY(3px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes waveDrift3 {
          0% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(12px) translateY(5px); }
          66% { transform: translateX(-10px) translateY(-7px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes waveDrift4 {
          0% { transform: translateX(0) translateY(0); }
          30% { transform: translateX(-8px) translateY(-5px); }
          60% { transform: translateX(14px) translateY(8px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes rimPulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.4; }
        }
        @keyframes rimGlow {
          0%, 100% { filter: url(#goldGlow) drop-shadow(0 0 6px rgba(229,169,59,0.3)); }
          50% { filter: url(#goldGlow) drop-shadow(0 0 14px rgba(229,169,59,0.6)); }
        }
        @keyframes shimmer {
          0%, 100% { stroke-opacity: 0.4; }
          50% { stroke-opacity: 0.8; }
        }
        .cosmic-nebula-1 { animation: nebulaBreath1 12s ease-in-out infinite; will-change: transform, opacity; }
        .cosmic-nebula-2 { animation: nebulaBreath2 15s ease-in-out infinite; will-change: transform, opacity; }
        .cosmic-nebula-3 { animation: nebulaBreath3 18s ease-in-out infinite; will-change: transform, opacity; }
        .cosmic-wave-1 { animation: waveDrift1 20s ease-in-out infinite; will-change: transform; }
        .cosmic-wave-2 { animation: waveDrift2 25s ease-in-out infinite; will-change: transform; }
        .cosmic-wave-3 { animation: waveDrift3 30s ease-in-out infinite; will-change: transform; }
        .cosmic-wave-4 { animation: waveDrift4 22s ease-in-out infinite; will-change: transform; }
        .cosmic-rim-pulse { animation: rimPulse 8s ease-in-out infinite; will-change: opacity; }
        .cosmic-rim-glow { animation: rimGlow 6s ease-in-out infinite; }
        .cosmic-shimmer { animation: shimmer 4s ease-in-out infinite; }
      `}</style>

      {/* Ambient Celestial Radial Nebulas — now breathing */}
      <div
        className="absolute w-[800px] h-[600px] -right-[150px] top-[40px] rounded-full pointer-events-none dark:opacity-80 cosmic-nebula-1"
        style={{
          background:
            "radial-gradient(ellipse at 70% 35%, rgba(229, 169, 59, 0.25) 0%, rgba(212, 140, 24, 0.1) 32%, rgba(180, 100, 15, 0.03) 55%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-[600px] h-[500px] -left-[180px] top-[80px] rounded-full pointer-events-none dark:opacity-60 cosmic-nebula-2"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(229, 169, 59, 0.16) 0%, rgba(200, 125, 20, 0.05) 40%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute w-[900px] h-[400px] left-1/2 -translate-x-1/2 top-[180px] rounded-full pointer-events-none dark:opacity-40 cosmic-nebula-3"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(212, 140, 24, 0.08) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* SVG Canvas with Cosmic Glowing Arcs and Flowing Ribbons */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Golden Gradient 1 for primary wave */}
          <linearGradient id="goldRibbonGrad1" x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#f7d082" stopOpacity="0.15" />
            <stop offset="25%" stopColor="#e5a93b" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#fce7a2" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#d48c18" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8c580b" stopOpacity="0.1" />
          </linearGradient>

          {/* Golden Gradient 2 for secondary wave */}
          <linearGradient id="goldRibbonGrad2" x1="0%" y1="60%" x2="100%" y2="40%">
            <stop offset="0%" stopColor="#f5c76d" stopOpacity="0.1" />
            <stop offset="35%" stopColor="#e5a93b" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#fce7a2" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#b47414" stopOpacity="0.15" />
          </linearGradient>

          {/* Planet Rim Arc Gradient */}
          <linearGradient id="planetRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce7a2" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#e5a93b" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#b87310" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#784504" stopOpacity="0" />
          </linearGradient>

          {/* Left Arc Gradient */}
          <linearGradient id="leftRimGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fce7a2" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#e5a93b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b87310" stopOpacity="0" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="20" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Broad Ambient Filter */}
          <filter id="broadAmbientGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
        </defs>

        {/* ─── 1. CELESTIAL PLANETARY RIM (TOP RIGHT) ─── */}
        {/* Soft wide glow behind rim — pulsing */}
        <circle
          cx="1320"
          cy="220"
          r="260"
          stroke="url(#planetRimGrad)"
          strokeWidth="28"
          fill="none"
          className="cosmic-rim-pulse"
          filter="url(#broadAmbientGlow)"
        />
        {/* Crisp luminous planet rim arc — glowing */}
        <path
          d="M 1060 220 A 260 260 0 0 1 1380 470"
          stroke="url(#planetRimGrad)"
          strokeWidth="3.5"
          fill="none"
          className="cosmic-rim-glow"
        />
        <path
          d="M 1060 220 A 260 260 0 0 1 1380 470"
          stroke="#ffffff"
          strokeWidth="1"
          className="cosmic-shimmer"
          fill="none"
        />

        {/* ─── 2. LEFT CELESTIAL ARC ─── */}
        <path
          d="M 120 40 A 380 380 0 0 0 -80 320"
          stroke="url(#leftRimGrad)"
          strokeWidth="2"
          fill="none"
          filter="url(#goldGlow)"
          className="cosmic-shimmer"
        />

        {/* ─── 3. GLOWING ENERGY RIBBON WAVES (animated) ─── */}

        {/* Wave 1 group — drifting */}
        <g className="cosmic-wave-1">
          {/* Ambient Bloom Layer */}
          <path
            d="M -60 170 C 180 230, 360 110, 620 180 C 880 250, 1100 130, 1480 340"
            stroke="url(#goldRibbonGrad1)"
            strokeWidth="18"
            fill="none"
            opacity="0.3"
            filter="url(#broadAmbientGlow)"
          />
          {/* Medium Glow Ribbon */}
          <path
            d="M -60 170 C 180 230, 360 110, 620 180 C 880 250, 1100 130, 1480 340"
            stroke="url(#goldRibbonGrad1)"
            strokeWidth="5"
            fill="none"
            opacity="0.75"
            filter="url(#goldGlow)"
          />
          {/* Crisp Radiant Core Line */}
          <path
            d="M -60 170 C 180 230, 360 110, 620 180 C 880 250, 1100 130, 1480 340"
            stroke="url(#goldRibbonGrad1)"
            strokeWidth="2"
            fill="none"
          />
        </g>

        {/* Wave 2 group — drifting opposite direction */}
        <g className="cosmic-wave-2">
          {/* Ambient Bloom Layer */}
          <path
            d="M -80 280 C 220 290, 480 180, 780 250 C 1020 310, 1260 210, 1500 290"
            stroke="url(#goldRibbonGrad2)"
            strokeWidth="14"
            fill="none"
            opacity="0.25"
            filter="url(#broadAmbientGlow)"
          />
          {/* Medium Glow Ribbon */}
          <path
            d="M -80 280 C 220 290, 480 180, 780 250 C 1020 310, 1260 210, 1500 290"
            stroke="url(#goldRibbonGrad2)"
            strokeWidth="3.5"
            fill="none"
            opacity="0.7"
            filter="url(#goldGlow)"
          />
          {/* Crisp Core Line */}
          <path
            d="M -80 280 C 220 290, 480 180, 780 250 C 1020 310, 1260 210, 1500 290"
            stroke="url(#goldRibbonGrad2)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* Wave 3: Subtle Sweeping Ribbon — slow float */}
        <g className="cosmic-wave-3">
          <path
            d="M 520 190 C 740 230, 960 360, 1400 420"
            stroke="url(#goldRibbonGrad1)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            filter="url(#goldGlow)"
          />
        </g>

        {/* Wave 4: Delicate Golden Echo Wave — gentle sway */}
        <g className="cosmic-wave-4">
          <path
            d="M -40 220 C 240 260, 520 150, 840 220 C 1080 280, 1320 220, 1480 320"
            stroke="url(#goldRibbonGrad2)"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </g>
      </svg>

      {/* Subtle fine cosmic noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
};

export default CosmicGoldWaves;
