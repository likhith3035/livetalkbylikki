import React, { useState } from "react";

interface GameAvatarProps {
  avatar?: string | null;
  fallback?: string;
  className?: string;
  sizeClassName?: string;
}

export const GameAvatar: React.FC<GameAvatarProps> = ({
  avatar,
  fallback = "👾",
  className = "",
  sizeClassName = "w-full h-full",
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const current = (avatar || fallback).trim();

  // Normalize raw base64 strings if missing data: URI prefix
  let imageSrc = current;
  if (
    current.startsWith("/9j/") ||
    current.startsWith("iVBORw") ||
    current.startsWith("R0lGOD") ||
    current.startsWith("UklGR")
  ) {
    imageSrc = `data:image/jpeg;base64,${current}`;
  }

  const isImage =
    !imgFailed &&
    (imageSrc.startsWith("data:") ||
      imageSrc.startsWith("http://") ||
      imageSrc.startsWith("https://") ||
      imageSrc.startsWith("blob:"));

  if (isImage) {
    return (
      <img
        src={imageSrc}
        alt="Avatar"
        className={`${sizeClassName} object-cover rounded-xl ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Safe emoji or short string rendering (limit to 8 characters so corrupted/base64 strings never explode into text)
  const safeText = current.length > 8 ? fallback : current;

  return (
    <span
      className={`select-none flex items-center justify-center leading-none overflow-hidden max-w-full ${className}`}
    >
      {safeText}
    </span>
  );
};
