/** WebRTC renegotiation helpers — signaling stays on Firebase, media stays P2P */

export const RENEGOTIATE_EVENT = "webrtc:renegotiate";
export const DEVICE_HANDOFF_EVENT = "device:handoff";

export interface RenegotiatePayload {
  senderId: string;
  reason: "device_joined" | "device_handoff" | "participant_change";
  participantCount: number;
}

export interface DeviceHandoffPayload {
  senderId: string;
  token: string;
  newSessionId: string;
}

export function requestWebRTCRenegotiation(
  sendSignaling: (event: string, payload: Record<string, unknown>) => void,
  sessionId: string,
  reason: RenegotiatePayload["reason"],
  participantCount: number
): void {
  sendSignaling(RENEGOTIATE_EVENT, {
    senderId: sessionId,
    reason,
    participantCount,
  } satisfies RenegotiatePayload);
}

export function notifyDeviceHandoff(
  sendSignaling: (event: string, payload: Record<string, unknown>) => void,
  sessionId: string,
  token: string,
  newSessionId: string
): void {
  sendSignaling(DEVICE_HANDOFF_EVENT, {
    senderId: sessionId,
    token,
    newSessionId,
  } satisfies DeviceHandoffPayload);
}

/** Handle renegotiate on an active peer connection — caller creates new offer */
export async function handleRenegotiateOffer(
  pc: RTCPeerConnection,
  sendSignaling: (event: string, payload: Record<string, unknown>) => void,
  sessionId: string
): Promise<void> {
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);
  sendSignaling("webrtc:offer", {
    senderId: sessionId,
    offer: pc.localDescription?.toJSON(),
    renegotiation: true,
  });
}
