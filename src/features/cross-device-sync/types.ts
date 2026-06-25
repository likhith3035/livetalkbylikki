export interface SessionToken {
  token: string;
  roomId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy: string | null;
}

export interface ParticipantRecord {
  sessionId: string;
  deviceLabel: string;
  joinedAt: number;
  isPrimary: boolean;
  online: boolean;
}

export interface HandoffPayload {
  token: string;
  roomId: string;
  newSessionId: string;
}
