/** Ephemeral room lifetime — metadata only, no persistent accounts */
export const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes active room
export const ROOM_LOBBY_TTL_MS = 5 * 60 * 1000; // 5 minutes waiting lobby
export const SESSION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes for device handoff
export const HANDOFF_CODE_LENGTH = 8;
export const AI_BOT_SESSION_ID = "ai-bot";
export const AI_BOT_NAME = "IncogTalk AI";

export const generateShortCode = (length: number, alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};
