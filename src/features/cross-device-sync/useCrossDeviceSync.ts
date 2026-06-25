import { useState, useEffect, useCallback, useRef } from "react";
import {
  createSessionToken,
  validateSessionToken,
  consumeSessionToken,
  buildHandoffUrl,
} from "./sessionTokens";
import {
  registerParticipant,
  subscribeParticipants,
  getDeviceLabel,
  attachParticipantPresence,
} from "./participantRegistry";
import {
  requestWebRTCRenegotiation,
  notifyDeviceHandoff,
  RENEGOTIATE_EVENT,
  DEVICE_HANDOFF_EVENT,
} from "./webrtcRenegotiation";
import type { SessionToken, ParticipantRecord } from "./types";

interface UseCrossDeviceSyncOptions {
  roomId: string | null;
  sessionId: string;
  enabled?: boolean;
  sendSignaling?: (event: string, payload: Record<string, unknown>) => void;
  onHandoffReceived?: (newSessionId: string) => void;
}

export function useCrossDeviceSync({
  roomId,
  sessionId,
  enabled = true,
  sendSignaling,
  onHandoffReceived,
}: UseCrossDeviceSyncOptions) {
  const [sessionToken, setSessionToken] = useState<SessionToken | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string>("");
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const sendRef = useRef(sendSignaling);
  useEffect(() => { sendRef.current = sendSignaling; }, [sendSignaling]);

  const issueToken = useCallback(async () => {
    if (!roomId) return null;
    const token = await createSessionToken(roomId, sessionId);
    setSessionToken(token);
    setHandoffUrl(buildHandoffUrl(roomId, token.token));
    return token;
  }, [roomId, sessionId]);

  const claimHandoff = useCallback(
    async (token: string, targetRoomId: string) => {
      if (targetRoomId !== roomId && roomId) return false;
      const valid = await validateSessionToken(targetRoomId, token);
      if (!valid) return false;
      const ok = await consumeSessionToken(targetRoomId, token, sessionId);
      if (!ok) return false;

      await registerParticipant(targetRoomId, sessionId, getDeviceLabel(), false);
      sendRef.current?.(DEVICE_HANDOFF_EVENT, {
        senderId: sessionId,
        token,
        newSessionId: sessionId,
      });
      return true;
    },
    [roomId, sessionId]
  );

  useEffect(() => {
    if (!enabled || !roomId) return;

    registerParticipant(roomId, sessionId, getDeviceLabel(), true).catch(console.warn);
    let detachPresence: (() => void) | undefined;
    attachParticipantPresence(roomId, sessionId).then((d) => { detachPresence = d; });

    const unsub = subscribeParticipants(roomId, (list) => {
      setParticipants(list);
      if (list.length > 1 && sendRef.current) {
        requestWebRTCRenegotiation(
          sendRef.current,
          sessionId,
          "participant_change",
          list.length
        );
      }
    });

    issueToken().catch(console.warn);

    return () => {
      unsub();
      detachPresence?.();
    };
  }, [enabled, roomId, sessionId, issueToken]);

  useEffect(() => {
    if (!sendSignaling) return;
    // Parent wires signaling events; expose handler via return
  }, [sendSignaling]);

  const handleSignalingEvent = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (event === DEVICE_HANDOFF_EVENT) {
        const p = payload as { newSessionId?: string; senderId?: string };
        if (p.newSessionId && p.newSessionId !== sessionId) {
          onHandoffReceived?.(p.newSessionId);
        }
      }
      if (event === RENEGOTIATE_EVENT) {
        // Video call hook handles offer/answer cycle
      }
    },
    [sessionId, onHandoffReceived]
  );

  return {
    sessionToken,
    handoffUrl,
    participants,
    issueToken,
    claimHandoff,
    handleSignalingEvent,
    notifyHandoff: (token: string, newSessionId: string) => {
      if (sendRef.current) notifyDeviceHandoff(sendRef.current, sessionId, token, newSessionId);
    },
  };
}
