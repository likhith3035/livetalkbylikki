export interface RoomMeta {
  roomId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  type: "private" | "temp";
  participantCount: number;
}

export interface RoomMediaRef {
  path: string;
  uploadedAt: number;
}
