import { forwardRef } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Lock } from "lucide-react";

interface ShareRoomCardProps {
  roomCode: string;
}

export const ShareRoomCard = forwardRef<HTMLDivElement, ShareRoomCardProps>(({ roomCode }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "1200px",
        height: "630px",
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        background: "linear-gradient(135deg, #09090B 0%, #18181B 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Background Orbs */}
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: "600px", height: "600px", background: "rgba(139, 92, 246, 0.2)", filter: "blur(120px)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "-100px", right: "-100px", width: "600px", height: "600px", background: "rgba(59, 130, 246, 0.2)", filter: "blur(120px)", borderRadius: "50%" }} />

      {/* Content Container */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        gap: "40px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "40px",
        padding: "80px 120px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <BrandLogo style={{ width: "80px", height: "80px" }} />
          <h1 style={{ fontSize: "64px", fontWeight: 900, margin: 0, fontStyle: "italic", textTransform: "uppercase", tracking: "tighter" }}>IncogTalk</h1>
        </div>

        {/* Info Text */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "rgba(255, 255, 255, 0.6)", fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "4px" }}>
            <Lock size={28} />
            Private Room Invite
          </div>
          <p style={{ fontSize: "20px", color: "rgba(255, 255, 255, 0.4)", margin: 0 }}>Join this secure, encrypted chat anonymously.</p>
        </div>

        {/* Room Code Box */}
        <div style={{ 
          background: "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))", 
          border: "2px solid rgba(139, 92, 246, 0.5)", 
          borderRadius: "24px", 
          padding: "30px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "4px" }}>Room Code</span>
          <span style={{ fontSize: "96px", fontWeight: 900, fontFamily: "monospace", letterSpacing: "16px", color: "white", textShadow: "0 0 30px rgba(139, 92, 246, 0.5)", margin: 0, lineHeight: 1 }}>{roomCode}</span>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "20px", fontSize: "20px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "bold" }}>
          incogtalkk.netlify.app
        </div>
      </div>
    </div>
  );
});

ShareRoomCard.displayName = "ShareRoomCard";
