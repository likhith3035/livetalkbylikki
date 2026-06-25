// Cross-device sync
export { useCrossDeviceSync } from "./cross-device-sync/useCrossDeviceSync";
export { DeviceHandoffPanel } from "./cross-device-sync/DeviceHandoffPanel";
export { createSessionToken, buildHandoffUrl, validateSessionToken, consumeSessionToken } from "./cross-device-sync/sessionTokens";
export { registerParticipant, subscribeParticipants, getDeviceLabel } from "./cross-device-sync/participantRegistry";
export { requestWebRTCRenegotiation, RENEGOTIATE_EVENT, DEVICE_HANDOFF_EVENT } from "./cross-device-sync/webrtcRenegotiation";
export type { SessionToken, ParticipantRecord } from "./cross-device-sync/types";

// Temporary rooms
export { createTempRoom, getRoomMeta, attachRoomPresence, registerRoomMedia } from "./temp-rooms/roomService";
export { cleanupExpiredRoom, sweepExpiredRooms } from "./temp-rooms/mediaCleanup";
export { useTempRoomLifecycle } from "./temp-rooms/useTempRoomLifecycle";
export type { RoomMeta } from "./temp-rooms/types";

// AI games
export { useAIGameSession } from "./ai-games/useAIGameSession";
export { AIOpponentPanel } from "./ai-games/AIOpponentPanel";
export { AIThinkingIndicator } from "./ai-games/AIThinkingIndicator";
export { bestTttMove, getWinner } from "./ai-games/ai/tttMinimax";
export { randomRpsChoice, rpsOutcome } from "./ai-games/ai/rpsRandom";
export { fetchTriviaQuestion } from "./ai-games/ai/triviaApi";

// Shared
export { AI_BOT_SESSION_ID, AI_BOT_NAME, ROOM_TTL_MS, SESSION_TOKEN_TTL_MS } from "./shared/constants";
