import React from "react";

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
  const current = (avatar || fallback).trim();
  const isImage = current.startsWith("data:image/") || current.startsWith("http://") || current.startsWith("https://");

  if (isImage) {
    return (
      <img
        src={current}
        alt="Avatar"
        className={`${sizeClassName} object-cover rounded-xl ${className}`}
        onError={(e) => {
          // If image fails to load, fallback to emoji
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
    );
  }

  // Safe emoji or short string rendering (limit to 4 characters so long corrupted strings never explode)
  const safeText = current.length > 8 ? fallback : current;

  return (
    <span className={`select-none flex items-center justify-center leading-none ${className}`}>
      {safeText}
    </span>
  );
};
